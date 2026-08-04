export const holdDelayMs = 150

const smoothingMs = 80
const maxFrameMs = 64
const externalScrollTolerancePx = 2
const farJumpViewports = 3
const holdVelocityPxPerSec = 1000

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export type ScrollStart =
  | { type: 'instant'; y: number }
  | { type: 'animate'; target: number; teleportTo: number | null }

export function planScrollStart(input: {
  toY: number
  scrollY: number
  viewportHeight: number
  maxScroll: number
  reduceMotion: boolean
}): ScrollStart {
  const target = clamp(input.toY, 0, input.maxScroll)
  if (input.reduceMotion) return { type: 'instant', y: target }
  const delta = target - input.scrollY
  const teleportTo =
    Math.abs(delta) > input.viewportHeight * farJumpViewports
      ? target - Math.sign(delta) * input.viewportHeight
      : null
  return { type: 'animate', target, teleportTo }
}

export type ScrollFrame =
  | { type: 'interrupted' }
  | { type: 'settle'; y: number }
  | { type: 'holdContinue' }
  | { type: 'move'; by: number }

export function stepScrollFrame(input: {
  target: number
  holdDirection: number
  dtMs: number
  scrollY: number
  expectedY: number
  maxScroll: number
}): { target: number; frame: ScrollFrame } {
  if (Math.abs(input.scrollY - input.expectedY) > externalScrollTolerancePx) {
    return { target: input.target, frame: { type: 'interrupted' } }
  }
  const dt = Math.min(input.dtMs, maxFrameMs)
  const target =
    input.holdDirection === 0
      ? input.target
      : clamp(
          input.target + (holdVelocityPxPerSec * dt * input.holdDirection) / 1000,
          0,
          input.maxScroll,
        )
  const delta = target - input.scrollY
  if (Math.abs(delta) < 1) {
    return input.holdDirection === 0
      ? { target, frame: { type: 'settle', y: target } }
      : { target, frame: { type: 'holdContinue' } }
  }
  const factor = 1 - Math.exp(-dt / smoothingMs)
  return { target, frame: { type: 'move', by: delta * factor } }
}
