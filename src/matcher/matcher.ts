import type { UnifiedMarket, MarketMatch } from '../api/types'
import { extractKeywords, fuzzyMatch } from './fuzzy'

export function calculateRelevance(
  query: string,
  market: UnifiedMarket
): number {
  // Main title matching
  let score = fuzzyMatch(query, market.title)

  // Category bonus
  if (market.category) {
    const queryKeywords = extractKeywords(query)
    const categoryKeywords = extractKeywords(market.category)
    
    for (const qWord of queryKeywords) {
      if (categoryKeywords.includes(qWord)) {
        score += 0.1
        break
      }
    }
  }

  return Math.min(1, score)
}

export function findMatches(
  query: string,
  markets: UnifiedMarket[],
  maxResults: number = 5
): MarketMatch[] {
  console.log(`[Matcher] Finding matches for: "${query}" in ${markets.length} markets`)
  
  const matches: MarketMatch[] = markets.map(market => ({
    ...market,
    relevanceScore: calculateRelevance(query, market)
  }))

  // Sort by relevance
  const sorted = sortByRelevance(matches)
  
  // Use a very low threshold to show more results
  // The UI will show relevance labels to indicate match quality
  const filtered = sorted.filter(m => m.relevanceScore > 0.02)
  
  console.log(`[Matcher] Found ${filtered.length} matches above threshold`)
  if (filtered.length > 0) {
    console.log(`[Matcher] Top matches:`, filtered.slice(0, 3).map(m => ({
      title: m.title.slice(0, 50),
      score: m.relevanceScore.toFixed(3)
    })))
  }
  
  return filtered.slice(0, maxResults)
}

export function sortByRelevance(matches: MarketMatch[]): MarketMatch[] {
  return [...matches].sort((a, b) => b.relevanceScore - a.relevanceScore)
}

export function boostByDateSimilarity(
  queryDate: Date | undefined,
  marketDate: string | undefined,
  currentScore: number
): number {
  if (!queryDate || !marketDate) return currentScore

  const marketDateObj = new Date(marketDate)
  const diffDays = Math.abs(
    (queryDate.getTime() - marketDateObj.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays <= 7) {
    return currentScore + 0.1
  }

  return currentScore
}
