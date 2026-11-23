import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

/** Also read by the inline script in index.html, which applies it before the first paint. */
const KEY = "accountable-theme";
const DEVICE_DARK = "(prefers-color-scheme: dark)";

/** The saved theme: light unless dark or system was chosen. */
export function readTheme(): Theme {
  const saved = localStorage.getItem(KEY);
  return saved === "dark" || saved === "system" ? saved : "light";
}

/** Shows the theme on <html>: dark for Dark, and for System on a dark device. */
function show(theme: Theme) {
  const dark =
    theme === "dark" || (theme === "system" && matchMedia(DEVICE_DARK).matches);
  if (dark) document.documentElement.dataset.theme = "dark";
  else delete document.documentElement.dataset.theme;
}

/** Shows the theme and saves it. */
export function applyTheme(theme: Theme) {
  show(theme);
  localStorage.setItem(KEY, theme);
}

/** The current theme and a function that picks another; System follows the device live. */
export function useTheme() {
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => {
    if (theme !== "system") return;
    const device = matchMedia(DEVICE_DARK);
    const follow = () => show("system");
    device.addEventListener("change", follow);
    return () => device.removeEventListener("change", follow);
  }, [theme]);
  const choose = (next: Theme) => {
    applyTheme(next);
    setTheme(next);
  };
  return [theme, choose] as const;
}
