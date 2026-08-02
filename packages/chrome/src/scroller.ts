const smoothingMs = 80
const maxFrameMs = 64
const externalScrollTolerancePx = 2
const farJumpViewports = 3
const holdDelayMs = 150
const holdVelocityPxPerSec = 1000

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

export const createScroller = () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let target = 0
  let animating = false
  let lastTime = 0
  let expected = 0
  let holdDirection = 0
  let pendingDirection = 0
  let holdPending: number | undefined

  const maxScroll = (): number => document.documentElement.scrollHeight - window.innerHeight

  const stopAllHolds = (): void => {
    if (holdPending !== undefined) {
      window.clearTimeout(holdPending)
      holdPending = undefined
    }
    pendingDirection = 0
    holdDirection = 0
  }

  const stopHold = (direction: number): void => {
    if (pendingDirection === direction) {
      if (holdPending !== undefined) {
        window.clearTimeout(holdPending)
        holdPending = undefined
      }
      pendingDirection = 0
    }
    if (holdDirection === direction) holdDirection = 0
  }

  const frame = (time: number): void => {
    if (!animating) return
    if (Math.abs(window.scrollY - expected) > externalScrollTolerancePx) {
      animating = false
      stopAllHolds()
      return
    }
    const dt = Math.min(time - lastTime, maxFrameMs)
    lastTime = time
    if (holdDirection !== 0) {
      target = clamp(target + (holdVelocityPxPerSec * dt * holdDirection) / 1000, 0, maxScroll())
    }
    const delta = target - window.scrollY
    if (Math.abs(delta) < 1) {
      if (holdDirection === 0) {
        window.scrollTo({ top: target, behavior: 'instant' })
        animating = false
        return
      }
      requestAnimationFrame(frame)
      return
    }
    const factor = 1 - Math.exp(-dt / smoothingMs)
    window.scrollBy({ top: delta * factor, behavior: 'instant' })
    expected = window.scrollY
    requestAnimationFrame(frame)
  }

  const startToward = (y: number): void => {
    target = clamp(y, 0, maxScroll())
    if (reduceMotion.matches) {
      window.scrollTo({ top: target, behavior: 'instant' })
      animating = false
      return
    }
    const delta = target - window.scrollY
    const tail = window.innerHeight
    if (Math.abs(delta) > tail * farJumpViewports) {
      window.scrollTo({ top: target - Math.sign(delta) * tail, behavior: 'instant' })
    }
    expected = window.scrollY
    if (animating) return
    animating = true
    lastTime = performance.now()
    requestAnimationFrame(frame)
  }

  return {
    startHold: (direction: number, step: number): void => {
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
    scrollTo: (y: number): void => {
      stopAllHolds()
      startToward(y)
    },
  }
}
