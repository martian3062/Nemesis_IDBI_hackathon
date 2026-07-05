import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

export function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value)
  const previous = useRef(value)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value)
      previous.current = value
      return
    }
    const controls = animate(previous.current, value, {
      type: 'spring',
      stiffness: 90,
      damping: 20,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    })
    previous.current = value
    return () => controls.stop()
  }, [value, reduceMotion])

  return <>{display}</>
}
