import type { Platform, OddsComparisonResult, PlatformResult } from '../api/types'
import { searchPolymarketMarkets } from '../api/polymarket'
import { searchOpinionMarkets } from '../api/opinion'
import { findMatches } from '../matcher/matcher'
import { findBestPrices } from '../utils/price'
import { loadSettings } from '../utils/storage'
import { handleApiError, getErrorMessage } from '../utils/error'

export async function queryAllPlatforms(
  searchText: string,
  excludePlatform?: string
): Promise<OddsComparisonResult> {
  console.log('[QueryService] Starting query for:', searchText)
  console.log('[QueryService] Exclude platform:', excludePlatform)
  
  const settings = await loadSettings()
  const enabledPlatforms = settings.enabledPlatforms.filter(
    p => p !== excludePlatform
  )
  console.log('[QueryService] Enabled platforms:', enabledPlatforms)

  const platformQueries = enabledPlatforms.map(platform =>
    queryPlatform(platform, searchText, settings.maxResults)
  )

  const results = await Promise.all(platformQueries)
  console.log('[QueryService] All platform results:', results)

  const { bestYes, bestNo } = findBestPrices(results)

  return {
    query: searchText,
    timestamp: Date.now(),
    platforms: results,
    bestYesPrice: bestYes ?? undefined,
    bestNoPrice: bestNo ?? undefined
  }
}

async function queryPlatform(
  platform: Platform,
  query: string,
  maxResults: number
): Promise<PlatformResult> {
  console.log(`[QueryService] Querying ${platform} for:`, query)
  
  try {
    const markets = platform === 'polymarket'
      ? await searchPolymarketMarkets(query)
      : await searchOpinionMarkets(query)

    console.log(`[QueryService] ${platform} returned ${markets.length} markets`)
    
    const matches = findMatches(query, markets, maxResults)
    console.log(`[QueryService] ${platform} matched ${matches.length} results`)

    return {
      platform,
      matches,
      error: matches.length === 0 ? `未在 ${platform} 找到匹配事件` : undefined
    }
  } catch (error) {
    console.error(`[QueryService] ${platform} error:`, error)
    const extError = handleApiError(error, platform)
    return {
      platform,
      matches: [],
      error: getErrorMessage(extError)
    }
  }
}
