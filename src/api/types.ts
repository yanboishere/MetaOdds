export type Platform = 'polymarket' | 'opinion'

export interface UnifiedMarket {
  id: string
  platform: Platform
  title: string
  url: string
  outcomes: Outcome[]
  volume24h?: number
  endDate?: string
  category?: string
}

export interface Outcome {
  name: string
  price: number
  bid?: number
  ask?: number
}

export interface MarketMatch extends UnifiedMarket {
  relevanceScore: number
}

export interface PlatformResult {
  platform: Platform
  matches: MarketMatch[]
  error?: string
}

export interface OddsComparisonResult {
  query: string
  timestamp: number
  platforms: PlatformResult[]
  bestYesPrice?: { platform: Platform; price: number }
  bestNoPrice?: { platform: Platform; price: number }
}

export interface Settings {
  enabledPlatforms: Platform[]
  showTriggerButton: boolean
  maxResults: number
}

export const DEFAULT_SETTINGS: Settings = {
  enabledPlatforms: ['polymarket', 'opinion'],
  showTriggerButton: true,
  maxResults: 5
}

export type ExtensionMessage =
  | { type: 'QUERY_ODDS'; payload: { text: string; sourcePlatform?: string } }
  | { type: 'GET_SETTINGS' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }

export type ExtensionResponse =
  | { success: true; data: OddsComparisonResult }
  | { success: true; data: Settings }
  | { success: false; error: string }
