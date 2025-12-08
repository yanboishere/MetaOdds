import type { OddsComparisonResult, PlatformResult, MarketMatch } from '../api/types'
import { priceToPercentage } from '../utils/price'

let popupElement: HTMLElement | null = null

export function showPopup(
  query: string,
  position: { x: number; y: number },
  sourcePlatform?: string
): void {
  console.log('[OddsComparison] Opening popup for query:', query)
  console.log('[OddsComparison] Source platform:', sourcePlatform)
  
  hidePopup()

  popupElement = createPopupElement(position)
  setLoading(true)

  document.body.appendChild(popupElement)

  // Query odds from background script with timeout
  const timeoutId = setTimeout(() => {
    console.error('[OddsComparison] Query timeout after 20s')
    setError('查询超时，请重试')
  }, 20000) // 20 second timeout

  try {
    console.log('[OddsComparison] Sending message to background...')
    chrome.runtime.sendMessage(
      { type: 'QUERY_ODDS', payload: { text: query, sourcePlatform } },
      (response) => {
        clearTimeout(timeoutId)
        console.log('[OddsComparison] Got response from background:', response)
        
        // Check for chrome runtime errors
        if (chrome.runtime.lastError) {
          console.error('[OddsComparison] Runtime error:', chrome.runtime.lastError)
          setError('扩展通信错误，请刷新页面')
          return
        }
        
        if (response?.success) {
          console.log('[OddsComparison] Results:', response.data)
          setResults(response.data)
        } else {
          console.error('[OddsComparison] Query failed:', response?.error)
          setError(response?.error || '查询失败')
        }
      }
    )
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('[OddsComparison] Send message error:', error)
    setError('发送查询失败')
  }

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick)
  }, 100)
}

export function hidePopup(): void {
  if (popupElement) {
    popupElement.remove()
    popupElement = null
  }
  document.removeEventListener('click', handleOutsideClick)
}

function handleOutsideClick(event: MouseEvent): void {
  if (popupElement && !popupElement.contains(event.target as Node)) {
    hidePopup()
  }
}

function createPopupElement(position: { x: number; y: number }): HTMLElement {
  const popup = document.createElement('div')
  popup.className = 'odds-comparison-popup'

  // Adjust position to stay within viewport
  const viewportWidth = window.innerWidth
  const popupWidth = 320
  let left = position.x
  if (left + popupWidth > viewportWidth - 20) {
    left = viewportWidth - popupWidth - 20
  }

  popup.style.cssText = `
    position: absolute;
    left: ${left}px;
    top: ${position.y}px;
    z-index: 999999;
    width: ${popupWidth}px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    color: #1a1a1a;
    overflow: hidden;
  `

  return popup
}

function setLoading(loading: boolean): void {
  if (!popupElement) return

  if (loading) {
    popupElement.innerHTML = `
      <div style="padding: 24px; text-align: center;">
        <div class="odds-loading-spinner"></div>
        <p style="margin: 12px 0 0; color: #666;">正在查询赔率...</p>
      </div>
    `
  }
}

function setError(message: string): void {
  if (!popupElement) return

  popupElement.innerHTML = `
    <div style="padding: 24px; text-align: center;">
      <p style="color: #dc2626; margin: 0 0 12px;">❌ ${message}</p>
      <button onclick="location.reload()" style="
        padding: 8px 16px;
        background: #4F46E5;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
      ">重试</button>
    </div>
  `
}

function setResults(result: OddsComparisonResult): void {
  if (!popupElement) return

  const hasResults = result.platforms.some(p => p.matches.length > 0)

  if (!hasResults) {
    popupElement.innerHTML = `
      <div style="padding: 24px; text-align: center;">
        <p style="color: #666; margin: 0;">未找到相关市场</p>
        <p style="color: #999; font-size: 12px; margin-top: 8px;">搜索: "${result.query.slice(0, 30)}..."</p>
      </div>
    `
    return
  }

  const totalMatches = result.platforms.reduce((sum, p) => sum + p.matches.length, 0)

  popupElement.innerHTML = `
    <div style="padding: 16px; max-height: 500px; overflow-y: auto;">
      <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
        <h3 style="margin: 0; font-size: 14px; color: #333;">
          🔍 相关市场 (${totalMatches})
        </h3>
        <p style="margin: 4px 0 0; font-size: 11px; color: #999;">
          搜索: "${result.query.slice(0, 40)}${result.query.length > 40 ? '...' : ''}"
        </p>
      </div>
      ${result.platforms.map(p => renderPlatformResult(p, result)).join('')}
    </div>
  `
}

function renderPlatformResult(
  platformResult: PlatformResult,
  fullResult: OddsComparisonResult
): string {
  const { platform, matches, error } = platformResult

  if (error && matches.length === 0) {
    return `
      <div style="margin-bottom: 12px; padding: 12px; background: #f9fafb; border-radius: 8px;">
        <div style="font-weight: 600; margin-bottom: 4px; text-transform: capitalize;">
          ${platform}
        </div>
        <div style="color: #666; font-size: 13px;">${error}</div>
      </div>
    `
  }

  return matches.map(match => renderMatch(match, fullResult)).join('')
}

function renderMatch(match: MarketMatch, result: OddsComparisonResult): string {
  const yesOutcome = match.outcomes.find(o => o.name.toLowerCase() === 'yes')
  const noOutcome = match.outcomes.find(o => o.name.toLowerCase() === 'no')

  const yesPrice = yesOutcome?.price ?? 0.5
  const noPrice = noOutcome?.price ?? 0.5

  const isBestYes = result.bestYesPrice?.platform === match.platform &&
    Math.abs(result.bestYesPrice.price - yesPrice) < 0.001
  const isBestNo = result.bestNoPrice?.platform === match.platform &&
    Math.abs(result.bestNoPrice.price - noPrice) < 0.001

  // Determine relevance label based on new scoring system
  const relevancePercent = Math.round(match.relevanceScore * 100)
  let relevanceLabel: string
  let relevanceColor: string
  
  if (relevancePercent >= 50) {
    relevanceLabel = '高度相关'
    relevanceColor = '#22c55e'
  } else if (relevancePercent >= 25) {
    relevanceLabel = '相关'
    relevanceColor = '#f59e0b'
  } else if (relevancePercent >= 10) {
    relevanceLabel = '可能相关'
    relevanceColor = '#6b7280'
  } else {
    relevanceLabel = '参考'
    relevanceColor = '#9ca3af'
  }

  return `
    <div style="
      margin-bottom: 10px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid #e5e7eb;
      transition: border-color 0.15s ease;
    " onclick="window.open('${match.url}', '_blank')"
       onmouseenter="this.style.borderColor='#4F46E5'"
       onmouseleave="this.style.borderColor='#e5e7eb'">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span style="
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 4px;
          background: ${match.platform === 'polymarket' ? '#f3e8ff' : '#dbeafe'};
          color: ${match.platform === 'polymarket' ? '#7c3aed' : '#2563eb'};
        ">${match.platform}</span>
        <span style="font-size: 10px; color: ${relevanceColor}; font-weight: 500;">
          ${relevanceLabel} (${relevancePercent}%)
        </span>
      </div>
      <div style="font-weight: 500; margin-bottom: 10px; font-size: 13px; line-height: 1.4; color: #1f2937;">
        ${match.title.slice(0, 80)}${match.title.length > 80 ? '...' : ''}
      </div>
      <div style="display: flex; gap: 8px;">
        <div style="
          flex: 1;
          padding: 8px;
          background: ${isBestYes ? '#dcfce7' : 'white'};
          border-radius: 6px;
          text-align: center;
          border: 1px solid ${isBestYes ? '#22c55e' : '#e5e7eb'};
        ">
          <div style="font-size: 10px; color: #666; margin-bottom: 2px;">Yes</div>
          <div style="font-size: 18px; font-weight: 700; color: #22c55e;">
            ${priceToPercentage(yesPrice)}%
          </div>
        </div>
        <div style="
          flex: 1;
          padding: 8px;
          background: ${isBestNo ? '#fee2e2' : 'white'};
          border-radius: 6px;
          text-align: center;
          border: 1px solid ${isBestNo ? '#ef4444' : '#e5e7eb'};
        ">
          <div style="font-size: 10px; color: #666; margin-bottom: 2px;">No</div>
          <div style="font-size: 18px; font-weight: 700; color: #ef4444;">
            ${priceToPercentage(noPrice)}%
          </div>
        </div>
      </div>
    </div>
  `
}
