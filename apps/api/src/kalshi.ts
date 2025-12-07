import { Configuration, MarketsApi, PortfolioApi } from "kalshi-typescript"

function getKalshiConfig() {
  const basePath = process.env.KALSHI_API_BASE || "https://api.elections.kalshi.com/trade-api/v2"
  const apiKey = process.env.KALSHI_API_KEY
  const privateKeyPath = process.env.KALSHI_PRIVATE_KEY_PATH
  const privateKeyPem = process.env.KALSHI_PRIVATE_KEY_PEM
  const hasAuth = apiKey && (privateKeyPath || privateKeyPem)
  if (!hasAuth) return null
  const conf = new Configuration({ basePath, apiKey, privateKeyPath: privateKeyPath || undefined, privateKeyPem: privateKeyPem || undefined })
  return conf
}

export async function kalshiGetBalance() {
  const conf = getKalshiConfig()
  if (!conf) throw new Error("kalshi_not_configured")
  const api = new PortfolioApi(conf)
  const res = await api.getBalance()
  return res.data
}

export async function kalshiGetMarkets(limit = 100, cursor = "", status = "open") {
  const conf = getKalshiConfig()
  if (!conf) throw new Error("kalshi_not_configured")
  const api = new MarketsApi(conf)
  const res = await api.getMarkets(limit, cursor, undefined, undefined, undefined, undefined, status as any, undefined)
  return res.data
}

