export type Platform = "polymarket" | "kalshi" | string

export type MarketMetrics = {
  volume_24h?: number
  volume_7d?: number
  open_interest?: number
  fee_rate?: number
}

export type Market = {
  id: string
  platform: Platform
  title: string
  description: string
  category: "politics" | "macro" | "sports" | "crypto" | "tech" | "other"
  tags: string[]
  status: "open" | "closed" | "resolved"
  resolve_time?: string
  close_time?: string
  currency: "USDC" | "USD" | "other" | string
  metrics: MarketMetrics
}

export type Contract = {
  id: string
  market_id: string
  name: string
  last_price?: number
  best_bid?: number
  best_ask?: number
  implied_prob?: number
  open_interest?: number
  fee_rate?: number
}

export type MarketHistoryPoint = {
  market_id: string
  contract_name?: string
  ts: string
  price?: number
  volume?: number
}

