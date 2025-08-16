// src/utils/theme.js
import { ref } from 'vue'
const THEME_KEY = 'prefers-dark'
export const isDark = ref(false)

export function initTheme() {
    const saved = localStorage.getItem(THEME_KEY)
    isDark.value = saved ? saved === '1'
        : window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme()
}

export function toggleTheme(val) {
    isDark.value = typeof val === 'boolean' ? val : !isDark.value
    applyTheme()
}

export function applyTheme() {
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem(THEME_KEY, isDark.value ? '1' : '0')
}
