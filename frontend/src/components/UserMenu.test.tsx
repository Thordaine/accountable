import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { UserMenu } from "./UserMenu";

const signOut = vi.hoisted(() => vi.fn());
vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    user: { name: "Ingo Prause", email: "ingo@example.com" },
    signOut,
  }),
}));

const button = () =>
  screen.getByRole("button", { name: "Account menu for Ingo Prause" });
const menu = () => screen.queryByRole("menu");
const choice = (name: string) => screen.getByRole("menuitemradio", { name });

function setup() {
  render(
    <>
      <p>Outside</p>
      <UserMenu />
    </>,
  );
  return userEvent.setup();
}

test("the button shows the initials and names the account", () => {
  setup();
  expect(button()).toHaveTextContent("IP");
});

test("the menu shows who, the three themes with the current one checked, then Sign out", async () => {
  const user = setup();
  await user.click(button());
  expect(menu()).toHaveTextContent("Ingo Prause");
  expect(menu()).toHaveTextContent("ingo@example.com");
  expect(menu()).toHaveTextContent("Theme");
  const items = [...menu()!.querySelectorAll('[role^="menuitem"]')];
  expect(items.map((i) => i.textContent)).toEqual([
    "Light",
    "Dark",
    "System",
    "Sign out",
  ]);
  expect(choice("Light")).toHaveAttribute("aria-checked", "true");
  expect(choice("Dark")).toHaveAttribute("aria-checked", "false");
});

test("picking Dark applies it and leaves the menu open", async () => {
  const user = setup();
  await user.click(button());
  await user.click(choice("Dark"));
  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  expect(menu()).toBeInTheDocument();
  expect(choice("Dark")).toHaveAttribute("aria-checked", "true");
  expect(choice("Light")).toHaveAttribute("aria-checked", "false");
});

test("Enter on a theme picks it and leaves the menu open", async () => {
  const user = setup();
  button().focus();
  await user.keyboard("{Enter}");
  await user.keyboard("{ArrowDown}{Enter}");
  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  expect(menu()).toBeInTheDocument();
});

test("Sign out signs out", async () => {
  const user = setup();
  await user.click(button());
  await user.click(screen.getByRole("menuitem", { name: "Sign out" }));
  expect(signOut).toHaveBeenCalledOnce();
});

test("Up and Down move through the choices, wrapping at the ends", async () => {
  const user = setup();
  button().focus();
  await user.keyboard("{Enter}");
  expect(choice("Light")).toHaveFocus();
  await user.keyboard("{ArrowDown}{ArrowDown}");
  expect(choice("System")).toHaveFocus();
  await user.keyboard("{ArrowDown}");
  expect(screen.getByRole("menuitem", { name: "Sign out" })).toHaveFocus();
  await user.keyboard("{ArrowDown}");
  expect(choice("Light")).toHaveFocus();
  await user.keyboard("{ArrowUp}");
  expect(screen.getByRole("menuitem", { name: "Sign out" })).toHaveFocus();
});

test("Escape closes the menu and returns to the button", async () => {
  const user = setup();
  await user.click(button());
  await user.keyboard("{Escape}");
  expect(menu()).not.toBeInTheDocument();
  expect(button()).toHaveFocus();
});

test("a click outside closes the menu", async () => {
  const user = setup();
  await user.click(button());
  await user.click(screen.getByText("Outside"));
  expect(menu()).not.toBeInTheDocument();
});
