import { createHintSession, generateHintLabels, type HintSession } from './hint.core'
import hintCss from './hint.css'
import { toKey } from './keys.to-key'

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

export function isHintModeActive(): boolean {
  return state !== null
}

function closeHints(): void {
  if (!state) return
  state.host.remove()
  window.removeEventListener('blur', closeHints)
  state = null
}

function collectTargets(): HTMLElement[] {
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

function activate(element: HTMLElement): void {
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

export function openHints(): void {
  if (state) return
  const elements = collectTargets()
  if (elements.length === 0) return
  const labels = generateHintLabels(elements.length)
  const host = document.createElement('div')
  const shadow = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = hintCss
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

function showCandidates(candidates: number[]): void {
  if (!state) return
  const visible = new Set(candidates)
  state.badges.forEach((badge, index) => {
    badge.classList.toggle('hidden', !visible.has(index))
  })
}

export function handleHintKeydown(event: KeyboardEvent): void {
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
