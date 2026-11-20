'use client'

import { useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import type { ComponentProps, Ref } from 'react'
import { cn } from '@/lib/utils'

const GRAVITY = 0.24
const DRAG = 0.992
const TERMINAL_VELOCITY = 7
const DECAY = 0.0125

const DEFAULT_COLORS = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#14b8a6']

export interface ConfettiHandle {
  fire: () => void
}

export interface ConfettiProps extends Omit<ComponentProps<'canvas'>, 'ref'> {
  fire?: boolean
  count?: number
  origin?: { x: number; y: number }
  spread?: number
  colors?: string[]
  ref?: Ref<ConfettiHandle>
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  tilt: number
  spin: number
  life: number
  color: string
}

export function Confetti({
  fire = false,
  count = 90,
  origin = { x: 0.5, y: 0.45 },
  spread = 11,
  colors = DEFAULT_COLORS,
  className,
  ref,
  ...props
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const frameRef = useRef<number | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    if (!canvas || !context) return

    const ratio = window.devicePixelRatio || 1
    context.clearRect(0, 0, canvas.width, canvas.height)
    const alive: Particle[] = []

    for (const particle of particlesRef.current) {
      particle.vy = Math.min(particle.vy + GRAVITY, TERMINAL_VELOCITY)
      particle.vx *= DRAG
      particle.x += particle.vx
      particle.y += particle.vy
      particle.tilt += particle.spin
      particle.life -= DECAY

      if (particle.life <= 0) continue
      alive.push(particle)

      context.save()
      context.translate(particle.x * ratio, particle.y * ratio)
      context.rotate(particle.tilt)
      context.globalAlpha = Math.min(1, particle.life)
      context.fillStyle = particle.color
      context.fillRect(
        (-particle.size / 2) * ratio,
        (-particle.size / 4) * ratio,
        particle.size * ratio,
        ((particle.size / 2) * Math.abs(Math.cos(particle.tilt)) + 1) * ratio,
      )
      context.restore()
    }

    particlesRef.current = alive
    if (alive.length > 0) {
      frameRef.current = window.requestAnimationFrame(draw)
      return
    }

    frameRef.current = null
    context.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const start = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || colors.length === 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ratio = window.devicePixelRatio || 1
    const { width, height } = canvas.getBoundingClientRect()
    const pixelWidth = Math.round(width * ratio)
    const pixelHeight = Math.round(height * ratio)

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth
      canvas.height = pixelHeight
    }

    for (let index = 0; index < count; index += 1) {
      const angle = Math.PI * (1.15 + Math.random() * 0.7)
      const velocity = spread * (0.45 + Math.random() * 0.55)

      particlesRef.current.push({
        x: origin.x * width,
        y: origin.y * height,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        size: 6 + Math.random() * 6,
        tilt: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.34,
        life: 1,
        color: colors[index % colors.length],
      })
    }

    if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(draw)
  }, [colors, count, draw, origin.x, origin.y, spread])

  useImperativeHandle(ref, () => ({ fire: start }), [start])

  useEffect(() => {
    if (fire) start()
  }, [fire, start])

  useEffect(
    () => () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
    },
    [],
  )

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 z-10 size-full motion-reduce:hidden', className)}
      {...props}
    />
  )
}

export default Confetti
