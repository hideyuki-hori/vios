export type Memo = {
  id: string
  text: string
  updatedAt: number
  x: number
  y: number
  w: number
  h: number
}

export type Point = { x: number; y: number }

export type Size = { w: number; h: number }

export type MemoState = {
  memos: Memo[]
  focusedId: string | null
  pendingDeleteId: string | null
}

export type DeleteResult = { state: MemoState; removed: boolean }

const defaultPoint: Point = { x: 16, y: 16 }
export const defaultSize: Size = { w: 260, h: 140 }

function toMemo(value: unknown): Memo | null {
  if (typeof value !== 'object' || value === null) return null
  const record: Record<string, unknown> = { ...value }
  const { id, text, updatedAt, x, y, w, h } = record
  if (typeof id !== 'string' || typeof text !== 'string' || typeof updatedAt !== 'number') {
    return null
  }
  return {
    id,
    text,
    updatedAt,
    x: typeof x === 'number' ? x : defaultPoint.x,
    y: typeof y === 'number' ? y : defaultPoint.y,
    w: typeof w === 'number' ? w : defaultSize.w,
    h: typeof h === 'number' ? h : defaultSize.h,
  }
}

export function parseMemos(raw: unknown): Memo[] {
  if (typeof raw !== 'object' || raw === null) return []
  const record: Record<string, unknown> = { ...raw }
  if (!Array.isArray(record.memos)) return []
  return record.memos.flatMap((item) => {
    const memo = toMemo(item)
    return memo ? [memo] : []
  })
}

export function createMemoState(memos: Memo[]): MemoState {
  const last = memos[memos.length - 1]
  return { memos, focusedId: last ? last.id : null, pendingDeleteId: null }
}

export function nextPoint(memos: Memo[], origin: Point, step: number): Point {
  const last = memos[memos.length - 1]
  return last ? { x: last.x + step, y: last.y + step } : origin
}

export function addMemo(state: MemoState, id: string, point: Point, now: number): MemoState {
  return {
    memos: [
      ...state.memos,
      { id, text: '', updatedAt: now, x: point.x, y: point.y, w: defaultSize.w, h: defaultSize.h },
    ],
    focusedId: id,
    pendingDeleteId: null,
  }
}

export function updateText(state: MemoState, id: string, text: string, now: number): MemoState {
  return {
    memos: state.memos.map((memo) => (memo.id === id ? { ...memo, text, updatedAt: now } : memo)),
    focusedId: state.focusedId,
    pendingDeleteId: null,
  }
}

export function moveMemo(state: MemoState, id: string, point: Point): MemoState {
  return {
    ...state,
    memos: state.memos.map((memo) => (memo.id === id ? { ...memo, x: point.x, y: point.y } : memo)),
  }
}

export function resizeMemo(state: MemoState, id: string, size: Size): MemoState {
  return {
    ...state,
    memos: state.memos.map((memo) => (memo.id === id ? { ...memo, w: size.w, h: size.h } : memo)),
  }
}

export function setFocus(state: MemoState, id: string | null): MemoState {
  if (id === state.focusedId) return state
  return { ...state, focusedId: id, pendingDeleteId: null }
}

export function moveFocus(state: MemoState, delta: number): MemoState {
  if (state.memos.length === 0) return state
  const current = state.memos.findIndex((memo) => memo.id === state.focusedId)
  const base = current === -1 ? (delta > 0 ? -1 : state.memos.length) : current
  const next = Math.min(Math.max(base + delta, 0), state.memos.length - 1)
  const target = state.memos[next]
  return setFocus(state, target ? target.id : null)
}

function removeMemo(state: MemoState, id: string): MemoState {
  const index = state.memos.findIndex((memo) => memo.id === id)
  const memos = state.memos.filter((memo) => memo.id !== id)
  const neighbor = memos[Math.min(index, memos.length - 1)]
  return { memos, focusedId: neighbor ? neighbor.id : null, pendingDeleteId: null }
}

export function requestDelete(state: MemoState): DeleteResult {
  const target = state.memos.find((memo) => memo.id === state.focusedId)
  if (!target) return { state, removed: false }
  if (target.text === '' || state.pendingDeleteId === target.id) {
    return { state: removeMemo(state, target.id), removed: true }
  }
  return { state: { ...state, pendingDeleteId: target.id }, removed: false }
}

export function pruneEmpty(memos: Memo[]): Memo[] {
  return memos.filter((memo) => memo.text !== '')
}

export function mergeExternal(state: MemoState, external: Memo[]): MemoState {
  const editing = state.memos.find((memo) => memo.id === state.focusedId)
  if (!editing) return { ...state, memos: external }
  const found = external.some((memo) => memo.id === editing.id)
  const memos = found
    ? external.map((memo) => (memo.id === editing.id ? editing : memo))
    : [...external, editing]
  return { ...state, memos }
}

export function sameMemos(a: Memo[], b: Memo[]): boolean {
  return (
    a.length === b.length &&
    a.every((memo, index) => {
      const other = b[index]
      return (
        other !== undefined &&
        memo.id === other.id &&
        memo.text === other.text &&
        memo.updatedAt === other.updatedAt &&
        memo.x === other.x &&
        memo.y === other.y &&
        memo.w === other.w &&
        memo.h === other.h
      )
    })
  )
}
