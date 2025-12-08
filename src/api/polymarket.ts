import type { UnifiedMarket } from './types'
import { fetchWithTimeout } from '../utils/error'

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com'

interface PolymarketEvent {
  id: string
  slug: string
  title: string
  description?: string
  category?: string
  end_date_iso?: string
  markets?: PolymarketMarket[]
}

interface PolymarketMarket {
  condition_id: string
  question: string
  slug: string
  tokens?: Array<{
    token_id: string
    outcome: string
    price?: number
  }>
  volume?: number
  outcomePrices?: string
}

export async function searchPolymarketMarkets(query: string): Promise<UnifiedMarket[]> {
  console.log('[Polymarket] Starting search for:', query)
  
  // Fetch recent/popular events and filter locally
  // The Gamma API doesn't have a reliable text search, so we fetch more events and filter
  const url = `${GAMMA_API_BASE}/events?closed=false&limit=50&order=volume&ascending=false`

  console.log('[Polymarket] Fetching events:', url)

  try {
    const response = await fetchWithTimeout(url, {
      headers: { 
        'Accept': 'application/json'
      }
    }, 15000)

    if (!response.ok) {
      console.error('[Polymarket] API error:', response.status)
      return []
    }

    const events: PolymarketEvent[] = await response.json()
    console.log('[Polymarket] Fetched events:', events.length)
    
    // Normalize all events
    const allMarkets = events.flatMap(normalizePolymarketEvent)
    console.log('[Polymarket] Normalized markets:', allMarkets.length)
    
    return allMarkets
  } catch (error) {
    console.error('[Polymarket] Fetch error:', error)
    return []
  }
}



function normalizePolymarketEvent(event: PolymarketEvent): UnifiedMarket[] {
  const markets = event.markets || []

  if (markets.length === 0) {
    return [{
      id: event.slug || event.id,
      platform: 'polymarket',
      title: event.title,
      url: `https://polymarket.com/event/${event.slug || event.id}`,
      outcomes: [
        { name: 'Yes', price: 0.5 },
        { name: 'No', price: 0.5 }
      ],
      category: event.category,
      endDate: event.end_date_iso
    }]
  }

  return markets.map(market => {
    const outcomes = parseOutcomes(market)

    return {
      id: market.condition_id || market.slug,
      platform: 'polymarket' as const,
      title: market.question || event.title,
      url: `https://polymarket.com/event/${event.slug}/${market.slug}`,
      outcomes,
      volume24h: market.volume,
      category: event.category,
      endDate: event.end_date_iso
    }
  })
}

function parseOutcomes(market: PolymarketMarket): UnifiedMarket['outcomes'] {
  if (market.outcomePrices) {
    try {
      const prices = JSON.parse(market.outcomePrices) as string[]
      return [
        { name: 'Yes', price: parseFloat(prices[0]) || 0.5 },
        { name: 'No', price: parseFloat(prices[1]) || 0.5 }
      ]
    } catch {
      // Fall through to tokens
    }
  }

  if (market.tokens && market.tokens.length > 0) {
    return market.tokens.map(token => ({
      name: token.outcome,
      price: token.price ?? 0.5
    }))
  }

  return [
    { name: 'Yes', price: 0.5 },
    { name: 'No', price: 0.5 }
  ]
}
