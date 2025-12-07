import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"
import cron from "node-cron"
import https from "https"
import { HttpsProxyAgent } from "https-proxy-agent"

function unifyId(platform: string, platformMarketId: string) {
  return `${platform}:${platformMarketId}`
}

function impliedProbFromPrice(price?: number) {
  if (price === undefined || price === null) return undefined
  if (price < 0) return 0
  if (price > 1) return 1
  return price
}

const prisma = new PrismaClient()

function loadFixture(name: string) {
  const p = path.join(__dirname, "../fixtures", `${name}.json`)
  const raw = fs.readFileSync(p, "utf-8")
  return JSON.parse(raw)
}

async function upsertMarket(m: any) {
  const id = unifyId(m.platform, m.platform_market_id)
  await prisma.market.upsert({
    where: { id },
    update: {
      platform: m.platform,
      title: m.title,
      description: m.description || "",
      category: m.category || "other",
      tags: Array.isArray(m.tags) ? m.tags.join(",") : "",
      status: m.status,
      resolve_time: m.resolve_time ? new Date(m.resolve_time) : null,
      close_time: m.close_time ? new Date(m.close_time) : null,
      currency: m.currency || "other",
      volume_24h: m.metrics?.volume_24h ?? null,
      volume_7d: m.metrics?.volume_7d ?? null,
      open_interest: m.metrics?.open_interest ?? null,
      fee_rate: m.metrics?.fee_rate ?? null
    },
    create: {
      id,
      platform: m.platform,
      title: m.title,
      description: m.description || "",
      category: m.category || "other",
      tags: Array.isArray(m.tags) ? m.tags.join(",") : "",
      status: m.status,
      resolve_time: m.resolve_time ? new Date(m.resolve_time) : null,
      close_time: m.close_time ? new Date(m.close_time) : null,
      currency: m.currency || "other",
      volume_24h: m.metrics?.volume_24h ?? null,
      volume_7d: m.metrics?.volume_7d ?? null,
      open_interest: m.metrics?.open_interest ?? null,
      fee_rate: m.metrics?.fee_rate ?? null
    }
  })
  for (const c of m.contracts || []) {
    const cid = `${id}:${c.code || c.name}`
    await prisma.contract.upsert({
      where: { id: cid },
      update: {
        market_id: id,
        name: c.name,
        last_price: c.last_price,
        best_bid: c.best_bid,
        best_ask: c.best_ask,
        implied_prob: impliedProbFromPrice(c.last_price),
        open_interest: c.open_interest,
        fee_rate: c.fee_rate
      },
      create: {
        id: cid,
        market_id: id,
        name: c.name,
        last_price: c.last_price,
        best_bid: c.best_bid,
        best_ask: c.best_ask,
        implied_prob: impliedProbFromPrice(c.last_price),
        open_interest: c.open_interest,
        fee_rate: c.fee_rate
      }
    })
  }
}

async function ingestOnce() {
  const items: any[] = []
  try {
    const fromPoly = await fetchPolymarketAll()
    console.log("polymarket fetched", fromPoly.length)
    items.push(...fromPoly)
  } catch (e) {
    const poly = loadFixture("polymarket")
    console.warn("polymarket fetch failed, using fixtures", e && (e as any).message)
    items.push(...poly)
  }
  try {
    const fromKalshi = await fetchKalshiAll()
    console.log("kalshi fetched", fromKalshi.length)
    items.push(...fromKalshi)
  } catch (e) {
    const kalshi = loadFixture("kalshi")
    console.warn("kalshi fetch failed, using fixtures", e && (e as any).message)
    items.push(...kalshi)
  }
  let n = 0
  for (const m of items) { await upsertMarket(m); n++ }
  console.log("ingested items", n)
}

export async function startCron() {
  await ingestOnce()
  cron.schedule("*/1 * * * *", async () => {
    await ingestOnce()
  })
}

if (process.env.RUN_INGESTOR === "1") {
  startCron()
}

async function fetchPolymarketAll() {
  const base = process.env.POLYMARKET_GAMMA_BASE || "https://gamma-api.polymarket.com"
  const limit = 100
  let offset = 0
  const out: any[] = []
  while (true) {
    const urlEv = `${base}/events?order=id&ascending=false&closed=false&limit=${limit}&offset=${offset}`
    const data = await getJson(urlEv)
    const events: any[] = Array.isArray(data?.events) ? data.events : Array.isArray(data?.data) ? data.data : []
    if (!events.length) break
    for (const ev of events) {
      const evSlug = ev.slug || ev.event_slug || ev.id
      const evTitle = ev.title || ev.question || ""
      const evCategory = ev.category || "other"
      const evResolve = ev.end_date_iso || ev.event_end_date || null
      const evTags = ev.tags || []
      const markets: any[] = Array.isArray(ev.markets) ? ev.markets : []
      if (markets.length) {
        for (const mk of markets) {
          const platform_market_id = mk.market_slug || mk.slug || mk.condition_id || mk.id || evSlug
          const title = mk.title || evTitle
          const category = mk.category || evCategory
          const resolve_time = mk.end_date_iso || evResolve
          const status = mk.closed ? "closed" : "open"
          const tokens = Array.isArray(mk.tokens) ? mk.tokens : []
          const contracts = tokens.length ? tokens.map((t: any) => ({ name: (t.outcome || "").toString() })) : [ { name: "Yes" }, { name: "No" } ]
          out.push({
            platform: "polymarket",
            platform_market_id,
            title,
            description: ev.description || "",
            category,
            tags: evTags,
            status,
            resolve_time,
            close_time: mk.game_start_time || null,
            currency: "USDC",
            metrics: {},
            contracts
          })
        }
      } else {
        out.push({
          platform: "polymarket",
          platform_market_id: evSlug,
          title: evTitle,
          description: ev.description || "",
          category: evCategory,
          tags: evTags,
          status: "open",
          resolve_time: evResolve,
          close_time: null,
          currency: "USDC",
          metrics: {},
          contracts: [ { name: "Yes" }, { name: "No" } ]
        })
      }
    }
    offset += limit
    if (offset > 2000) break
  }
  return out
}

function toFloat(v: any) {
  if (v === undefined || v === null) return undefined
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : undefined
  if (n === undefined) return undefined
  return n
}

async function fetchKalshiAll() {
  const out: any[] = []
  const hasSdk = process.env.KALSHI_API_KEY && (process.env.KALSHI_PRIVATE_KEY_PATH || process.env.KALSHI_PRIVATE_KEY_PEM)
  if (hasSdk) {
    const { MarketsApi, Configuration } = await import("kalshi-typescript")
    const conf = new Configuration({ basePath: process.env.KALSHI_API_BASE || "https://api.elections.kalshi.com/trade-api/v2", apiKey: process.env.KALSHI_API_KEY, privateKeyPath: process.env.KALSHI_PRIVATE_KEY_PATH || undefined, privateKeyPem: process.env.KALSHI_PRIVATE_KEY_PEM || undefined })
    const api = new MarketsApi(conf)
    let cursor = ""
    const limit = 100
  while (true) {
    const res = await api.getMarkets(1000, cursor, undefined, undefined, undefined, undefined, "open" as any, undefined)
      const arr: any[] = Array.isArray(res.data?.markets) ? res.data.markets : []
      for (const mk of arr) {
        const yesBid = toFloat(mk.yes_bid_dollars)
        const yesAsk = toFloat(mk.yes_ask_dollars)
        const last = toFloat(mk.last_price_dollars)
        const implied = last !== undefined ? last : (yesBid !== undefined && yesAsk !== undefined ? (yesBid + yesAsk) / 2 : undefined)
        out.push({
          platform: "kalshi",
          platform_market_id: mk.ticker,
          title: mk.title || mk.subtitle || "",
          description: mk.subtitle || "",
          category: mk.category || "other",
          tags: [],
        status: mk.status === "open" || mk.status === "active" ? "open" : mk.status === "settled" ? "resolved" : "closed",
          resolve_time: mk.expiration_time || mk.latest_expiration_time || null,
          close_time: mk.close_time || null,
          currency: "USD",
          metrics: {
            volume_24h: mk.volume_24h ?? mk.volume ?? undefined,
            open_interest: mk.open_interest ?? undefined
          },
          contracts: [
            { name: "Yes", last_price: implied, best_bid: yesBid, best_ask: yesAsk },
            { name: "No", last_price: implied !== undefined ? (1 - implied) : undefined }
          ]
        })
      }
      cursor = (res.data as any)?.cursor || ""
      if (!cursor) break
    }
    return out
  } else {
    const base = process.env.KALSHI_API_BASE || "https://api.elections.kalshi.com/trade-api/v2"
    const limit = 1000
    let cursor = ""
    while (true) {
      const params = new URLSearchParams()
      params.set("status", "open")
      params.set("limit", String(limit))
      if (cursor) params.set("cursor", cursor)
      const url = `${base}/markets?${params.toString()}`
    const data = await getJson(url)
      const arr: any[] = Array.isArray(data?.markets) ? data.markets : []
      for (const mk of arr) {
        const yesBid = toFloat(mk.yes_bid_dollars)
        const yesAsk = toFloat(mk.yes_ask_dollars)
        const last = toFloat(mk.last_price_dollars)
        const implied = last !== undefined ? last : (yesBid !== undefined && yesAsk !== undefined ? (yesBid + yesAsk) / 2 : undefined)
        out.push({
          platform: "kalshi",
          platform_market_id: mk.ticker,
          title: mk.title || mk.subtitle || "",
          description: mk.subtitle || "",
          category: mk.category || "other",
          tags: [],
        status: mk.status === "open" || mk.status === "active" ? "open" : mk.status === "settled" ? "resolved" : "closed",
          resolve_time: mk.expiration_time || mk.latest_expiration_time || null,
          close_time: mk.close_time || null,
          currency: "USD",
          metrics: {
            volume_24h: mk.volume_24h ?? mk.volume ?? undefined,
            open_interest: mk.open_interest ?? undefined
          },
          contracts: [
            { name: "Yes", last_price: implied, best_bid: yesBid, best_ask: yesAsk },
            { name: "No", last_price: implied !== undefined ? (1 - implied) : undefined }
          ]
        })
      }
      cursor = data?.cursor || ""
      if (!cursor) break
    }
    return out
  }
}

async function getJson(url: string, retries = 3) {
  const ua = "MetaOdds/0.1 (+https://github.com/yanboishere/MetaOdds)"
  let lastErr: any
  for (let i = 0; i < retries; i++) {
    try {
      const ac = new AbortController()
      const t = setTimeout(() => ac.abort(), 8000)
      const r = await fetch(url, { headers: { "User-Agent": ua, Accept: "application/json" }, signal: ac.signal })
      clearTimeout(t)
      if (r.ok) return await r.json()
      if (r.status === 429) lastErr = new Error("rate_limit")
      else if (r.status >= 500) lastErr = new Error(`server_${r.status}`)
      else lastErr = new Error(`status ${r.status}`)
    } catch (e) {
      lastErr = e
    }
    const baseDelay = lastErr?.message === "rate_limit" ? 2000 : 800
    await new Promise(res => setTimeout(res, baseDelay * (i + 1)))
  }
  return await httpsGetJson(url)
}

function httpsGetJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
    const agent = proxy ? new HttpsProxyAgent(proxy) : new https.Agent({ keepAlive: true })
    const req = https.request({
      protocol: u.protocol,
      hostname: u.hostname,
      path: u.pathname + (u.search || ""),
      method: "GET",
      headers: { "User-Agent": "MetaOdds/0.1 (+https://github.com/yanboishere/MetaOdds)", Accept: "application/json", Connection: "keep-alive", "Accept-Encoding": "identity" },
      agent
    }, res => {
      const chunks: Buffer[] = []
      res.on("data", d => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)))
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf-8")
        try {
          resolve(JSON.parse(raw))
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on("error", err => reject(err))
    req.setTimeout(8000, () => { req.destroy(new Error("timeout")) })
    req.end()
  })
}
