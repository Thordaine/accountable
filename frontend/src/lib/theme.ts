import { useState } from "react";

export type Theme = "light" | "dark";

/** Also read by the inline script in index.html, which applies it before the first paint. */
const KEY = "accountable-theme";

/** The saved mode: light unless dark was chosen. */
export function readTheme(): Theme {
  return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
}

/** Shows the mode on <html> and saves it. */
export function applyTheme(theme: Theme) {
  if (theme === "dark") document.documentElement.dataset.theme = "dark";
  else delete document.documentElement.dataset.theme;
  localStorage.setItem(KEY, theme);
}

/** The current mode, and a function that switches to the other one. */
export function useTheme() {
  const [theme, setTheme] = useState(readTheme);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };
  return [theme, toggle] as const;
}
