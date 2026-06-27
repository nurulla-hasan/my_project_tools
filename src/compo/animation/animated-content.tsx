"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedContentProps {
  children: ReactNode
  className?: string
  /** @default "up" */
  direction?: "up" | "down" | "left" | "right" | "none"
  /** @default 0 */
  delay?: number
  /** @default 0.6 */
  duration?: number
  /** @default 40 */
  distance?: number
  /** @default false */
  once?: boolean
  as?: "div" | "section" | "span"
}

export default function AnimatedContent({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.6,
  distance = 40,
  once = false,
  as = "div",
}: AnimatedContentProps) {
  const MotionTag = motion[as]

  const directionVariants = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  }

  return (
    <MotionTag
      className={cn(className)}
      initial={{ opacity: 0, ...directionVariants[direction], scale: direction === "none" ? 0.95 : 1 }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        transition: {
          duration,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      }}
      viewport={{ once, margin: "-80px" }}
    >
      {children}
    </MotionTag>
  )
}
