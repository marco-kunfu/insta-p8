/**
 * Product identity. Single source of truth so the name lives in one place
 * instead of being retyped across the shell, metadata and marketing copy.
 */
export const BRAND = {
  name: "Kunfu DM",
  /** Shown in the document title after the name. */
  tagline: "Instagram automation for Kunfupay",
  description:
    "Turn comments, DMs and story replies into conversations that sell — with your Kunfupay products one tap away.",
} as const

/**
 * localStorage key for the theme preference. Shared by the pre-hydration
 * bootstrap in app/layout.tsx and the ThemeProvider — they must agree, and
 * keeping two literals in sync is how the default ended up disagreeing before.
 */
export const THEME_STORAGE_KEY = "kunfu-dm-theme"
