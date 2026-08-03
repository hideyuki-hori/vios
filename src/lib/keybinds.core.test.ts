import { describe, expect, it } from 'vitest'
import { createKeybindMatcher, defaultKeybinds, releasableActions } from './keybinds.core'
import { key } from './keys.core'

describe('releasableActions', () => {
  it('離されたキーに一致する単キーバインドのアクションを返す', () => {
    expect(releasableActions(defaultKeybinds, 'j')).toEqual(['scrollDown'])
    expect(releasableActions(defaultKeybinds, 'Enter')).toEqual([])
  })

  it('大文字小文字を区別しない', () => {
    expect(releasableActions(defaultKeybinds, 'J')).toEqual(['scrollDown'])
  })

  it('複数キーのシーケンスは対象にしない', () => {
    expect(releasableActions(defaultKeybinds, 'g')).toEqual(['scrollToBottom'])
  })
})

describe('createKeybindMatcher', () => {
  it('単打のキーがアクションにマッチする', () => {
    const matcher = createKeybindMatcher(defaultKeybinds)
    expect(matcher.feed(key('j'))).toEqual({ type: 'match', action: 'scrollDown' })
    expect(matcher.feed(key('k'))).toEqual({ type: 'match', action: 'scrollUp' })
    expect(matcher.feed(key('h'))).toEqual({ type: 'match', action: 'historyBack' })
    expect(matcher.feed(key('l'))).toEqual({ type: 'match', action: 'historyForward' })
  })

  it('ggの2打シーケンスがマッチする', () => {
    const matcher = createKeybindMatcher(defaultKeybinds)
    expect(matcher.feed(key('g'))).toEqual({ type: 'pending' })
    expect(matcher.feed(key('g'))).toEqual({ type: 'match', action: 'scrollToTop' })
  })

  it('gとGを区別する', () => {
    const matcher = createKeybindMatcher(defaultKeybinds)
    expect(matcher.feed(key('G'))).toEqual({ type: 'match', action: 'scrollToBottom' })
  })

  it('pending中に無関係なキーが来たら単打として再解釈する', () => {
    const matcher = createKeybindMatcher(defaultKeybinds)
    expect(matcher.feed(key('g'))).toEqual({ type: 'pending' })
    expect(matcher.feed(key('j'))).toEqual({ type: 'match', action: 'scrollDown' })
  })

  it('pending中にどのバインドにも属さないキーが来たらnoneを返す', () => {
    const matcher = createKeybindMatcher(defaultKeybinds)
    expect(matcher.feed(key('g'))).toEqual({ type: 'pending' })
    expect(matcher.feed(key('z'))).toEqual({ type: 'none' })
  })

  it('未定義のキーはnoneを返す', () => {
    const matcher = createKeybindMatcher(defaultKeybinds)
    expect(matcher.feed(key('q'))).toEqual({ type: 'none' })
  })

  it('修飾キー付きは別のキーとして扱う', () => {
    const matcher = createKeybindMatcher(defaultKeybinds)
    expect(matcher.feed({ ...key('j'), ctrl: true })).toEqual({ type: 'none' })
  })

  it('resetでシーケンスの途中状態が消える', () => {
    const matcher = createKeybindMatcher(defaultKeybinds)
    expect(matcher.feed(key('g'))).toEqual({ type: 'pending' })
    matcher.reset()
    expect(matcher.feed(key('g'))).toEqual({ type: 'pending' })
  })
})
