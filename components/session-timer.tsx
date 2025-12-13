"use client"

import { useState, useEffect } from "react"

interface SessionTimerProps {
  duration: number // in seconds
}

export function SessionTimer({ duration }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => (prev < duration ? prev + 1 : duration))
    }, 1000)

    return () => clearInterval(timer)
  }, [duration])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  return (
    <div className="text-center">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Current Session Duration</p>
      <p className="text-4xl lg:text-5xl font-bold text-primary font-mono">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </p>
    </div>
  )
}

