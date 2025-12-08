import type { UnifiedMarket } from './types'
import { fetchWithTimeout } from '../utils/error'

const OPINION_API_BASE = 'https://api.opinion.trade/v1'

interface OpinionMarket {
  id: string
  title: string
  description?: string
  category?: string
  endDate?: string
  outcomes?: Array<{
    id: string
    name: string
    price: number
  }>
  volume?: number
}

interface OpinionResponse {
  markets?: OpinionMarket[]
  data?: OpinionMarket[]
}

export async function searchOpinionMarkets(query: string): Promise<UnifiedMarket[]> {
  // Opinion API might not be publicly available, so we handle errors gracefully
  const url = `${OPINION_API_BASE}/markets?` +
    `search=${encodeURIComponent(query)}&` +
    `status=open&limit=10`

  console.log('[Opinion] Searching:', url)

  try {
    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'application/json' }
    }, 10000)

    if (!response.ok) {
      console.error('[Opinion] API error:', response.status)
      // Opinion API might not be available, return empty
      return []
    }

    const data: OpinionResponse = await response.json()
    const markets = data.markets || data.data || []
    console.log('[Opinion] Found markets:', markets.length)

    return markets.map(normalizeOpinionMarket)
  } catch (error) {
    console.error('[Opinion] Fetch error:', error)
    // Opinion API not available, return empty array instead of throwing
    return []
  }
}

function normalizeOpinionMarket(market: OpinionMarket): UnifiedMarket {
  const outcomes = market.outcomes?.map(o => ({
    name: o.name,
    price: o.price
  })) || [
    { name: 'Yes', price: 0.5 },
    { name: 'No', price: 0.5 }
  ]

  return {
    id: market.id,
    platform: 'opinion',
    title: market.title,
    url: `https://opinion.trade/market/${market.id}`,
    outcomes,
    volume24h: market.volume,
    category: market.category,
    endDate: market.endDate
  }
}
