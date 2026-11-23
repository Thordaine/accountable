import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { expect, test, vi } from "vitest";
import { NavBar } from "./NavBar";

vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    user: { name: "Test User", email: "test@example.com" },
    signOut: vi.fn(),
  }),
}));

const SECTIONS = [
  "Dashboard",
  "Organizations",
  "Contacts",
  "Deals",
  "Pipeline",
];

function renderAt(path: string) {
  const router = createMemoryRouter([{ path: "*", element: <NavBar /> }], {
    initialEntries: [path],
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

test("renders the five section links", () => {
  renderAt("/");
  for (const name of SECTIONS) {
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

test("orders brand, sections, search, Add deal, then the user menu", () => {
  renderAt("/");
  const items = [
    screen.getByRole("link", { name: /Accountable/ }),
    ...SECTIONS.map((name) => screen.getByRole("link", { name })),
    screen.getByRole("combobox", {
      name: "Search organizations, contacts and deals",
    }),
    screen.getByRole("button", { name: "Add deal" }),
    screen.getByRole("button", { name: "Account menu for Test User" }),
  ];
  items.slice(1).forEach((item, i) => {
    expect(items[i].compareDocumentPosition(item)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});

test("there is no dark mode button", () => {
  renderAt("/");
  expect(screen.queryByRole("button", { name: "Dark mode" })).toBeNull();
});
