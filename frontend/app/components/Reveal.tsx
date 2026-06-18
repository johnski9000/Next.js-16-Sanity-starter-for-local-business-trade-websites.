'use client'

/**
 * Shared scroll-reveal primitives — the ONE animation system every section uses,
 * so the whole page flows consistently instead of each block inventing its own
 * entrance. Built on framer-motion `whileInView` (fires once as the element
 * scrolls in). The root layout wraps everything in <MotionConfig reducedMotion=
 * "user">, so for visitors who prefer reduced motion framer drops the transform
 * and only cross-fades.
 *
 *   <Reveal>…</Reveal>                         one element fades+rises in
 *   <RevealGroup><RevealItem>…</RevealItem>…</RevealGroup>   staggered children
 *
 * Both take an optional `as` (default 'div') and pass `className` through, so they
 * drop into existing markup (grids, <ul>, <section>) without extra wrappers.
 */
import {motion, type Variants} from 'framer-motion'
import type {ElementType, ReactNode} from 'react'

const EASE = [0.25, 0.1, 0.25, 1] as const

export const fadeUp: Variants = {
  hidden: {opacity: 0, y: 24},
  show: {opacity: 1, y: 0, transition: {duration: 0.6, ease: EASE}},
}

const stagger: Variants = {
  hidden: {},
  show: {transition: {staggerChildren: 0.08, delayChildren: 0.04}},
}

const VIEWPORT = {once: true, amount: 0.2} as const
const GROUP_VIEWPORT = {once: true, amount: 0.15} as const

type RevealProps = {
  children: ReactNode
  className?: string
  /** Render as a different element (e.g. 'section', 'ul', 'li', 'span'). */
  as?: ElementType
  /** Extra delay (s) before this element animates. */
  delay?: number
}

export function Reveal({children, className, as = 'div', delay = 0}: RevealProps) {
  const Tag = motion[as as 'div']
  return (
    <Tag
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      transition={delay ? {duration: 0.6, ease: EASE, delay} : undefined}
    >
      {children}
    </Tag>
  )
}

/** Parent for staggered children — pair with <RevealItem>. */
export function RevealGroup({children, className, as = 'div'}: RevealProps) {
  const Tag = motion[as as 'div']
  return (
    <Tag
      className={className}
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={GROUP_VIEWPORT}
    >
      {children}
    </Tag>
  )
}

/** Child of <RevealGroup> — inherits the parent's in-view trigger + staggers. */
export function RevealItem({children, className, as = 'div'}: RevealProps) {
  const Tag = motion[as as 'div']
  return (
    <Tag className={className} variants={fadeUp}>
      {children}
    </Tag>
  )
}
