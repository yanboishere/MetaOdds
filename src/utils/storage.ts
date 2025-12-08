import type { Settings } from '../api/types'
import { DEFAULT_SETTINGS } from '../api/types'

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const current = await loadSettings()
  const updated = { ...current, ...settings }
  await chrome.storage.local.set({ settings: updated })
}

export async function loadSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get('settings')
  return result.settings ?? DEFAULT_SETTINGS
}

export async function resetSettings(): Promise<void> {
  await chrome.storage.local.set({ settings: DEFAULT_SETTINGS })
}
