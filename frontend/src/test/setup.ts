import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/** jsdom has no matchMedia: a light device, unless a test stubs its own. */
window.matchMedia = (media: string) =>
  Object.assign(new EventTarget(), { media, matches: false }) as MediaQueryList;

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});
