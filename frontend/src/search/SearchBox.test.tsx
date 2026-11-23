import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import { SearchBox } from "./SearchBox";
import type { SearchResults } from "./useSearch";

const results: SearchResults = {
  organizations: [{ id: 3, name: "Acme Foods" }],
  contacts: [
    { id: 7, name: "Priya Acme", organization_name: "Acme Foods" },
    { id: 8, name: "Sam Acme", organization_name: null },
  ],
  deals: [],
};
const none: SearchResults = { organizations: [], contacts: [], deals: [] };

const fetchMock = vi.fn(async (url: string) =>
  Response.json(url.includes("zzz") ? none : results),
);

/** jsdom has no ResizeObserver; Headless UI watches the box with one on close. */
class NoResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("ResizeObserver", NoResizeObserver);
});

function renderBox() {
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: (
          <>
            <SearchBox />
            <button type="button">Outside</button>
          </>
        ),
      },
    ],
    { initialEntries: ["/"] },
  );
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  const box = screen.getByRole("combobox", {
    name: "Search organizations, contacts and deals",
  });
  return { user: userEvent.setup(), router, box };
}

const path = (router: ReturnType<typeof createMemoryRouter>) =>
  router.state.location.pathname;

test("shows the groups in order with their hints, and hides empty ones", async () => {
  const { user, box } = renderBox();
  expect(box).toHaveAttribute("placeholder", "Search");
  await user.type(box, "  acme ");
  const list = await screen.findByRole("listbox");
  expect(fetchMock).toHaveBeenLastCalledWith(
    "/api/search?q=acme",
    expect.anything(),
  );
  const groups = within(list).getAllByRole("group");
  expect(groups.map((g) => g.getAttribute("aria-label"))).toEqual([
    "Organizations",
    "Contacts",
  ]);
  const options = within(list).getAllByRole("option");
  expect(options.map((o) => o.textContent)).toEqual([
    "Acme Foods",
    "Priya AcmeAcme Foods",
    "Sam Acme",
  ]);
});

test("no matches says so", async () => {
  const { user, box } = renderBox();
  await user.type(box, "zzz");
  expect(await screen.findByText('No matches for "zzz"')).toBeInTheDocument();
});

test("an empty box makes no request", async () => {
  const { user, box } = renderBox();
  await user.type(box, "   ");
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});

test("the first match is highlighted; Down then Enter opens the second", async () => {
  const { user, box, router } = renderBox();
  await user.type(box, "acme");
  const first = await screen.findByRole("option", { name: "Acme Foods" });
  expect(first).toHaveAttribute("data-focus");
  await user.keyboard("{ArrowDown}{Enter}");
  expect(path(router)).toBe("/contacts/7");
  expect(box).toHaveValue("");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});

test("a click opens a match", async () => {
  const { user, box, router } = renderBox();
  await user.type(box, "acme");
  await user.click(await screen.findByRole("option", { name: "Acme Foods" }));
  expect(path(router)).toBe("/organizations/3");
  expect(box).toHaveValue("");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});

test("Escape closes the dropdown and keeps the text; typing reopens it", async () => {
  const { user, box } = renderBox();
  await user.type(box, "acme");
  await screen.findByRole("listbox");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(box).toHaveValue("acme");
  await user.type(box, " f");
  expect(await screen.findByRole("listbox")).toBeInTheDocument();
  expect(box).toHaveValue("acme f");
});

test("a click outside closes the dropdown and keeps the text", async () => {
  const { user, box } = renderBox();
  await user.type(box, "acme");
  await screen.findByRole("listbox");
  await user.click(screen.getByRole("button", { name: "Outside" }));
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(box).toHaveValue("acme");
});

test("emptying the box closes the dropdown", async () => {
  const { user, box } = renderBox();
  await user.type(box, "acme");
  await screen.findByRole("listbox");
  await user.clear(box);
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});
