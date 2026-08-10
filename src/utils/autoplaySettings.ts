export type AutoplayPreference = 'auto' | 'always' | 'never';

const AUTOPLAY_STORAGE_KEY = 'tvtrac_autoplay_setting';

/**
 * Gets the current user preference for trailer autoplay.
 * Defaults to 'auto' if not explicitly set.
 */
export function getAutoplayPreference(): AutoplayPreference {
  if (typeof window === 'undefined') return 'auto';
  const stored = localStorage.getItem(AUTOPLAY_STORAGE_KEY);
  if (stored === 'always' || stored === 'never' || stored === 'auto') {
    return stored;
  }
  return 'auto';
}

/**
 * Saves the user preference for trailer autoplay.
 */
export function setAutoplayPreference(preference: AutoplayPreference): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTOPLAY_STORAGE_KEY, preference);
}

/**
 * Determines whether a trailer should automatically play on the current device & network.
 */
export function shouldAutoplayTrailer(): boolean {
  if (typeof window === 'undefined') return false;

  const pref = getAutoplayPreference();

  if (pref === 'never') return false;
  if (pref === 'always') return true;

  // 'auto' mode logic:
  // 1. Check if browser Data Saver mode is enabled
  const nav = navigator as any;
  if (nav.connection && nav.connection.saveData) {
    return false;
  }

  // 2. Check if device is a mobile device or screen is narrow (< 768px)
  const isSmallScreen = window.innerWidth < 768;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isSmallScreen || isTouchDevice) {
    return false;
  }

  return true;
}
