import { Variants } from 'framer-motion'

// ── Page-level fade in ──
export const pageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, when: 'beforeChildren', staggerChildren: 0.07 }
  }
}

// ── Stagger container (for grids / lists) ──
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
}

// ── Faster stagger (for dense lists) ──
export const staggerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.05 }
  }
}

// ── Individual card / row: fade up ──
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }
  }
}

// ── Fade in from top ──
export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }
  }
}

// ── Scale in (for stat cards, badges) ──
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }
  }
}

// ── Elastic scale (bouncy pop-in for numbers, icons) ──
export const elasticScale: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', damping: 12, stiffness: 200 }
  }
}

// ── Bounce in (attention-grabbing entrance) ──
export const bounceIn: Variants = {
  hidden: { opacity: 0, scale: 0.3, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 10, stiffness: 260 }
  }
}

// ── Slide in from left (banners, toasts) ──
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: 'easeOut' }
  }
}

// ── Slide in from right ──
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: 'easeOut' }
  }
}

// ── Slide down (headers, toolbars) ──
export const slideDown: Variants = {
  hidden: { opacity: 0, y: -15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
}

// ── Hover / tap micro-interactions ──
export const hoverScale = {
  whileHover: { scale: 1.03, transition: { duration: 0.15 } },
  whileTap: { scale: 0.97 }
}

export const hoverLift = {
  whileHover: { y: -3, boxShadow: '0 8px 25px rgba(0,0,0,0.12)', transition: { duration: 0.2 } },
  whileTap: { y: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
}

// ── Sidebar nav item animation ──
export const sidebarItem: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: 'easeOut' }
  }
}

// ── Sidebar nav hover ──
export const navItemHover = {
  whileHover: { x: 4, transition: { duration: 0.15 } },
  whileTap: { scale: 0.98 }
}

// ── Table row stagger (subtle) ──
export const tableRowVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: 'easeOut' }
  }
}

// ── Counter / stat pop (for numeric values) ──
export const counterPop: Variants = {
  hidden: { opacity: 0, scale: 0.5, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 15, stiffness: 300, delay: 0.1 }
  }
}

// ── List items (for flight cards, social cards etc.) ──
export const listItem: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  }
}

// ── Float up (gentle entrance for secondary content) ──
export const floatUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
}

// ── Modal overlay + content ──
export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
}

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 20, stiffness: 300 }
  },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } }
}

// ── Form entrance (Login / Register) ──
export const formEntrance: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }
  }
}

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', damping: 20, stiffness: 300 }
  }
}

// ── Glow pulse (for live indicators) ──
export const glowPulse: Variants = {
  hidden: { opacity: 0.5, scale: 0.95 },
  visible: {
    opacity: [0.5, 1, 0.5],
    scale: [0.95, 1.05, 0.95],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
  }
}
