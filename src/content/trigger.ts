import { showPopup } from './popup'
import { getCurrentPlatform } from './selection'

let triggerButton: HTMLElement | null = null
let currentSelectedText: string = ''

export function showTriggerButton(
  selectedText: string,
  position: { x: number; y: number }
): void {
  console.log('[OddsComparison] Showing trigger button for:', selectedText.slice(0, 50))
  
  // Don't recreate if same text
  if (triggerButton && currentSelectedText === selectedText) {
    return
  }
  
  hideTriggerButton()

  currentSelectedText = selectedText

  triggerButton = document.createElement('button')
  triggerButton.className = 'odds-comparison-trigger'
  triggerButton.innerHTML = '📊'
  triggerButton.title = `比较赔率: ${selectedText.slice(0, 50)}...`

  triggerButton.style.cssText = `
    position: absolute;
    left: ${position.x}px;
    top: ${position.y}px;
    z-index: 999999;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: #4F46E5;
    color: white;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 12px rgba(79, 70, 229, 0.4);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  `

  triggerButton.addEventListener('click', handleTriggerClick)
  triggerButton.addEventListener('mouseenter', () => {
    if (triggerButton) {
      triggerButton.style.transform = 'scale(1.15)'
      triggerButton.style.boxShadow = '0 4px 16px rgba(79, 70, 229, 0.5)'
    }
  })
  triggerButton.addEventListener('mouseleave', () => {
    if (triggerButton) {
      triggerButton.style.transform = 'scale(1)'
      triggerButton.style.boxShadow = '0 2px 12px rgba(79, 70, 229, 0.4)'
    }
  })

  document.body.appendChild(triggerButton)
}

export function hideTriggerButton(): void {
  if (triggerButton) {
    triggerButton.remove()
    triggerButton = null
  }
}

function handleTriggerClick(event: MouseEvent): void {
  event.stopPropagation()
  console.log('[OddsComparison] Trigger clicked, searching for:', currentSelectedText)

  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const position = {
    x: rect.right + window.scrollX + 10,
    y: rect.top + window.scrollY
  }

  showPopup(currentSelectedText, position, getCurrentPlatform())
  hideTriggerButton()
}
