import { onMounted, ref } from 'vue'

export const THEME_STORAGE_KEY = 'curlyspare.theme'
export const LEGACY_THEME_STORAGE_KEY = 'devnarzedzia.theme'

export type ThemeChoice = 'light' | 'dark'

function readChoice(storage: Storage, key: string): ThemeChoice | null {
  const value = storage.getItem(key)
  if (value === 'light' || value === 'dark') return value
  return null
}

/** Copy a legacy theme once, then delete the old key. */
export function migrateTheme(storage: Storage = localStorage): ThemeChoice | null {
  const current = readChoice(storage, THEME_STORAGE_KEY)
  if (current) {
    storage.removeItem(LEGACY_THEME_STORAGE_KEY)
    return current
  }
  const legacy = readChoice(storage, LEGACY_THEME_STORAGE_KEY)
  storage.removeItem(LEGACY_THEME_STORAGE_KEY)
  if (!legacy) return null
  storage.setItem(THEME_STORAGE_KEY, legacy)
  return legacy
}

export function useTheme() {
  const theme = ref<ThemeChoice>('light')

  function apply(next: ThemeChoice) {
    theme.value = next
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      /* Theme still applies for this visit when storage is blocked. */
    }
  }

  function toggle() {
    apply(theme.value === 'dark' ? 'light' : 'dark')
  }

  onMounted(() => {
    let stored: ThemeChoice | null
    try {
      stored = migrateTheme()
    } catch {
      stored = null
    }
    const painted = document.documentElement.dataset.theme
    const next = stored ?? (painted === 'dark' ? 'dark' : 'light')
    theme.value = next
    document.documentElement.dataset.theme = next
  })

  return { theme, toggle }
}
