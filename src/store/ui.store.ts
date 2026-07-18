import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface UIState {
  theme: Theme
  sidebarCollapsed: boolean
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarCollapsed: false,
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
    }),
    {
      name: 'solecare-ui',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      },
    }
  )
)

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  const isDark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.classList.toggle('dark', isDark)
}
