import { describe, expect, it } from 'vitest'
import { key } from './key'
import { createTabSwitcher } from './tab-switcher'

describe('createTabSwitcher', () => {
  it('j/kで選択が移動し、端でクランプされる', () => {
    const switcher = createTabSwitcher(3, 0)
    expect(switcher.feed(key('j'))).toEqual({ type: 'selectionChanged', index: 1 })
    expect(switcher.feed(key('j'))).toEqual({ type: 'selectionChanged', index: 2 })
    expect(switcher.feed(key('j'))).toEqual({ type: 'selectionChanged', index: 2 })
    expect(switcher.feed(key('k'))).toEqual({ type: 'selectionChanged', index: 1 })
  })

  it('数字で選択が移動し、Enterで確定する', () => {
    const switcher = createTabSwitcher(5, 0)
    expect(switcher.feed(key('3'))).toEqual({ type: 'selectionChanged', index: 2 })
    expect(switcher.feed(key('Enter'))).toEqual({ type: 'activate', index: 2 })
  })

  it('複数桁の数字で選択できる', () => {
    const switcher = createTabSwitcher(12, 0)
    expect(switcher.feed(key('1'))).toEqual({ type: 'selectionChanged', index: 0 })
    expect(switcher.feed(key('2'))).toEqual({ type: 'selectionChanged', index: 11 })
  })

  it('桁バッファはj/kでリセットされる', () => {
    const switcher = createTabSwitcher(12, 0)
    switcher.feed(key('1'))
    switcher.feed(key('j'))
    expect(switcher.feed(key('2'))).toEqual({ type: 'selectionChanged', index: 1 })
  })

  it('範囲外の数字は単独桁として再解釈し、それも無効ならnoneを返す', () => {
    const switcher = createTabSwitcher(3, 0)
    expect(switcher.feed(key('2'))).toEqual({ type: 'selectionChanged', index: 1 })
    expect(switcher.feed(key('9'))).toEqual({ type: 'none' })
    expect(switcher.feed(key('3'))).toEqual({ type: 'selectionChanged', index: 2 })
  })

  it('x/n/Escapeが対応するイベントを返す', () => {
    const switcher = createTabSwitcher(3, 1)
    expect(switcher.feed(key('x'))).toEqual({ type: 'closeTab', index: 1 })
    expect(switcher.feed(key('n'))).toEqual({ type: 'newTab' })
    expect(switcher.feed(key('Escape'))).toEqual({ type: 'dismiss' })
  })

  it('修飾キー付きの入力は無視する', () => {
    const switcher = createTabSwitcher(3, 0)
    expect(switcher.feed({ ...key('j'), meta: true })).toEqual({ type: 'none' })
  })
})
