import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { subDays } from "date-fns";
import { createMemoryRouter, RouterProvider } from "react-router";
import { expect, test } from "vitest";
import type { Activity } from "../api/types";
import { isoDate } from "../lib/format";
import { Timeline } from "./Timeline";

function entry(
  id: number,
  type: Activity["type"],
  description: string,
  happened_at: string,
  extra = {},
): Activity {
  return {
    id,
    type,
    description,
    happened_at,
    contact_id: 1,
    deal_id: null,
    follow_up_date: null,
    done: false,
    contact_name: "Ann",
    deal_name: null,
    created_at: happened_at,
    updated_at: happened_at,
    ...extra,
  };
}

const entries = [
  entry(1, "note", "Prefers email", "2026-11-01T09:00:00"),
  entry(
    2,
    "auto",
    "Moved from Proposal to Negotiation",
    "2026-11-03T10:00:00",
    { contact_id: null, deal_id: 5, deal_name: "Calder Foods renewal" },
  ),
  entry(3, "call", "Discussed renewal terms", "2026-11-02T11:00:00", {
    follow_up_date: isoDate(subDays(new Date(), 1)),
  }),
];

function setup() {
  const router = createMemoryRouter([
    { path: "*", element: <Timeline entries={entries} showDealName /> },
  ]);
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

const items = () => screen.getAllByRole("listitem");

test("entries show newest first with their type icons", () => {
  setup();
  expect(
    items().map((li) => within(li).getByRole("img").getAttribute("aria-label")),
  ).toEqual(["Automatic entry", "Call", "Note"]);
});

test("automatic entries can't be edited or deleted", () => {
  setup();
  expect(
    within(items()[0]).queryByRole("button", { name: /Edit|Delete/ }),
  ).toBeNull();
  expect(
    within(items()[1]).getByRole("button", { name: /Edit/ }),
  ).toBeInTheDocument();
});

test("an overdue follow-up shows in Raspberry with an unchecked box", () => {
  setup();
  const call = items()[1];
  expect(within(call).getByRole("checkbox")).not.toBeChecked();
  expect(within(call).getByText(/1 day overdue/)).toHaveClass("late");
});

test("a deal's entry on a contact's timeline names the deal", () => {
  setup();
  expect(within(items()[0]).getByText(/On deal:/)).toHaveTextContent(
    "On deal: Calder Foods renewal",
  );
});
