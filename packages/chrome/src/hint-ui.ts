import { createHintSession, generateHintLabels, type HintSession } from '@vios/core'
import { toKey } from './keyboard'

const css = `
.layer {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2147483647;
}
.hint {
  position: absolute;
  background: #ffd76e;
  color: #302505;
  border: 1px solid #c9a84c;
  border-radius: 3px;
  padding: 1px 4px;
  font: bold 11px/1.2 system-ui, sans-serif;
  text-transform: uppercase;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}
.hint.hidden {
  display: none;
}
`

const clickableSelector = [
  'a[href]',
  'button',
  "input:not([type='hidden'])",
  'select',
  'textarea',
  'summary',
  "[role='button']",
  "[role='link']",
  "[role='tab']",
  "[role='menuitem']",
  '[onclick]',
  "[contenteditable='true']",
].join(', ')

const textInputTypes = new Set([
  'text',
  'search',
  'email',
  'url',
  'password',
  'number',
  'tel',
  'date',
  'datetime-local',
  'month',
  'week',
  'time',
])

type HintState = {
  host: HTMLDivElement
  badges: HTMLSpanElement[]
  elements: HTMLElement[]
  session: HintSession
}

let state: HintState | null = null

export const isHintModeActive = (): boolean => state !== null

const closeHints = (): void => {
  if (!state) return
  state.host.remove()
  window.removeEventListener('blur', closeHints)
  state = null
}

const collectTargets = (): HTMLElement[] => {
  const elements = document.querySelectorAll<HTMLElement>(clickableSelector)
  const result: HTMLElement[] = []
  for (const element of elements) {
    const rect = element.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) continue
    if (rect.bottom < 0 || rect.right < 0) continue
    if (rect.top > window.innerHeight || rect.left > window.innerWidth) continue
    if (!element.checkVisibility({ checkOpacity: true })) continue
    result.push(element)
  }
  return result
}

const activate = (element: HTMLElement): void => {
  if (element instanceof HTMLInputElement) {
    if (textInputTypes.has(element.type)) {
      element.focus()
      return
    }
    element.click()
    return
  }
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
    element.focus()
    return
  }
  if (element.isContentEditable) {
    element.focus()
    return
  }
  element.click()
}

export const openHints = (): void => {
  if (state) return
  const elements = collectTargets()
  if (elements.length === 0) return
  const labels = generateHintLabels(elements.length)
  const host = document.createElement('div')
  const shadow = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = css
  const layer = document.createElement('div')
  layer.className = 'layer'
  const badges = elements.map((element, index) => {
    const rect = element.getBoundingClientRect()
    const badge = document.createElement('span')
    badge.className = 'hint'
    badge.textContent = labels[index] ?? ''
    badge.style.top = `${Math.max(rect.top + window.scrollY - 6, 0)}px`
    badge.style.left = `${Math.max(rect.left + window.scrollX - 6, 0)}px`
    layer.append(badge)
    return badge
  })
  shadow.append(style, layer)
  document.documentElement.append(host)
  state = { host, badges, elements, session: createHintSession(labels) }
  window.addEventListener('blur', closeHints)
}

const showCandidates = (candidates: number[]): void => {
  if (!state) return
  const visible = new Set(candidates)
  state.badges.forEach((badge, index) => {
    badge.classList.toggle('hidden', !visible.has(index))
  })
}

export const handleHintKeydown = (event: KeyboardEvent): void => {
  if (!state) return
  if (event.isComposing) return
  const input = toKey(event)
  if (input.ctrl || input.alt || input.meta) return
  event.preventDefault()
  event.stopPropagation()
  const result = state.session.feed(input)
  switch (result.type) {
    case 'match': {
      const element = state.elements[result.index]
      closeHints()
      if (element) activate(element)
      return
    }
    case 'filtered':
      showCandidates(result.candidates)
      return
    case 'dismiss':
      closeHints()
      return
    case 'none':
      return
  }
}
