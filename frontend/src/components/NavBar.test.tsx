import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { expect, test } from "vitest";
import { NavBar } from "./NavBar";

function renderAt(path: string) {
  const router = createMemoryRouter([{ path: "*", element: <NavBar /> }], {
    initialEntries: [path],
  });
  render(<RouterProvider router={router} />);
}

test("renders the five section links", () => {
  renderAt("/");
  for (const name of [
    "Dashboard",
    "Organizations",
    "Contacts",
    "Deals",
    "Pipeline",
  ]) {
    expect(screen.getByRole("link", { name })).toBeInTheDocument();
  }
});

test("marks the current section", () => {
  renderAt("/contacts/3");
  expect(screen.getByRole("link", { name: "Contacts" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
    "aria-current",
  );
});

test("the dark mode toggle comes after Add deal", () => {
  renderAt("/");
  const add = screen.getByRole("button", { name: "Add deal" });
  const toggle = screen.getByRole("button", { name: "Dark mode" });
  expect(add.compareDocumentPosition(toggle)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
});
