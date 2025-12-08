import type { Platform, MarketMatch } from '../api/types'

export function priceToPercentage(price: number): number {
  return Math.round(price * 1000) / 10
}

export function calculatePriceDifference(price1: number, price2: number): number {
  return Math.round(Math.abs(price1 - price2) * 1000) / 10
}

export interface BestPrices {
  bestYes: { platform: Platform; price: number } | null
  bestNo: { platform: Platform; price: number } | null
}

export function findBestPrices(
  results: Array<{ platform: Platform; matches: MarketMatch[] }>
): BestPrices {
  let bestYes: BestPrices['bestYes'] = null
  let bestNo: BestPrices['bestNo'] = null

  for (const result of results) {
    for (const match of result.matches) {
      const yesOutcome = match.outcomes.find(o => o.name.toLowerCase() === 'yes')
      const noOutcome = match.outcomes.find(o => o.name.toLowerCase() === 'no')

      if (yesOutcome && (!bestYes || yesOutcome.price > bestYes.price)) {
        bestYes = { platform: result.platform, price: yesOutcome.price }
      }

      if (noOutcome && (!bestNo || noOutcome.price < bestNo.price)) {
        bestNo = { platform: result.platform, price: noOutcome.price }
      }
    }
  }

  return { bestYes, bestNo }
}
