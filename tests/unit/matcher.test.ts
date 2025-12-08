import { describe, it, expect } from 'vitest'
import { tokenize, calculateWordOverlap, fuzzyMatch } from '../../src/matcher/fuzzy'
import { findMatches, sortByRelevance } from '../../src/matcher/matcher'

describe('tokenize', () => {
  it('should split text into words', () => {
    expect(tokenize('Hello World')).toEqual(['hello', 'world'])
  })

  it('should remove short words', () => {
    expect(tokenize('a is the test')).toEqual(['the', 'test'])
  })

  it('should remove punctuation', () => {
    expect(tokenize('Hello, World!')).toEqual(['hello', 'world'])
  })
})

describe('calculateWordOverlap', () => {
  it('should return 1 for identical token sets', () => {
    expect(calculateWordOverlap(['hello', 'world'], ['hello', 'world'])).toBe(1)
  })

  it('should return 0 for no overlap', () => {
    expect(calculateWordOverlap(['hello'], ['world'])).toBe(0)
  })

  it('should return partial overlap', () => {
    expect(calculateWordOverlap(['hello', 'world'], ['hello', 'test'])).toBe(0.5)
  })
})

describe('fuzzyMatch', () => {
  it('should give high score for similar strings', () => {
    const score = fuzzyMatch('Bitcoin price prediction', 'Will Bitcoin reach $100k')
    expect(score).toBeGreaterThan(0.2)
  })

  it('should give higher score for exact substring match', () => {
    const score = fuzzyMatch('Bitcoin', 'Bitcoin price prediction')
    expect(score).toBeGreaterThan(0.3)
  })
})

describe('sortByRelevance', () => {
  it('should sort by relevance score descending', () => {
    const matches = [
      { relevanceScore: 0.5 },
      { relevanceScore: 0.8 },
      { relevanceScore: 0.3 }
    ] as any[]

    const sorted = sortByRelevance(matches)

    expect(sorted[0].relevanceScore).toBe(0.8)
    expect(sorted[1].relevanceScore).toBe(0.5)
    expect(sorted[2].relevanceScore).toBe(0.3)
  })
})

describe('findMatches', () => {
  it('should limit results to maxResults', () => {
    const markets = Array(10).fill(null).map((_, i) => ({
      id: String(i),
      platform: 'polymarket' as const,
      title: `Test market ${i}`,
      url: 'https://test.com',
      outcomes: [{ name: 'Yes', price: 0.5 }]
    }))

    const matches = findMatches('Test market', markets, 3)

    expect(matches.length).toBeLessThanOrEqual(3)
  })
})
