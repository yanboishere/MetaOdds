import type { ExtensionMessage, ExtensionResponse } from '../api/types'
import { queryAllPlatforms } from './query-service'
import { loadSettings, saveSettings } from '../utils/storage'

export function setupMessageHandler(): void {
  console.log('[Background] Setting up message handler')
  
  chrome.runtime.onMessage.addListener(
    (message: ExtensionMessage, _sender, sendResponse) => {
      console.log('[Background] Received message:', message.type, message)
      
      handleMessage(message)
        .then(response => {
          console.log('[Background] Sending response, success:', response.success)
          if (response.success && 'data' in response) {
            console.log('[Background] Response data:', response.data)
          }
          sendResponse(response)
        })
        .catch(error => {
          console.error('[Background] Handler error:', error)
          sendResponse({ success: false, error: String(error) })
        })
      
      return true // Keep channel open for async response
    }
  )
}

async function handleMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
  try {
    switch (message.type) {
      case 'QUERY_ODDS': {
        const result = await queryAllPlatforms(
          message.payload.text,
          message.payload.sourcePlatform
        )
        return { success: true, data: result }
      }

      case 'GET_SETTINGS': {
        const settings = await loadSettings()
        return { success: true, data: settings }
      }

      case 'UPDATE_SETTINGS': {
        await saveSettings(message.payload)
        const updated = await loadSettings()
        return { success: true, data: updated }
      }

      default:
        return { success: false, error: 'Unknown message type' }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
