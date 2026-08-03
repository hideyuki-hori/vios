import { holdDelayMs, planScrollStart, stepScrollFrame } from './scroll.core'

export function createScroller() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let target = 0
  let animating = false
  let lastTime = 0
  let expected = 0
  let holdDirection = 0
  let pendingDirection = 0
  let holdPending: number | undefined

  function maxScroll(): number {
    return document.documentElement.scrollHeight - window.innerHeight
  }

  function stopAllHolds(): void {
    if (holdPending !== undefined) {
      window.clearTimeout(holdPending)
      holdPending = undefined
    }
    pendingDirection = 0
    holdDirection = 0
  }

  function stopHold(direction: number): void {
    if (pendingDirection === direction) {
      if (holdPending !== undefined) {
        window.clearTimeout(holdPending)
        holdPending = undefined
      }
      pendingDirection = 0
    }
    if (holdDirection === direction) holdDirection = 0
  }

  function frame(time: number): void {
    if (!animating) return
    const result = stepScrollFrame({
      target,
      holdDirection,
      dtMs: time - lastTime,
      scrollY: window.scrollY,
      expectedY: expected,
      maxScroll: maxScroll(),
    })
    lastTime = time
    target = result.target
    switch (result.frame.type) {
      case 'interrupted':
        animating = false
        stopAllHolds()
        return
      case 'settle':
        window.scrollTo({ top: result.frame.y, behavior: 'instant' })
        animating = false
        return
      case 'holdContinue':
        requestAnimationFrame(frame)
        return
      case 'move':
        window.scrollBy({ top: result.frame.by, behavior: 'instant' })
        expected = window.scrollY
        requestAnimationFrame(frame)
        return
    }
  }

  function startToward(y: number): void {
    const plan = planScrollStart({
      toY: y,
      scrollY: window.scrollY,
      viewportHeight: window.innerHeight,
      maxScroll: maxScroll(),
      reduceMotion: reduceMotion.matches,
    })
    if (plan.type === 'instant') {
      target = plan.y
      window.scrollTo({ top: plan.y, behavior: 'instant' })
      animating = false
      return
    }
    target = plan.target
    if (plan.teleportTo !== null) {
      window.scrollTo({ top: plan.teleportTo, behavior: 'instant' })
    }
    expected = window.scrollY
    if (animating) return
    animating = true
    lastTime = performance.now()
    requestAnimationFrame(frame)
  }

  return {
    scrollBy(amount: number): void {
      stopAllHolds()
      const base = animating ? target : window.scrollY
      startToward(base + amount)
    },
    startHold(direction: number, step: number): void {
      stopAllHolds()
      const base = animating ? target : window.scrollY
      startToward(base + step * direction)
      pendingDirection = direction
      holdPending = window.setTimeout(() => {
        holdPending = undefined
        pendingDirection = 0
        holdDirection = direction
        startToward(target)
      }, holdDelayMs)
    },
    stopHold,
    scrollTo(y: number): void {
      stopAllHolds()
      startToward(y)
    },
  }
}
