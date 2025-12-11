"use client"

import { useEffect, useRef, useState } from "react"

// Fade In Component
export function FadeIn({ 
  children, 
  delay = 0, 
  direction = "up",
  duration = 1000 
}: { 
  children: React.ReactNode
  delay?: number
  direction?: "up" | "down" | "left" | "right"
  duration?: number
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setIsVisible(true), delay)
          }
        })
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [delay])

  const directionClasses = {
    up: "translate-y-8",
    down: "-translate-y-8",
    left: "translate-x-8",
    right: "-translate-x-8",
  }

  return (
    <div
      ref={ref}
      className={`transition-all ease-out ${
        isVisible 
          ? "opacity-100 translate-y-0 translate-x-0" 
          : `opacity-0 ${directionClasses[direction]}`
      }`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

// Scale In Component
export function ScaleIn({ 
  children, 
  delay = 0,
  duration = 600
}: { 
  children: React.ReactNode
  delay?: number
  duration?: number
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setIsVisible(true), delay)
          }
        })
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={`transition-all ease-out ${
        isVisible 
          ? "opacity-100 scale-100" 
          : "opacity-0 scale-95"
      }`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

// Slide In Component
export function SlideIn({ 
  children, 
  delay = 0,
  direction = "left",
  duration = 800
}: { 
  children: React.ReactNode
  delay?: number
  direction?: "left" | "right" | "up" | "down"
  duration?: number
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setIsVisible(true), delay)
          }
        })
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [delay])

  const directionClasses = {
    left: "-translate-x-full",
    right: "translate-x-full",
    up: "-translate-y-full",
    down: "translate-y-full",
  }

  return (
    <div
      ref={ref}
      className={`transition-all ease-out ${
        isVisible 
          ? "opacity-100 translate-x-0 translate-y-0" 
          : `opacity-0 ${directionClasses[direction]}`
      }`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

// Animated Counter Component
export function AnimatedCounter({ 
  end, 
  duration = 2000, 
  suffix = "",
  className = ""
}: { 
  end: number
  duration?: number
  suffix?: string
  className?: string
}) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
            let start = 0
            const increment = end / (duration / 16)
            const timer = setInterval(() => {
              start += increment
              if (start >= end) {
                setCount(end)
                clearInterval(timer)
              } else {
                setCount(Math.floor(start))
              }
            }, 16)
          }
        })
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [end, duration, hasAnimated])

  const displayValue = suffix === "K+" ? `${count}K+` : `${count}${suffix}`

  return (
    <div ref={ref} className={className}>
      {displayValue}
    </div>
  )
}

// Stagger Children Component
export function StaggerChildren({ 
  children, 
  staggerDelay = 100,
  className = ""
}: { 
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}) {
  return (
    <div className={className}>
      {Array.isArray(children) 
        ? children.map((child, index) => (
            <FadeIn key={index} delay={index * staggerDelay} direction="up">
              {child}
            </FadeIn>
          ))
        : children
      }
    </div>
  )
}

