import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { ThemeToggle } from "./ThemeToggle";

const html = document.documentElement;
const button = () => screen.getByRole("button", { name: "Dark mode" });

test("starts not pressed in light mode", () => {
  render(<ThemeToggle />);
  expect(button()).toHaveAttribute("aria-pressed", "false");
  expect(html).not.toHaveAttribute("data-theme");
});

test("a click turns dark mode on, a second click turns it off", async () => {
  render(<ThemeToggle />);
  await userEvent.click(button());
  expect(button()).toHaveAttribute("aria-pressed", "true");
  expect(html).toHaveAttribute("data-theme", "dark");
  expect(localStorage.getItem("accountable-theme")).toBe("dark");
  await userEvent.click(button());
  expect(button()).toHaveAttribute("aria-pressed", "false");
  expect(html).not.toHaveAttribute("data-theme");
  expect(localStorage.getItem("accountable-theme")).toBe("light");
});

test("starts pressed when dark is stored", () => {
  localStorage.setItem("accountable-theme", "dark");
  render(<ThemeToggle />);
  expect(button()).toHaveAttribute("aria-pressed", "true");
});
