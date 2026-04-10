import { useState } from '#app'

export type ThemeMode = 'dark' | 'light'

export const useTheme = () => {
  const theme = useState<ThemeMode>('crm-theme', () => {
    if (import.meta.client) {
      const saved = localStorage.getItem('crm-theme')
      if (saved === 'light' || saved === 'dark') return saved
    }
    return 'dark' // Default to dark to match current dashboard
  })

  const isDark = computed(() => theme.value === 'dark')

  const setTheme = (mode: ThemeMode) => {
    theme.value = mode
    if (import.meta.client) {
      localStorage.setItem('crm-theme', mode)
      applyTheme(mode)
    }
  }

  const toggleTheme = () => {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  const applyTheme = (mode: ThemeMode) => {
    if (!import.meta.client) return
    const html = document.documentElement
    if (mode === 'dark') {
      html.classList.add('dark-mode', 'dark')
      html.classList.remove('light-mode', 'light')
    } else {
      html.classList.add('light-mode', 'light')
      html.classList.remove('dark-mode', 'dark')
    }
  }

  // Apply on client init
  if (import.meta.client) {
    applyTheme(theme.value)
  }

  return { theme, isDark, setTheme, toggleTheme }
}
