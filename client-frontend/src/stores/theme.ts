// stores/themeStore.ts
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const applyTheme = (theme: Theme) => {
  const root = window.document.documentElement;
  if (theme === "light") root.classList.remove("dark");
  if (theme === "dark") root.classList.add("dark");
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    prefersDark ? root.classList.add("dark") : root.classList.remove("dark");
  }
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "system",

      setTheme: (theme: Theme) => {
        set({ theme });
        applyTheme(theme)
      },
    }),
    {
      name: "theme-storage", // localStorage key
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyTheme(state.theme);
      },
    }
  )
);

