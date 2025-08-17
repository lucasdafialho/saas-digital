"use client"

import { useEffect } from "react"

export function ScrollAnimate() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-animate]"))

    const onEnter = (el: HTMLElement) => {
      el.classList.add("animate-in", "fade-in-50", "slide-in-from-bottom-2", "duration-700", "ease-out")
      el.classList.remove("opacity-0", "translate-y-4")
    }

    elements.forEach((el) => {
      el.classList.add("opacity-0", "translate-y-4")
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onEnter(entry.target as HTMLElement)
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    )

    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return null
}


