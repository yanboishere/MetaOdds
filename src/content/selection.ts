import { showTriggerButton, hideTriggerButton } from './trigger'

const TARGET_DOMAINS = ['polymarket.com', 'opinion.trade']

// Selectors for market event elements on each platform
const POLYMARKET_SELECTORS = [
  'a[href*="/event/"]',
  '[data-testid="market-card"]',
  '.c-dhzjXW', // Market card class
  '.c-PJLV', // Event title class
  'p.c-dqzIym', // Event question text
]

const OPINION_SELECTORS = [
  'a[href*="/market/"]',
  '[class*="market-card"]',
  '[class*="event-card"]',
]

let currentHoveredElement: HTMLElement | null = null
let hoverTimeout: ReturnType<typeof setTimeout> | null = null

export function initSelectionDetector(): void {
  const platform = getCurrentPlatform()
  console.log('[OddsComparison] Checking domain, platform:', platform)
  
  if (!isTargetDomain()) {
    console.log('[OddsComparison] Not a target domain, skipping initialization')
    return
  }

  console.log('[OddsComparison] Initializing hover detection for', platform)
  
  // Use mouseover for hover detection
  document.addEventListener('mouseover', handleMouseOver)
  document.addEventListener('mouseout', handleMouseOut)
  
  // Also keep text selection as fallback
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('mousedown', handleMouseDown)
  
  console.log('[OddsComparison] Event listeners attached')
}

function isTargetDomain(): boolean {
  const hostname = window.location.hostname
  return TARGET_DOMAINS.some(domain => hostname.includes(domain))
}

export function getCurrentPlatform(): string | undefined {
  const hostname = window.location.hostname
  if (hostname.includes('polymarket.com')) return 'polymarket'
  if (hostname.includes('opinion.trade')) return 'opinion'
  return undefined
}

function handleMouseOver(event: MouseEvent): void {
  const target = event.target as HTMLElement
  const platform = getCurrentPlatform()
  
  if (!platform) return
  
  const selectors = platform === 'polymarket' ? POLYMARKET_SELECTORS : OPINION_SELECTORS
  
  // Find the closest market element
  let marketElement: HTMLElement | null = null
  for (const selector of selectors) {
    marketElement = target.closest(selector) as HTMLElement
    if (marketElement) break
  }
  
  if (!marketElement || marketElement === currentHoveredElement) return
  
  // Clear any existing timeout
  if (hoverTimeout) {
    clearTimeout(hoverTimeout)
  }
  
  // Delay showing the button to avoid flickering
  hoverTimeout = setTimeout(() => {
    const eventTitle = extractEventTitle(marketElement!, platform)
    
    if (eventTitle && eventTitle.length >= 5) {
      currentHoveredElement = marketElement
      
      const rect = marketElement!.getBoundingClientRect()
      showTriggerButton(eventTitle, {
        x: rect.right + window.scrollX - 35,
        y: rect.top + window.scrollY + 5
      })
    }
  }, 300) // 300ms delay before showing
}

function handleMouseOut(event: MouseEvent): void {
  const relatedTarget = event.relatedTarget as HTMLElement
  
  // Check if we're still within the same market element
  if (currentHoveredElement && relatedTarget) {
    if (currentHoveredElement.contains(relatedTarget)) {
      return
    }
    
    // Check if moving to trigger button
    if (relatedTarget.classList?.contains('odds-comparison-trigger')) {
      return
    }
  }
  
  if (hoverTimeout) {
    clearTimeout(hoverTimeout)
    hoverTimeout = null
  }
  
  // Delay hiding to allow clicking the button
  setTimeout(() => {
    if (!document.querySelector('.odds-comparison-trigger:hover') && 
        !document.querySelector('.odds-comparison-popup:hover')) {
      hideTriggerButton()
      currentHoveredElement = null
    }
  }, 200)
}

function extractEventTitle(element: HTMLElement, platform: string): string | null {
  if (platform === 'polymarket') {
    // Try to find the event title in various ways
    
    // 1. Check if it's a link with href containing event slug
    const link = element.closest('a[href*="/event/"]') as HTMLAnchorElement
    if (link) {
      // Try to get text from the link or its children
      const titleEl = link.querySelector('p, h1, h2, h3, span')
      if (titleEl?.textContent) {
        return cleanTitle(titleEl.textContent)
      }
      // Fallback to link text
      if (link.textContent) {
        return cleanTitle(link.textContent)
      }
    }
    
    // 2. Look for paragraph or heading elements
    const textEl = element.querySelector('p, h1, h2, h3') || element
    if (textEl.textContent) {
      return cleanTitle(textEl.textContent)
    }
    
    // 3. Get text content directly
    return cleanTitle(element.textContent || '')
  }
  
  if (platform === 'opinion') {
    // Similar logic for Opinion
    const link = element.closest('a[href*="/market/"]') as HTMLAnchorElement
    if (link) {
      const titleEl = link.querySelector('h1, h2, h3, p, span')
      if (titleEl?.textContent) {
        return cleanTitle(titleEl.textContent)
      }
      return cleanTitle(link.textContent || '')
    }
    
    const textEl = element.querySelector('h1, h2, h3, p') || element
    return cleanTitle(textEl.textContent || '')
  }
  
  return null
}

function cleanTitle(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^\d+%?\s*/, '') // Remove leading percentages
    .replace(/\$[\d,.]+/g, '') // Remove dollar amounts
    .slice(0, 150) // Limit length
}

// Keep text selection as fallback
function handleMouseDown(): void {
  // Don't hide if hovering over trigger or popup
  if (!document.querySelector('.odds-comparison-trigger:hover') && 
      !document.querySelector('.odds-comparison-popup:hover')) {
    // Only hide if it was from text selection, not hover
  }
}

function handleMouseUp(_event: MouseEvent): void {
  const selection = window.getSelection()
  if (!selection) return

  const selectedText = selection.toString().trim()
  if (selectedText.length < 5 || selectedText.length > 200) {
    return
  }

  // Only show for text selection if not already showing from hover
  if (!currentHoveredElement) {
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    showTriggerButton(selectedText, {
      x: rect.right + window.scrollX + 5,
      y: rect.top + window.scrollY
    })
  }
}

export function getSelectedText(): string {
  const selection = window.getSelection()
  return selection?.toString().trim() || ''
}
