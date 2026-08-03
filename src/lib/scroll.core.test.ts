import { describe, expect, it } from 'vitest'
import { planScrollStart, stepScrollFrame } from './scroll.core'

describe('planScrollStart', () => {
  it('目標を0とmaxScrollの範囲にクランプする', () => {
    expect(
      planScrollStart({
        toY: -100,
        scrollY: 0,
        viewportHeight: 1000,
        maxScroll: 5000,
        reduceMotion: false,
      }),
    ).toEqual({ type: 'animate', target: 0, teleportTo: null })
    expect(
      planScrollStart({
        toY: 99999,
        scrollY: 4000,
        viewportHeight: 1000,
        maxScroll: 5000,
        reduceMotion: false,
      }),
    ).toEqual({ type: 'animate', target: 5000, teleportTo: null })
  })

  it('reduce-motionでは即時ジャンプになる', () => {
    expect(
      planScrollStart({
        toY: 3000,
        scrollY: 0,
        viewportHeight: 1000,
        maxScroll: 5000,
        reduceMotion: true,
      }),
    ).toEqual({ type: 'instant', y: 3000 })
  })

  it('3ビューポートを超える移動は1ビューポート手前へテレポートする', () => {
    expect(
      planScrollStart({
        toY: 4000,
        scrollY: 0,
        viewportHeight: 1000,
        maxScroll: 5000,
        reduceMotion: false,
      }),
    ).toEqual({ type: 'animate', target: 4000, teleportTo: 3000 })
    expect(
      planScrollStart({
        toY: 0,
        scrollY: 5000,
        viewportHeight: 1000,
        maxScroll: 5000,
        reduceMotion: false,
      }),
    ).toEqual({ type: 'animate', target: 0, teleportTo: 1000 })
  })

  it('ちょうど3ビューポートまではテレポートしない', () => {
    expect(
      planScrollStart({
        toY: 3000,
        scrollY: 0,
        viewportHeight: 1000,
        maxScroll: 5000,
        reduceMotion: false,
      }),
    ).toEqual({ type: 'animate', target: 3000, teleportTo: null })
  })
})

describe('stepScrollFrame', () => {
  const base = {
    target: 1000,
    holdDirection: 0,
    dtMs: 16,
    scrollY: 0,
    expectedY: 0,
    maxScroll: 5000,
  }

  it('外部スクロールを検知したら中断する', () => {
    expect(stepScrollFrame({ ...base, scrollY: 210, expectedY: 200 })).toEqual({
      target: 1000,
      frame: { type: 'interrupted' },
    })
    expect(
      stepScrollFrame({ ...base, scrollY: 202, expectedY: 200, target: 1000 }).frame.type,
    ).toBe('move')
  })

  it('残距離に指数平滑の係数を掛けた分だけ動かす', () => {
    const result = stepScrollFrame(base)
    expect(result.target).toBe(1000)
    expect(result.frame.type).toBe('move')
    if (result.frame.type === 'move') {
      expect(result.frame.by).toBeCloseTo(1000 * (1 - Math.exp(-16 / 80)), 6)
    }
  })

  it('フレーム間隔は64msでクランプされる', () => {
    const result = stepScrollFrame({ ...base, dtMs: 1000 })
    if (result.frame.type === 'move') {
      expect(result.frame.by).toBeCloseTo(1000 * (1 - Math.exp(-64 / 80)), 6)
    } else {
      expect.unreachable()
    }
  })

  it('残距離1px未満でホールドなしなら目標に吸着して終了する', () => {
    expect(stepScrollFrame({ ...base, target: 100.4, scrollY: 100, expectedY: 100 })).toEqual({
      target: 100.4,
      frame: { type: 'settle', y: 100.4 },
    })
  })

  it('ホールド中は速度分だけ目標が進む', () => {
    const result = stepScrollFrame({
      ...base,
      target: 500,
      scrollY: 500,
      expectedY: 500,
      holdDirection: 1,
    })
    expect(result.target).toBe(516)
    expect(result.frame.type).toBe('move')
  })

  it('ホールド中でも端では目標がクランプされ、待機を続ける', () => {
    expect(
      stepScrollFrame({ ...base, target: 5000, scrollY: 5000, expectedY: 5000, holdDirection: 1 }),
    ).toEqual({ target: 5000, frame: { type: 'holdContinue' } })
    expect(
      stepScrollFrame({ ...base, target: 0, scrollY: 0, expectedY: 0, holdDirection: -1 }),
    ).toEqual({ target: 0, frame: { type: 'holdContinue' } })
  })
})
