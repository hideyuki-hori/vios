import {
  addMemo,
  createMemoState,
  defaultSize,
  type Memo,
  type MemoState,
  mergeExternal,
  moveFocus,
  moveMemo,
  nextPoint,
  type Point,
  pruneEmpty,
  requestDelete,
  resizeMemo,
  type Size,
  sameMemos,
  setFocus,
  updateText,
} from './memo.core'
import memoCss from './memo.css'
import { loadMemos, saveMemos, subscribeMemos } from './memo.storage'

const saveDelayMs = 300
const cascadeStep = 24
const margin = 16

type Note = { root: HTMLDivElement; area: HTMLTextAreaElement }

type OpenState = {
  host: HTMLDivElement
  shadow: ShadowRoot
  notes: Map<string, Note>
  machine: MemoState
  saveTimer: number | undefined
  unsubscribe: () => void
}

let state: OpenState | null = null

export function isMemoOpen(): boolean {
  return state !== null
}

function clamp(point: Point, root: HTMLElement): Point {
  return {
    x: Math.min(Math.max(point.x, 0), Math.max(window.innerWidth - root.offsetWidth, 0)),
    y: Math.min(Math.max(point.y, 0), Math.max(window.innerHeight - root.offsetHeight, 0)),
  }
}

function originPoint(): Point {
  return { x: Math.max(window.innerWidth - defaultSize.w - margin, 0), y: margin }
}

function scheduleSave(): void {
  if (!state) return
  if (state.saveTimer !== undefined) window.clearTimeout(state.saveTimer)
  state.saveTimer = window.setTimeout(() => {
    if (!state) return
    state.saveTimer = undefined
    void saveMemos(state.machine.memos)
  }, saveDelayMs)
}

function attachDrag(grip: HTMLDivElement, root: HTMLDivElement, id: string): void {
  grip.addEventListener('pointerdown', (event) => {
    if (!state) return
    event.preventDefault()
    const memo = state.machine.memos.find((item) => item.id === id)
    if (!memo) return
    const offset = { x: event.clientX - memo.x, y: event.clientY - memo.y }
    grip.setPointerCapture(event.pointerId)
    state.machine = setFocus(state.machine, id)
    render()
    function onMove(move: PointerEvent): void {
      if (!state) return
      const point = clamp({ x: move.clientX - offset.x, y: move.clientY - offset.y }, root)
      state.machine = moveMemo(state.machine, id, point)
      render()
    }
    function onUp(): void {
      grip.removeEventListener('pointermove', onMove)
      grip.removeEventListener('pointerup', onUp)
      grip.removeEventListener('pointercancel', onUp)
      scheduleSave()
    }
    grip.addEventListener('pointermove', onMove)
    grip.addEventListener('pointerup', onUp)
    grip.addEventListener('pointercancel', onUp)
  })
}

function attachResize(root: HTMLDivElement, id: string): void {
  const observer = new ResizeObserver(() => {
    if (!state) return
    const memo = state.machine.memos.find((item) => item.id === id)
    if (!memo) {
      observer.disconnect()
      return
    }
    const size: Size = { w: root.offsetWidth, h: root.offsetHeight }
    if (size.w === memo.w && size.h === memo.h) return
    state.machine = resizeMemo(state.machine, id, size)
    scheduleSave()
  })
  observer.observe(root)
}

function createNote(memo: Memo): Note {
  const root = document.createElement('div')
  root.className = 'note'
  const grip = document.createElement('div')
  grip.className = 'grip'
  const area = document.createElement('textarea')
  area.className = 'memo'
  area.placeholder = 'メモ'
  area.value = memo.text
  area.addEventListener('input', () => {
    if (!state) return
    state.machine = updateText(state.machine, memo.id, area.value, Date.now())
    render()
    scheduleSave()
  })
  area.addEventListener('focus', () => {
    if (!state) return
    state.machine = setFocus(state.machine, memo.id)
    render()
  })
  attachDrag(grip, root, memo.id)
  attachResize(root, memo.id)
  root.append(grip, area)
  return { root, area }
}

function render(): void {
  if (!state) return
  const { shadow, notes, machine } = state
  for (const [id, note] of notes) {
    if (!machine.memos.some((memo) => memo.id === id)) {
      note.root.remove()
      notes.delete(id)
    }
  }
  for (const memo of machine.memos) {
    let note = notes.get(memo.id)
    if (!note) {
      note = createNote(memo)
      notes.set(memo.id, note)
      shadow.append(note.root)
    }
    note.root.style.left = `${memo.x}px`
    note.root.style.top = `${memo.y}px`
    note.root.style.width = `${memo.w}px`
    note.root.style.height = `${memo.h}px`
    const focused = shadow.activeElement === note.area
    if (!focused && note.area.value !== memo.text) note.area.value = memo.text
    note.root.classList.toggle('focused', machine.focusedId === memo.id)
    note.root.classList.toggle('pending', machine.pendingDeleteId === memo.id)
  }
  const target = machine.focusedId === null ? undefined : notes.get(machine.focusedId)
  if (target && shadow.activeElement !== target.area) target.area.focus()
}

function close(): void {
  if (!state) return
  const { host, saveTimer, unsubscribe, machine } = state
  if (saveTimer !== undefined) window.clearTimeout(saveTimer)
  unsubscribe()
  host.remove()
  state = null
  void saveMemos(pruneEmpty(machine.memos))
}

function onExternalChange(memos: Memo[]): void {
  if (!state) return
  if (sameMemos(state.machine.memos, memos)) return
  state.machine = mergeExternal(state.machine, memos)
  render()
}

function createMemo(): void {
  if (!state) return
  const point = nextPoint(state.machine.memos, originPoint(), cascadeStep)
  state.machine = addMemo(state.machine, crypto.randomUUID(), point, Date.now())
}

async function open(): Promise<void> {
  if (state) return
  const memos = await loadMemos()
  if (state) return
  const host = document.createElement('div')
  const shadow = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = memoCss
  shadow.append(style)
  document.documentElement.append(host)
  state = {
    host,
    shadow,
    notes: new Map(),
    machine: createMemoState(memos),
    saveTimer: undefined,
    unsubscribe: subscribeMemos(onExternalChange),
  }
  if (memos.length === 0) createMemo()
  render()
}

export function toggleMemo(): void {
  if (state) {
    close()
    return
  }
  void open()
}

function focusInside(): boolean {
  return state !== null && state.shadow.activeElement !== null
}

export function handleMemoKeydown(event: KeyboardEvent): boolean {
  if (!state) return false
  if (event.isComposing) return false
  if (event.key === 'Escape') {
    close()
    return true
  }
  if (!focusInside()) return false
  if (!event.ctrlKey || event.altKey || event.metaKey) return true
  switch (event.key) {
    case 'n':
      createMemo()
      break
    case 'j':
      state.machine = moveFocus(state.machine, 1)
      break
    case 'k':
      state.machine = moveFocus(state.machine, -1)
      break
    case 'd': {
      const result = requestDelete(state.machine)
      state.machine = result.state
      if (result.removed) scheduleSave()
      break
    }
    default:
      return true
  }
  event.preventDefault()
  event.stopPropagation()
  render()
  return true
}
