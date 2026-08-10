"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimationWrapperProps {
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
  layout?: boolean | "size" | "position" | "preserve-aspect" | "x" | "y"
}

const directionVariants = {
  up: { y: 40, x: 0 },
  down: { y: -40, x: 0 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
  none: { x: 0, y: 0 },
}

export default function AnimationWrapper({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.6,
  once = false,
  as = "div",
  layout,
}: AnimationWrapperProps) {
  const MotionTag = motion[as]

  return (
    <MotionTag
      layout={layout}
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
