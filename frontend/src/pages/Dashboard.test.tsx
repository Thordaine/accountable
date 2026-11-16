import { screen, waitFor, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { changes } from "../test/fakeApi";
import { renderApp } from "../test/renderApp";

const panel = (name: string) => screen.getByRole("region", { name });

test("shows revenue won and deals won and lost over the year", async () => {
  renderApp("/");
  expect(await screen.findByTestId("revenue-total")).toHaveTextContent(
    "US$78,000",
  );
  expect(panel("Revenue won")).toHaveTextContent(
    "Per month, January 2026 to December 2026",
  );
  expect(panel("Deals won and lost")).toHaveTextContent("24 / 12");
});

test("the funnel shows the value that reached each stage", async () => {
  renderApp("/");
  const funnel = await screen.findByRole("region", { name: "Sales funnel" });
  expect(funnel).toHaveTextContent("US$40k");
  expect(funnel).toHaveTextContent("Won");
});

test("ticking a follow-up marks it done", async () => {
  const { user, requests } = renderApp("/");
  await user.click(
    await screen.findByRole("checkbox", { name: "Done: Send the quote" }),
  );
  await waitFor(() =>
    expect(changes(requests)).toEqual([
      { method: "PATCH", path: "/activities/1", body: { done: true } },
    ]),
  );
  expect(
    screen.getByRole("checkbox", { name: /Send the quote/ }),
  ).toBeChecked();
  expect(
    within(panel("Follow-ups")).getByRole("link", { name: "Priya Raman" }),
  ).toHaveAttribute("href", "/contacts/1");
});

test("recent activity names the type and links the record", async () => {
  renderApp("/");
  const recent = await screen.findByRole("region", { name: "Recent activity" });
  expect(recent).toHaveTextContent("Call: Talked pricing");
  expect(recent).toHaveTextContent("Moved from New to Proposal");
  expect(recent).toHaveTextContent("Yesterday");
  expect(
    within(recent).getByRole("link", { name: "Oven monitoring" }),
  ).toHaveAttribute("href", "/deals/1");
});
