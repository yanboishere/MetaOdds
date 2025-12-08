import { describe, it, expect } from 'vitest'
import { priceToPercentage, calculatePriceDifference, findBestPrices } from '../../src/utils/price'

describe('priceToPercentage', () => {
  it('should convert 0.5 to 50%', () => {
    expect(priceToPercentage(0.5)).toBe(50)
  })

  it('should convert 0 to 0%', () => {
    expect(priceToPercentage(0)).toBe(0)
  })

  it('should convert 1 to 100%', () => {
    expect(priceToPercentage(1)).toBe(100)
  })

  it('should round to one decimal place', () => {
    expect(priceToPercentage(0.333)).toBe(33.3)
    expect(priceToPercentage(0.666)).toBe(66.6)
  })
})

describe('calculatePriceDifference', () => {
  it('should calculate difference correctly', () => {
    expect(calculatePriceDifference(0.6, 0.5)).toBe(10)
    expect(calculatePriceDifference(0.5, 0.6)).toBe(10)
  })

  it('should return 0 for same prices', () => {
    expect(calculatePriceDifference(0.5, 0.5)).toBe(0)
  })
})

describe('findBestPrices', () => {
  it('should find best yes and no prices', () => {
    const results = [
      {
        platform: 'polymarket' as const,
        matches: [{
          id: '1',
          platform: 'polymarket' as const,
          title: 'Test',
          url: 'https://test.com',
          outcomes: [
            { name: 'Yes', price: 0.6 },
            { name: 'No', price: 0.4 }
          ],
          relevanceScore: 0.8
        }]
      },
      {
        platform: 'opinion' as const,
        matches: [{
          id: '2',
          platform: 'opinion' as const,
          title: 'Test',
          url: 'https://test.com',
          outcomes: [
            { name: 'Yes', price: 0.55 },
            { name: 'No', price: 0.35 }
          ],
          relevanceScore: 0.7
        }]
      }
    ]

    const { bestYes, bestNo } = findBestPrices(results)

    expect(bestYes?.platform).toBe('polymarket')
    expect(bestYes?.price).toBe(0.6)
    expect(bestNo?.platform).toBe('opinion')
    expect(bestNo?.price).toBe(0.35)
  })
})
