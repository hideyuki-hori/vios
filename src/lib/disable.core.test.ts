import { describe, expect, it } from 'vitest'
import {
  addDisabledSite,
  isDisabledOn,
  normalizeSite,
  parseDisabledSites,
  removeDisabledSite,
} from './disable.core'

describe('normalizeSite', () => {
  it('URLからホスト(とポート)を取り出す', () => {
    expect(normalizeSite('http://localhost:5173/')).toBe('localhost:5173')
    expect(normalizeSite('https://www.Example.com/path')).toBe('example.com')
    expect(normalizeSite('127.0.0.1:8080')).toBe('127.0.0.1:8080')
    expect(normalizeSite('localhost')).toBe('localhost')
  })

  it('解釈できないものはnull', () => {
    expect(normalizeSite('')).toBeNull()
    expect(normalizeSite('host:abc')).toBeNull()
    expect(normalizeSite('bad_host')).toBeNull()
  })
})

describe('parseDisabledSites', () => {
  it('配列以外や文字列以外は捨てる', () => {
    expect(parseDisabledSites(undefined)).toEqual([])
    expect(parseDisabledSites(['a.com', 1, null])).toEqual(['a.com'])
  })
})

describe('isDisabledOn', () => {
  it('ポート無しはサブドメインと全ポートに一致する', () => {
    expect(isDisabledOn('mail.google.com', ['google.com'])).toBe(true)
    expect(isDisabledOn('google.com', ['google.com'])).toBe(true)
    expect(isDisabledOn('localhost:5173', ['localhost'])).toBe(true)
    expect(isDisabledOn('notgoogle.com', ['google.com'])).toBe(false)
    expect(isDisabledOn('example.com', [])).toBe(false)
  })

  it('ポート付きはポートまで一致させる', () => {
    expect(isDisabledOn('localhost:5173', ['localhost:5173'])).toBe(true)
    expect(isDisabledOn('localhost:3000', ['localhost:5173'])).toBe(false)
    expect(isDisabledOn('localhost', ['localhost:5173'])).toBe(false)
  })
})

describe('addDisabledSite / removeDisabledSite', () => {
  it('重複せず追加し、削除できる', () => {
    const added = addDisabledSite(['a.com'], 'b.com')
    expect(added).toEqual(['a.com', 'b.com'])
    expect(addDisabledSite(added, 'a.com')).toEqual(added)
    expect(removeDisabledSite(added, 'a.com')).toEqual(['b.com'])
  })
})
