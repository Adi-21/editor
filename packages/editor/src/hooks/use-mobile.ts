import * as React from 'react'

const MOBILE_BREAKPOINT = 768

const subscribe = (callback: () => void): (() => void) => {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

const getClientSnapshot = (): boolean => window.innerWidth < MOBILE_BREAKPOINT

// Server can't know the viewport — assume desktop. React's useSyncExternalStore
// reconciles the SSR / client snapshots without a hydration mismatch warning.
const getServerSnapshot = (): boolean => false

export function useIsMobile(): boolean {
  return React.useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
}

// ── Form-factor tier (additive — `useIsMobile` is unchanged) ──────────────
// phone < 768 ≤ tablet < 1280 ≤ desktop. Lets the editor adapt its layout
// per device (iPad portrait 768–1024 lands in `tablet` instead of
// inheriting the dense desktop layout).
export type FormFactor = 'phone' | 'tablet' | 'desktop'

const TABLET_MIN = MOBILE_BREAKPOINT // 768
const DESKTOP_MIN = 1280

const subscribeFormFactor = (callback: () => void): (() => void) => {
  const phone = window.matchMedia(`(max-width: ${TABLET_MIN - 1}px)`)
  const desktop = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`)
  phone.addEventListener('change', callback)
  desktop.addEventListener('change', callback)
  return () => {
    phone.removeEventListener('change', callback)
    desktop.removeEventListener('change', callback)
  }
}

const getFormFactorSnapshot = (): FormFactor => {
  const w = window.innerWidth
  if (w < TABLET_MIN) return 'phone'
  if (w < DESKTOP_MIN) return 'tablet'
  return 'desktop'
}

// SSR can't know the viewport — assume desktop, consistent with useIsMobile.
const getFormFactorServerSnapshot = (): FormFactor => 'desktop'

export function useFormFactor(): FormFactor {
  return React.useSyncExternalStore(
    subscribeFormFactor,
    getFormFactorSnapshot,
    getFormFactorServerSnapshot,
  )
}
