import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import type { Settings, Platform } from '../api/types'
import { DEFAULT_SETTINGS } from '../api/types'

function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
      if (response?.success) {
        setSettings(response.data)
      }
      setLoading(false)
    })
  }, [])

  const togglePlatform = (platform: Platform) => {
    const enabled = settings.enabledPlatforms.includes(platform)
    const newPlatforms = enabled
      ? settings.enabledPlatforms.filter(p => p !== platform)
      : [...settings.enabledPlatforms, platform]

    const newSettings = { ...settings, enabledPlatforms: newPlatforms }
    setSettings(newSettings)

    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      payload: { enabledPlatforms: newPlatforms }
    })
  }

  if (loading) {
    return <div className="settings-container">加载中...</div>
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <span>📊</span>
        <h1>赔率对比设置</h1>
      </div>

      <div className="settings-section">
        <h2>启用平台</h2>

        <div className="platform-toggle">
          <span className="platform-name">Polymarket</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.enabledPlatforms.includes('polymarket')}
              onChange={() => togglePlatform('polymarket')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="platform-toggle">
          <span className="platform-name">Opinion</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.enabledPlatforms.includes('opinion')}
              onChange={() => togglePlatform('opinion')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="settings-footer">
        选中文本后点击 📊 按钮查询赔率
      </div>
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
