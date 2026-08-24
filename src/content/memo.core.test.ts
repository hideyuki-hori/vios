import { describe, expect, it } from 'vitest'
import {
  addMemo,
  createMemoState,
  type Memo,
  mergeExternal,
  moveFocus,
  moveMemo,
  nextPoint,
  parseMemos,
  pruneEmpty,
  requestDelete,
  resizeMemo,
  sameMemos,
  updateText,
} from './memo.core'

const memos: Memo[] = [
  { id: 'a', text: 'A', updatedAt: 1, x: 10, y: 10, w: 260, h: 140 },
  { id: 'b', text: 'B', updatedAt: 2, x: 20, y: 20, w: 260, h: 140 },
  { id: 'c', text: '', updatedAt: 3, x: 30, y: 30, w: 260, h: 140 },
]
const origin = { x: 100, y: 100 }

describe('parseMemos', () => {
  it('壊れた値は空配列にする', () => {
    expect(parseMemos(undefined)).toEqual([])
    expect(parseMemos({ memos: 'x' })).toEqual([])
  })

  it('形の合う要素だけ残す', () => {
    expect(parseMemos({ memos: [memos[0], { id: 1 }, null] })).toEqual([memos[0]])
  })

  it('座標やサイズが無い旧データは既定値を補う', () => {
    expect(parseMemos({ memos: [{ id: 'a', text: 'A', updatedAt: 1 }] })).toEqual([
      { id: 'a', text: 'A', updatedAt: 1, x: 16, y: 16, w: 260, h: 140 },
    ])
  })
})

describe('createMemoState / addMemo', () => {
  it('末尾の付箋にフォーカスする', () => {
    expect(createMemoState(memos).focusedId).toBe('c')
    expect(createMemoState([]).focusedId).toBeNull()
  })

  it('追加した付箋にフォーカスが移る', () => {
    const state = addMemo(createMemoState(memos), 'd', origin, 10)
    expect(state.memos.map((memo) => memo.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(state.focusedId).toBe('d')
    expect(state.memos[3]).toMatchObject(origin)
  })
})

describe('nextPoint / moveMemo', () => {
  it('末尾の付箋からずらした位置を返し、無ければ起点を返す', () => {
    expect(nextPoint(memos, origin, 24)).toEqual({ x: 54, y: 54 })
    expect(nextPoint([], origin, 24)).toEqual(origin)
  })

  it('指定した付箋だけ動かす', () => {
    const state = moveMemo(createMemoState(memos), 'a', { x: 1, y: 2 })
    expect(state.memos[0]).toMatchObject({ x: 1, y: 2 })
    expect(state.memos[1]).toMatchObject({ x: 20, y: 20 })
  })

  it('指定した付箋だけサイズを変える', () => {
    const state = resizeMemo(createMemoState(memos), 'b', { w: 300, h: 200 })
    expect(state.memos[1]).toMatchObject({ w: 300, h: 200 })
    expect(state.memos[0]).toMatchObject({ w: 260, h: 140 })
  })
})

describe('moveFocus', () => {
  it('前後に移動し端で止まる', () => {
    const state = createMemoState(memos)
    expect(moveFocus(state, -1).focusedId).toBe('b')
    expect(moveFocus(moveFocus(state, -1), -1).focusedId).toBe('a')
    expect(moveFocus(moveFocus(moveFocus(state, -1), -1), -1).focusedId).toBe('a')
    expect(moveFocus(state, 1).focusedId).toBe('c')
  })

  it('フォーカスが無い時は端から入る', () => {
    const state = { ...createMemoState(memos), focusedId: null }
    expect(moveFocus(state, 1).focusedId).toBe('a')
    expect(moveFocus(state, -1).focusedId).toBe('c')
  })
})

describe('requestDelete', () => {
  it('空の付箋は1回で消える', () => {
    const result = requestDelete(createMemoState(memos))
    expect(result.removed).toBe(true)
    expect(result.state.memos.map((memo) => memo.id)).toEqual(['a', 'b'])
    expect(result.state.focusedId).toBe('b')
  })

  it('本文ありは2回目で消え、途中の編集で取り消される', () => {
    const state = { ...createMemoState(memos), focusedId: 'a' }
    const first = requestDelete(state)
    expect(first.removed).toBe(false)
    expect(first.state.pendingDeleteId).toBe('a')
    const second = requestDelete(first.state)
    expect(second.removed).toBe(true)
    expect(second.state.focusedId).toBe('b')
    const edited = updateText(first.state, 'a', 'A2', 5)
    expect(edited.pendingDeleteId).toBeNull()
    expect(requestDelete(edited).removed).toBe(false)
  })

  it('フォーカスの移動で保留が解ける', () => {
    const state = { ...createMemoState(memos), focusedId: 'a' }
    const moved = moveFocus(requestDelete(state).state, 1)
    expect(moved.pendingDeleteId).toBeNull()
  })
})

describe('mergeExternal', () => {
  it('編集中の付箋は残し他は外部で置き換える', () => {
    const state = updateText({ ...createMemoState(memos), focusedId: 'a' }, 'a', 'local', 9)
    const external: Memo[] = [
      { id: 'a', text: 'remote', updatedAt: 8, x: 10, y: 10, w: 260, h: 140 },
      { id: 'z', text: 'Z', updatedAt: 8, x: 0, y: 0, w: 260, h: 140 },
    ]
    const merged = mergeExternal(state, external)
    expect(merged.memos).toEqual([
      { id: 'a', text: 'local', updatedAt: 9, x: 10, y: 10, w: 260, h: 140 },
      external[1],
    ])
  })

  it('外部で消された編集中の付箋は末尾に残る', () => {
    const state = { ...createMemoState(memos), focusedId: 'a' }
    const merged = mergeExternal(state, [
      { id: 'b', text: 'B', updatedAt: 2, x: 0, y: 0, w: 260, h: 140 },
    ])
    expect(merged.memos.map((memo) => memo.id)).toEqual(['b', 'a'])
  })
})

describe('pruneEmpty / sameMemos', () => {
  it('空文字の付箋を落とす', () => {
    expect(pruneEmpty(memos).map((memo) => memo.id)).toEqual(['a', 'b'])
  })

  it('内容の一致を判定する', () => {
    expect(sameMemos(memos, [...memos])).toBe(true)
    expect(sameMemos(memos, memos.slice(0, 2))).toBe(false)
  })
})
