const smoothingMs = 80
const maxFrameMs = 64
const externalScrollTolerancePx = 2

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

export const createScroller = () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let target = 0
  let animating = false
  let lastTime = 0
  let expected = 0

  const maxScroll = (): number => document.documentElement.scrollHeight - window.innerHeight

  const frame = (time: number): void => {
    if (!animating) return
    if (Math.abs(window.scrollY - expected) > externalScrollTolerancePx) {
      animating = false
      return
    }
    const dt = Math.min(time - lastTime, maxFrameMs)
    lastTime = time
    const delta = target - window.scrollY
    if (Math.abs(delta) < 1) {
      window.scrollTo(0, target)
      animating = false
      return
    }
    const factor = 1 - Math.exp(-dt / smoothingMs)
    window.scrollBy(0, delta * factor)
    expected = window.scrollY
    requestAnimationFrame(frame)
  }

  const startToward = (y: number): void => {
    target = clamp(y, 0, maxScroll())
    if (reduceMotion.matches) {
      window.scrollTo(0, target)
      animating = false
      return
    }
    if (animating) return
    animating = true
    lastTime = performance.now()
    expected = window.scrollY
    requestAnimationFrame(frame)
  }

  return {
    scrollBy: (amount: number): void => {
      const base = animating ? target : window.scrollY
      startToward(base + amount)
    },
    scrollTo: (y: number): void => {
      startToward(y)
    },
  }
}
