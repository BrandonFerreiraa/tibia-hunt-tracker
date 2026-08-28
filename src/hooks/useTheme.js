import { useEffect, useState } from 'react'

const THEME_KEY = 'theme'

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_KEY) || 'dark')

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function setTheme(next) {
    setThemeState(next)
    localStorage.setItem(THEME_KEY, next)
  }

  return { theme, setTheme }
}
