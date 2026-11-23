import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { applyTheme, readTheme, useTheme } from "./theme";

const html = document.documentElement;
const stored = () => localStorage.getItem("accountable-theme");

/** A device whose dark setting the test can flip, as the browser would. */
function stubDevice(dark: boolean) {
  const media = Object.assign(new EventTarget(), { matches: dark });
  vi.stubGlobal("matchMedia", () => media);
  return (next: boolean) => {
    media.matches = next;
    media.dispatchEvent(new Event("change"));
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("with nothing stored, the theme is light", () => {
  expect(readTheme()).toBe("light");
  expect(html).not.toHaveAttribute("data-theme");
});

test("dark sets it on <html> and stores it", () => {
  applyTheme("dark");
  expect(html).toHaveAttribute("data-theme", "dark");
  expect(stored()).toBe("dark");
  expect(readTheme()).toBe("dark");
});

test("light removes the attribute and stores light", () => {
  applyTheme("dark");
  applyTheme("light");
  expect(html).not.toHaveAttribute("data-theme");
  expect(stored()).toBe("light");
  expect(readTheme()).toBe("light");
});

test("system follows the device and is stored", () => {
  stubDevice(true);
  applyTheme("system");
  expect(html).toHaveAttribute("data-theme", "dark");
  expect(stored()).toBe("system");
  expect(readTheme()).toBe("system");
});

test("useTheme starts from the stored theme and choosing one applies it", () => {
  localStorage.setItem("accountable-theme", "dark");
  const { result } = renderHook(() => useTheme());
  expect(result.current[0]).toBe("dark");
  act(() => result.current[1]("light"));
  expect(result.current[0]).toBe("light");
  expect(html).not.toHaveAttribute("data-theme");
  expect(stored()).toBe("light");
});

test("on system, the page switches when the device does, with no reload", () => {
  const setDark = stubDevice(false);
  const { result } = renderHook(() => useTheme());
  act(() => result.current[1]("system"));
  expect(html).not.toHaveAttribute("data-theme");
  act(() => setDark(true));
  expect(html).toHaveAttribute("data-theme", "dark");
  act(() => setDark(false));
  expect(html).not.toHaveAttribute("data-theme");
});

test("on light, a device change does nothing", () => {
  const setDark = stubDevice(false);
  const { result } = renderHook(() => useTheme());
  act(() => result.current[1]("system"));
  act(() => result.current[1]("light"));
  act(() => setDark(true));
  expect(html).not.toHaveAttribute("data-theme");
});
