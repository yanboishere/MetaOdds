import Fastify from "fastify"
import cors from "@fastify/cors"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import { startCron } from "./ingestor"
import { kalshiGetBalance, kalshiGetMarkets } from "./kalshi"

dotenv.config()

const app = Fastify({ logger: true })
app.register(cors, { origin: true })

const prisma = new PrismaClient()

const MarketsQuery = z.object({
  platform: z.union([z.string(), z.array(z.string())]).optional(),
  category: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.string().optional(),
  q: z.string().optional(),
  resolve_time_from: z.string().optional(),
  resolve_time_to: z.string().optional(),
  min_volume_24h: z.string().optional(),
  prob_from: z.string().optional(),
  prob_to: z.string().optional(),
  sort_by: z.string().optional(),
  page: z.string().optional(),
  page_size: z.string().optional()
})

app.get("/health", async () => ({ ok: true }))

app.get("/markets", async (req, reply) => {
  const q = MarketsQuery.parse(req.query as any)
  const page = Math.max(1, parseInt(q.page || "1", 10))
  const pageSize = Math.min(200, Math.max(1, parseInt(q.page_size || "20", 10)))

  const where: any = {}
  if (q.platform) {
    const arr = Array.isArray(q.platform) ? q.platform : [q.platform]
    where.platform = { in: arr }
  }
  if (q.category) {
    const arr = Array.isArray(q.category) ? q.category : [q.category]
    where.category = { in: arr }
  }
  if (q.status) where.status = q.status
  if (q.q) {
    where.OR = [
      { title: { contains: q.q } },
      { description: { contains: q.q } },
      { tags: { contains: q.q } }
    ]
  }
  if (q.resolve_time_from || q.resolve_time_to) {
    where.resolve_time = {}
    if (q.resolve_time_from) where.resolve_time.gte = new Date(q.resolve_time_from)
    if (q.resolve_time_to) where.resolve_time.lte = new Date(q.resolve_time_to)
  }
  if (q.min_volume_24h) {
    const t = parseFloat(q.min_volume_24h)
    if (!Number.isNaN(t)) where.volume_24h = { gte: t }
  }
  const orderBy: any = {}
  if (q.sort_by === "resolve_time") orderBy.resolve_time = "asc"
  else if (q.sort_by === "updated_at") orderBy.updated_at = "desc"

  const probFrom = q.prob_from ? parseFloat(q.prob_from) : undefined
  const probTo = q.prob_to ? parseFloat(q.prob_to) : undefined

  const markets = await prisma.market.findMany({
    where: where,
    orderBy: Object.keys(orderBy).length ? orderBy : { updated_at: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    ...(probFrom !== undefined || probTo !== undefined
      ? {
          where: {
            ...where,
            contracts: {
              some: {
                name: { in: ["Yes", "YES", "yes"] },
                ...(probFrom !== undefined ? { implied_prob: { gte: probFrom } } : {}),
                ...(probTo !== undefined ? { implied_prob: { lte: probTo } } : {})
              }
            }
          }
        }
      : {})
  })

  const ids = markets.map(m => m.id)
  const contracts = await prisma.contract.findMany({
    where: { market_id: { in: ids } }
  })

  const grouped = new Map<string, any[]>()
  for (const c of contracts) {
    const list = grouped.get(c.market_id) || []
    list.push(c)
    grouped.set(c.market_id, list)
  }

  const result = markets.map(m => {
    const cs = grouped.get(m.id) || []
    const primary = cs.find(x => x.name.toLowerCase() === "yes") || cs[0]
    const volume24 = m.volume_24h || 0
    const implied = primary?.implied_prob
    return {
      id: m.id,
      platform: m.platform,
      title: m.title,
      category: m.category,
      status: m.status,
      resolve_time: m.resolve_time,
      currency: m.currency,
      metrics: { volume_24h: volume24 },
      primary_contract: primary ? { name: primary.name, implied_prob: implied } : null
    }
  })

  return reply.send({ page, page_size: pageSize, items: result })
})

app.get("/markets/:id", async (req, reply) => {
  const id = (req.params as any).id as string
  const m = await prisma.market.findUnique({ where: { id } })
  if (!m) return reply.code(404).send({ error: "not_found" })
  const contracts = await prisma.contract.findMany({ where: { market_id: id } })
  const history = await prisma.marketHistory.findMany({ where: { market_id: id }, orderBy: { ts: "asc" }, take: 168 })
  return reply.send({ market: m, contracts, price_history: history })
})

const port = parseInt(process.env.PORT || "4000", 10)
app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`api:${port}`)
  })
  .catch(err => {
    app.log.error(err)
    process.exit(1)
  })

if (process.env.RUN_INGESTOR === "1") {
  startCron()
}
app.get("/kalshi/balance", async (req, reply) => {
  try {
    const data = await kalshiGetBalance()
    const usd = ((data.balance || 0) as number) / 100
    return reply.send({ balance: usd })
  } catch (e) {
    return reply.code(503).send({ error: "kalshi_not_configured" })
  }
})

app.get("/kalshi/markets", async (req, reply) => {
  const limit = parseInt((req.query as any).limit || "50", 10)
  const cursor = (req.query as any).cursor || ""
  try {
    const data = await kalshiGetMarkets(limit, cursor, "open")
    return reply.send(data)
  } catch (e) {
    return reply.code(503).send({ error: "kalshi_not_configured" })
  }
})
