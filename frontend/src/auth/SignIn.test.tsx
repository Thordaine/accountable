import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { renderApp } from "../test/renderApp";
import { type Session, WrongCredentials } from "./session";
import { SignIn } from "./SignIn";

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderSignIn(signIn: Session["signIn"], local = true) {
  const session = { local, signIn } as Session;
  render(<SignIn session={session} />);
  return userEvent.setup();
}

async function signInAs(
  user: ReturnType<typeof userEvent.setup>,
  password = "test",
) {
  await user.type(screen.getByLabelText("Email"), "test@example.com");
  await user.type(screen.getByLabelText("Password"), `${password}{Enter}`);
}

test("shows the fields, the heading and who to ask, with the local-run line", () => {
  renderSignIn(vi.fn());
  expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toBeInTheDocument();
  expect(screen.getByLabelText("Password")).toBeInTheDocument();
  expect(
    screen.getByText("Ask whoever runs Accountable to add you."),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "Local run: sign in as test@example.com with the password test.",
    ),
  ).toBeInTheDocument();
});

test("the local-run line is only there in local mode", () => {
  renderSignIn(vi.fn(), false);
  expect(screen.queryByText(/Local run/)).not.toBeInTheDocument();
});

test("while signing in, the button is disabled and says so", async () => {
  const user = renderSignIn(() => new Promise(() => {}));
  await signInAs(user);
  expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
});

test("wrong credentials show a message and empty the password", async () => {
  const user = renderSignIn(async () => {
    throw new WrongCredentials();
  });
  await signInAs(user, "nope");
  expect(await screen.findByText("Wrong email or password.")).toBeVisible();
  expect(screen.getByLabelText("Password")).toHaveValue("");
  expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
});

test("any other failure asks to try again", async () => {
  const user = renderSignIn(async () => {
    throw new TypeError("Failed to fetch");
  });
  await signInAs(user);
  expect(await screen.findByText("Couldn't sign in. Try again.")).toBeVisible();
  expect(screen.getByLabelText("Password")).toHaveValue("test");
});

test("signed out at a deal's address, signing in shows that deal", async () => {
  const { user } = renderApp("/deals/1", { signedIn: false });
  expect(
    await screen.findByRole("heading", { name: "Sign in" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  await signInAs(user);
  expect(
    await screen.findByRole("heading", { name: "Oven monitoring" }),
  ).toBeInTheDocument();
});

test("on System, the sign-in screen switches when the device does", () => {
  const device = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal("matchMedia", () => device);
  localStorage.setItem("accountable-theme", "system");
  renderSignIn(vi.fn());
  act(() => {
    device.matches = true;
    device.dispatchEvent(new Event("change"));
  });
  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
});
