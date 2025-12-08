// Stop words to filter out common words that don't add meaning
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom',
  'whose', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here',
  'there', 'then', 'once', 'before', 'after', 'above', 'below', 'between',
  'into', 'through', 'during', 'under', 'again', 'further', 'any', 'about'
])

// Important keywords that should boost relevance
const IMPORTANT_KEYWORDS = new Set([
  // Politics
  'trump', 'biden', 'election', 'president', 'congress', 'senate', 'vote',
  'republican', 'democrat', 'gop', 'primary', 'nominee', 'governor',
  // Crypto
  'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'solana', 'sol', 'xrp',
  'dogecoin', 'doge', 'price', 'ath', 'market', 'cap',
  // Sports
  'nba', 'nfl', 'mlb', 'nhl', 'championship', 'finals', 'playoffs', 'mvp',
  'super', 'bowl', 'world', 'series', 'cup', 'win', 'winner',
  // Tech
  'ai', 'openai', 'google', 'apple', 'microsoft', 'meta', 'tesla', 'spacex',
  'ceo', 'ipo', 'stock',
  // Economy
  'fed', 'rate', 'inflation', 'gdp', 'recession', 'interest', 'cut', 'hike',
  // General prediction terms
  'yes', 'no', '2024', '2025', '2026', 'before', 'after', 'end', 'year'
])

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1)
}

export function extractKeywords(text: string): string[] {
  const tokens = tokenize(text)
  // Filter out stop words but keep important keywords
  return tokens.filter(word => 
    !STOP_WORDS.has(word) || IMPORTANT_KEYWORDS.has(word)
  )
}

export function calculateWordOverlap(tokens1: string[], tokens2: string[]): number {
  if (tokens1.length === 0 || tokens2.length === 0) return 0

  const set1 = new Set(tokens1)
  const set2 = new Set(tokens2)

  let overlap = 0
  for (const word of set1) {
    if (set2.has(word)) overlap++
  }

  // Use minimum length for more generous matching
  const minLen = Math.min(set1.size, set2.size)
  return minLen > 0 ? overlap / minLen : 0
}

export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

// Calculate similarity between two words using Levenshtein distance
export function wordSimilarity(word1: string, word2: string): number {
  if (word1 === word2) return 1
  if (word1.length < 3 || word2.length < 3) return 0
  
  // Check if one contains the other
  if (word1.includes(word2) || word2.includes(word1)) {
    return 0.8
  }
  
  // Check prefix match (at least 4 chars)
  const minLen = Math.min(word1.length, word2.length)
  if (minLen >= 4) {
    const prefixLen = 4
    if (word1.slice(0, prefixLen) === word2.slice(0, prefixLen)) {
      return 0.6
    }
  }
  
  // Levenshtein-based similarity
  const distance = levenshteinDistance(word1, word2)
  const maxLen = Math.max(word1.length, word2.length)
  const similarity = 1 - distance / maxLen
  
  return similarity > 0.7 ? similarity : 0
}

export function fuzzyMatch(query: string, target: string): number {
  const queryKeywords = extractKeywords(query)
  const targetKeywords = extractKeywords(target)
  const targetTokens = tokenize(target)
  
  if (queryKeywords.length === 0) return 0
  
  const queryLower = query.toLowerCase()
  const targetLower = target.toLowerCase()
  
  let score = 0
  
  // 1. Exact substring match (highest priority)
  if (targetLower.includes(queryLower)) {
    score += 0.5
  }
  
  // 2. Keyword matching with fuzzy comparison
  let matchedKeywords = 0
  let importantMatches = 0
  
  for (const qWord of queryKeywords) {
    let bestMatch = 0
    
    for (const tWord of targetTokens) {
      const similarity = wordSimilarity(qWord, tWord)
      bestMatch = Math.max(bestMatch, similarity)
      
      // Exact match
      if (qWord === tWord) {
        bestMatch = 1
        break
      }
    }
    
    if (bestMatch > 0.5) {
      matchedKeywords++
      
      // Bonus for important keywords
      if (IMPORTANT_KEYWORDS.has(qWord)) {
        importantMatches++
      }
    }
  }
  
  // Calculate keyword match ratio
  const keywordRatio = matchedKeywords / queryKeywords.length
  score += keywordRatio * 0.4
  
  // 3. Important keyword bonus
  if (importantMatches > 0) {
    score += Math.min(0.2, importantMatches * 0.1)
  }
  
  // 4. Word overlap score
  const overlapScore = calculateWordOverlap(queryKeywords, targetKeywords)
  score += overlapScore * 0.2
  
  // 5. Partial word matching (for compound words, abbreviations)
  let partialMatches = 0
  for (const qWord of queryKeywords) {
    if (qWord.length >= 4) {
      for (const tWord of targetTokens) {
        if (tWord.length >= 4) {
          // Check if words share a common substring of 4+ chars
          if (hasCommonSubstring(qWord, tWord, 4)) {
            partialMatches++
            break
          }
        }
      }
    }
  }
  if (partialMatches > 0) {
    score += Math.min(0.15, partialMatches * 0.05)
  }
  
  return Math.min(1, score)
}

// Check if two strings share a common substring of given minimum length
function hasCommonSubstring(str1: string, str2: string, minLen: number): boolean {
  if (str1.length < minLen || str2.length < minLen) return false
  
  for (let i = 0; i <= str1.length - minLen; i++) {
    const substr = str1.slice(i, i + minLen)
    if (str2.includes(substr)) return true
  }
  return false
}
