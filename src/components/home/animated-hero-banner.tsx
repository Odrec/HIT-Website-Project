'use client'

import { useEffect, useRef } from 'react'
import styles from './animated-hero-banner.module.css'

type AnimationKey =
  | 'wave-shift'
  | 'slow-rotate'
  | 'slow-rotate-rev'
  | 'slow-pulse'
  | 'slow-fade'
  | 'slow-tilt'
  | 'slow-blink'
  | 'slow-breathe'

type KeepEntry = {
  tx: number
  ty: number
  scale: number
  animation: AnimationKey
  duration: number
}

const KEEP: Record<string, KeepEntry> = {
  doppelstern:      { tx:  650, ty:  65, scale: 0.9,  animation: 'slow-blink',      duration:  8 },
  u:                { tx:  440, ty:  80, scale: 0.7,  animation: 'slow-fade',       duration: 14 },
  pfeile:           { tx:  790, ty: 110, scale: 0.55, animation: 'slow-pulse',      duration: 10 },
  plusfeld:         { tx:  380, ty: 110, scale: 0.85, animation: 'slow-pulse',      duration:  9 },
  wortsalat:        { tx: 1020, ty: 130, scale: 1.1,  animation: 'slow-fade',       duration: 14 },
  tunnel:           { tx: 1340, ty: 130, scale: 0.7,  animation: 'slow-rotate-rev', duration: 60 },
  sterne:           { tx:  220, ty: 200, scale: 0.7,  animation: 'slow-blink',      duration: 10 },
  'spirale-eng':    { tx:  300, ty: 270, scale: 0.55, animation: 'slow-rotate',     duration: 50 },
  wellen:           { tx:  720, ty: 247, scale: 1.15, animation: 'wave-shift',      duration: 22 },
  halbkreise:       { tx: 1230, ty: 280, scale: 0.85, animation: 'slow-rotate',     duration: 70 },
  'dreieck-gefuellt': { tx: 1090, ty: 350, scale: 0.85, animation: 'slow-tilt',     duration: 12 },
  spirale:          { tx:  140, ty: 380, scale: 1.0,  animation: 'slow-rotate',     duration: 45 },
  doppelhalbkreis:  { tx:  480, ty: 420, scale: 0.7,  animation: 'slow-rotate',     duration: 55 },
  l:                { tx:  640, ty: 420, scale: 0.7,  animation: 'slow-fade',       duration: 12 },
  'streifen-zebra': { tx:  790, ty: 420, scale: 0.65, animation: 'slow-pulse',      duration: 11 },
  strahlen:         { tx:  940, ty: 410, scale: 0.7,  animation: 'slow-breathe',    duration: 14 },
  ringe:            { tx: 1340, ty: 410, scale: 0.85, animation: 'slow-pulse',      duration: 12 },
}

const ANIMATION_CLASS: Record<AnimationKey, string> = {
  'wave-shift':      styles.waveShift,
  'slow-rotate':     styles.slowRotate,
  'slow-rotate-rev': styles.slowRotateRev,
  'slow-pulse':      styles.slowPulse,
  'slow-fade':       styles.slowFade,
  'slow-tilt':       styles.slowTilt,
  'slow-blink':      styles.slowBlink,
  'slow-breathe':    styles.slowBreathe,
}

const SVG_NS = 'http://www.w3.org/2000/svg'
const SVG_URL = '/banner/elemente_benannt.svg'

function getLabel(el: Element): string {
  const attr = Array.from(el.attributes).find((a) => a.name.toLowerCase().includes('label'))
  return attr ? attr.value.toLowerCase() : ''
}

function randSigned(max: number): number {
  return (Math.random() * 2 - 1) * max
}

function positionElements(svg: SVGSVGElement) {
  const labeled = Array.from(svg.querySelectorAll<SVGElement>('*')).filter((el) => getLabel(el))
  const kept: SVGElement[] = []
  const unwanted: SVGElement[] = []

  labeled.forEach((el) => {
    if (KEEP[getLabel(el)]) kept.push(el)
    else unwanted.push(el)
  })

  const keptInfo = kept.map((el) => {
    let bbox: DOMRect | null = null
    try {
      bbox = (el as SVGGraphicsElement).getBBox()
    } catch {
      bbox = null
    }
    return { el, bbox }
  })

  keptInfo.forEach(({ el, bbox }) => {
    if (!bbox || bbox.width === 0 || bbox.height === 0) return
    svg.appendChild(el)
  })

  unwanted.forEach((el) => el.remove())

  const protectedTags = new Set(['defs', 'style', 'title', 'desc', 'metadata'])
  Array.from(svg.children).forEach((child) => {
    const tag = child.nodeName.toLowerCase()
    if (protectedTags.has(tag)) return
    if (kept.includes(child as SVGElement)) return
    ;(child as HTMLElement | SVGElement).style.display = 'none'
  })

  keptInfo.forEach(({ el, bbox }) => {
    if (!bbox || bbox.width === 0 || bbox.height === 0) return
    const config = KEEP[getLabel(el)]
    if (!config) return

    const cx = bbox.x + bbox.width / 2
    const cy = bbox.y + bbox.height / 2
    const s = config.scale ?? 1

    const driftWrap = document.createElementNS(SVG_NS, 'g')
    driftWrap.classList.add(styles.driftTarget)
    const driftDuration = 200 + Math.random() * 140
    driftWrap.style.setProperty('--drift-duration', `${driftDuration}s`)
    driftWrap.style.setProperty('--drift-ax', `${randSigned(50)}px`)
    driftWrap.style.setProperty('--drift-ay', `${randSigned(20)}px`)
    driftWrap.style.setProperty('--drift-bx', `${randSigned(50)}px`)
    driftWrap.style.setProperty('--drift-by', `${randSigned(20)}px`)
    driftWrap.style.animationDelay = `${-driftDuration * Math.random()}s`

    const posWrap = document.createElementNS(SVG_NS, 'g')
    posWrap.setAttribute(
      'transform',
      `translate(${config.tx} ${config.ty}) scale(${s}) translate(${-cx} ${-cy})`
    )

    el.parentNode?.insertBefore(driftWrap, el)
    driftWrap.appendChild(posWrap)
    posWrap.appendChild(el)

    el.classList.add(styles.keep, ANIMATION_CLASS[config.animation])
    ;(el as SVGElement).style.animationDuration = `${config.duration}s`
    ;(el as SVGElement).style.animationDelay = `${-config.duration * Math.random()}s`
  })
}

export function AnimatedHeroBanner() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false
    let svg: SVGSVGElement | null = null

    const applyAspect = (svgEl: SVGSVGElement) => {
      // Portrait / narrow viewports: fit the whole scene with letterboxing of the
      // gradient, so all kept elements stay visible. Landscape: cover behaviour.
      const isPortrait =
        typeof window !== 'undefined' &&
        window.matchMedia('(max-aspect-ratio: 1/1)').matches
      svgEl.setAttribute(
        'preserveAspectRatio',
        isPortrait ? 'xMidYMid meet' : 'xMidYMid slice'
      )
    }

    let mediaQuery: MediaQueryList | null = null
    let onChange: (() => void) | null = null

    const load = async () => {
      try {
        const res = await fetch(SVG_URL)
        if (!res.ok || cancelled) return
        const text = await res.text()
        if (cancelled) return

        container.innerHTML = text
        svg = container.querySelector('svg')
        if (!svg) return

        applyAspect(svg)
        svg.style.width = '100%'
        svg.style.height = '100%'

        // Two RAFs so getBBox() returns measured values
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled || !svg) return
            positionElements(svg)
          })
        })

        mediaQuery = window.matchMedia('(max-aspect-ratio: 1/1)')
        onChange = () => {
          if (svg) applyAspect(svg)
        }
        mediaQuery.addEventListener('change', onChange)
      } catch (err) {
        // Silent fail; page still renders the gradient + grid background.
        console.error('AnimatedHeroBanner: failed to load SVG', err)
      }
    }

    load()

    return () => {
      cancelled = true
      if (mediaQuery && onChange) mediaQuery.removeEventListener('change', onChange)
      if (container) container.innerHTML = ''
    }
  }, [])

  return (
    <div className={styles.banner} aria-hidden="true">
      <div ref={containerRef} className={styles.svgContainer} />
    </div>
  )
}