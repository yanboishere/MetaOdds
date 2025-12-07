import type { Market as StdMarket, Contract as StdContract } from "./types"

export function unifyId(platform: string, platformMarketId: string) {
  return `${platform}:${platformMarketId}`
}

export function impliedProbFromPrice(price?: number) {
  if (price === undefined || price === null) return undefined
  if (price < 0) return 0
  if (price > 1) return 1
  return price
}

export function normalizeTitle(raw: string) {
  const s = raw.trim().replace(/[\(\)\[\]]/g, "").replace(/\s+/g, " ")
  return s
}

export function mapCategory(platform: string, raw: string): StdMarket["category"] {
  const v = (raw || "").toLowerCase()
  if (v.includes("politic")) return "politics"
  if (v.includes("macro") || v.includes("rate") || v.includes("inflation")) return "macro"
  if (v.includes("sport")) return "sports"
  if (v.includes("crypto") || v.includes("btc") || v.includes("bitcoin")) return "crypto"
  if (v.includes("tech") || v.includes("ai")) return "tech"
  return "other"
}

export function toStdMarket(input: any): StdMarket {
  return {
    id: input.id,
    platform: input.platform,
    title: normalizeTitle(input.title || ""),
    description: input.description || "",
    category: mapCategory(input.platform, input.category || ""),
    tags: Array.isArray(input.tags) ? input.tags : [],
    status: input.status,
    resolve_time: input.resolve_time || undefined,
    close_time: input.close_time || undefined,
    currency: input.currency || "other",
    metrics: input.metrics || {}
  }
}

export function toStdContract(input: any): StdContract {
  return {
    id: input.id,
    market_id: input.market_id,
    name: input.name,
    last_price: input.last_price,
    best_bid: input.best_bid,
    best_ask: input.best_ask,
    implied_prob: impliedProbFromPrice(input.last_price),
    open_interest: input.open_interest,
    fee_rate: input.fee_rate
  }
}

