import { onMounted, ref } from 'vue'
import { brand } from '../brand'

type Theme = 'light' | 'dark'
const storageKey = `${brand.storagePrefix}.theme`

export function useTheme() {
  const theme = ref<Theme>('light')

  function apply(next: Theme) {
    theme.value = next
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(storageKey, next)
    } catch {
      /* Theme still applies for this visit when storage is blocked. */
    }
  }

  function toggle() {
    apply(theme.value === 'dark' ? 'light' : 'dark')
  }

  onMounted(() => {
    const current = document.documentElement.dataset.theme
    theme.value = current === 'dark' ? 'dark' : 'light'
  })

  return { theme, toggle }
}
