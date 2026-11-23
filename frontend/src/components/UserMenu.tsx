import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import type { KeyboardEvent } from "react";
import { useAuth } from "../auth/AuthProvider";
import { initials } from "../lib/initials";
import { type Theme, useTheme } from "../lib/theme";
import "./user-menu.css";

const THEMES: [Theme, string][] = [
  ["light", "Light"],
  ["dark", "Dark"],
  ["system", "System"],
];

const STEPS: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 };

const Check = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="m5 12 5 5 9-10" />
  </svg>
);

/** Up and Down move focus through the menu's items, wrapping at the ends. */
function moveFocus(event: KeyboardEvent<HTMLElement>) {
  const step = STEPS[event.key];
  if (!step) return;
  event.preventDefault();
  const items = [
    ...event.currentTarget.querySelectorAll<HTMLElement>('[role^="menuitem"]'),
  ];
  const at = items.indexOf(document.activeElement as HTMLElement);
  items[(at + step + items.length) % items.length].focus();
}

/**
 * The menu under your initials: who you are, the theme, and Sign out.
 * A Popover, not a Menu, because Headless UI's Menu closes on every pick
 * and picking a theme must leave it open.
 */
export function UserMenu() {
  const { user, signOut } = useAuth();
  const [theme, choose] = useTheme();
  return (
    <Popover className="user-menu">
      <PopoverButton
        className="avatar"
        aria-label={`Account menu for ${user.name}`}
        aria-haspopup="menu"
      >
        {initials(user.name)}
      </PopoverButton>
      <PopoverPanel
        focus
        role="menu"
        aria-label="Account"
        className="menu-panel"
        onKeyDown={moveFocus}
      >
        <div className="menu-who">
          <div className="menu-name">{user.name}</div>
          <div className="menu-email">{user.email}</div>
        </div>
        <div role="group" aria-label="Theme" className="menu-group">
          <div className="menu-label" aria-hidden="true">
            Theme
          </div>
          {THEMES.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={theme === value}
              className="menu-item"
              onClick={() => choose(value)}
            >
              {label}
              {theme === value && <Check />}
            </button>
          ))}
        </div>
        <button
          type="button"
          role="menuitem"
          className="menu-item"
          onClick={signOut}
        >
          Sign out
        </button>
      </PopoverPanel>
    </Popover>
  );
}
