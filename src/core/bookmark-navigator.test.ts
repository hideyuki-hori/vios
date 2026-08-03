import { describe, expect, it } from 'vitest'
import { createBookmarkNavigator } from './bookmark-navigator'
import { key } from './key'

describe('createBookmarkNavigator', () => {
  it('j/kで選択が移動し、端でクランプされる', () => {
    const navigator = createBookmarkNavigator(3, 0)
    expect(navigator.feed(key('j'))).toEqual({ type: 'selectionChanged', index: 1 })
    expect(navigator.feed(key('j'))).toEqual({ type: 'selectionChanged', index: 2 })
    expect(navigator.feed(key('j'))).toEqual({ type: 'selectionChanged', index: 2 })
    expect(navigator.feed(key('k'))).toEqual({ type: 'selectionChanged', index: 1 })
  })

  it('複数桁の数字で選択できる', () => {
    const navigator = createBookmarkNavigator(12, 0)
    expect(navigator.feed(key('1'))).toEqual({ type: 'selectionChanged', index: 0 })
    expect(navigator.feed(key('2'))).toEqual({ type: 'selectionChanged', index: 11 })
  })

  it('Enterで現在のタブに開く', () => {
    const navigator = createBookmarkNavigator(5, 2)
    expect(navigator.feed(key('Enter'))).toEqual({ type: 'open', index: 2, newTab: false })
  })

  it('Shift+Enterで新規タブに開く', () => {
    const navigator = createBookmarkNavigator(5, 2)
    expect(navigator.feed({ ...key('Enter'), shift: true })).toEqual({
      type: 'open',
      index: 2,
      newTab: true,
    })
  })

  it('Escapeでdismissを返す', () => {
    const navigator = createBookmarkNavigator(3, 0)
    expect(navigator.feed(key('Escape'))).toEqual({ type: 'dismiss' })
  })

  it('修飾キー付きは無視する', () => {
    const navigator = createBookmarkNavigator(3, 0)
    expect(navigator.feed({ ...key('j'), meta: true })).toEqual({ type: 'none' })
  })
})
