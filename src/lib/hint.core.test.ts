import { describe, expect, it } from 'vitest'
import { createHintSession, generateHintLabels } from '~/lib/hint.core'
import { key } from '~/lib/keys.core'

describe('generateHintLabels', () => {
  it('0以下は空配列を返す', () => {
    expect(generateHintLabels(0)).toEqual([])
    expect(generateHintLabels(-1)).toEqual([])
  })

  it('26個までは1文字ラベル', () => {
    const labels = generateHintLabels(26)
    expect(labels).toHaveLength(26)
    expect(labels[0]).toBe('a')
    expect(labels[25]).toBe('z')
    expect(new Set(labels).size).toBe(26)
  })

  it('27個以上は全ラベルが同じ長さになりプレフィックス衝突しない', () => {
    const labels = generateHintLabels(27)
    expect(labels).toHaveLength(27)
    expect(labels.every((label) => label.length === 2)).toBe(true)
    expect(labels[0]).toBe('aa')
    expect(new Set(labels).size).toBe(27)
  })
})

describe('createHintSession', () => {
  it('1文字ラベルの一致でmatchを返す', () => {
    const session = createHintSession(generateHintLabels(3))
    expect(session.feed(key('b'))).toEqual({ type: 'match', index: 1 })
  })

  it('大文字入力でも一致する', () => {
    const session = createHintSession(generateHintLabels(3))
    expect(session.feed(key('B'))).toEqual({ type: 'match', index: 1 })
  })

  it('2文字ラベルは1文字目でfiltered、2文字目でmatchになる', () => {
    const session = createHintSession(generateHintLabels(30))
    const first = session.feed(key('a'))
    expect(first.type).toBe('filtered')
    if (first.type === 'filtered') {
      expect(first.prefix).toBe('a')
      expect(first.candidates).toHaveLength(26)
    }
    expect(session.feed(key('c'))).toEqual({ type: 'match', index: 2 })
  })

  it('候補のないキーはnoneでプレフィックスを保持する', () => {
    const session = createHintSession(generateHintLabels(3))
    expect(session.feed(key('z'))).toEqual({ type: 'none' })
    expect(session.feed(key('a'))).toEqual({ type: 'match', index: 0 })
  })

  it('Backspaceで1文字戻る', () => {
    const session = createHintSession(generateHintLabels(30))
    session.feed(key('a'))
    const result = session.feed(key('Backspace'))
    expect(result.type).toBe('filtered')
    if (result.type === 'filtered') {
      expect(result.prefix).toBe('')
      expect(result.candidates).toHaveLength(30)
    }
  })

  it('Escapeでdismissを返す', () => {
    const session = createHintSession(generateHintLabels(3))
    expect(session.feed(key('Escape'))).toEqual({ type: 'dismiss' })
  })

  it('修飾キー付きは無視する', () => {
    const session = createHintSession(generateHintLabels(3))
    expect(session.feed({ ...key('a'), meta: true })).toEqual({ type: 'none' })
  })
})
