import { useEffect, useRef } from 'react'
import gsap from 'gsap'

// Lightweight GSAP sparkle burst used to accent AI surfaces (chat, swarm, model).
export function AiSparkle({ count = 14 }: { count?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const dots = Array.from(root.querySelectorAll<HTMLElement>('.sparkle-dot'))
    const ctx = gsap.context(() => {
      dots.forEach((dot, i) => {
        gsap.set(dot, { x: 0, y: 0, opacity: 0, scale: 0 })
        gsap.to(dot, {
          keyframes: [
            { opacity: 1, scale: gsap.utils.random(0.6, 1.2), duration: 0.35 },
            {
              x: gsap.utils.random(-26, 26),
              y: gsap.utils.random(-22, 22),
              opacity: 0,
              scale: 0,
              duration: gsap.utils.random(1.1, 1.9),
            },
          ],
          repeat: -1,
          delay: (i / count) * 1.6,
          ease: 'power2.out',
        })
      })
    }, root)
    return () => ctx.revert()
  }, [count])

  return (
    <div className="ai-sparkle" ref={ref} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="sparkle-dot" />
      ))}
    </div>
  )
}
