import { setupMessageHandler } from './message-handler'

console.log('[Background] Service worker starting...')

// Initialize message handler
setupMessageHandler()

// Log when service worker starts
console.log('[Background] Odds Comparison extension background script loaded and ready')
