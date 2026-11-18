import { act, renderHook } from "@testing-library/react";
import { expect, test } from "vitest";
import { applyTheme, readTheme, useTheme } from "./theme";

const html = document.documentElement;
const stored = () => localStorage.getItem("accountable-theme");

test("with nothing stored, the mode is light", () => {
  expect(readTheme()).toBe("light");
  expect(html).not.toHaveAttribute("data-theme");
});

test("applying dark sets it on <html> and stores it", () => {
  applyTheme("dark");
  expect(html).toHaveAttribute("data-theme", "dark");
  expect(stored()).toBe("dark");
  expect(readTheme()).toBe("dark");
});

test("applying light removes the attribute and stores light", () => {
  applyTheme("dark");
  applyTheme("light");
  expect(html).not.toHaveAttribute("data-theme");
  expect(stored()).toBe("light");
});

test("useTheme starts from the stored mode and toggle flips it", () => {
  localStorage.setItem("accountable-theme", "dark");
  const { result } = renderHook(() => useTheme());
  expect(result.current[0]).toBe("dark");
  act(() => result.current[1]());
  expect(result.current[0]).toBe("light");
  expect(stored()).toBe("light");
  act(() => result.current[1]());
  expect(result.current[0]).toBe("dark");
  expect(html).toHaveAttribute("data-theme", "dark");
});
