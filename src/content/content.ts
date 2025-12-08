import { initSelectionDetector } from './selection'

// Initialize content script
console.log('[OddsComparison] Content script initializing...')
console.log('[OddsComparison] Current URL:', window.location.href)

initSelectionDetector()

console.log('[OddsComparison] Content script loaded and ready')
