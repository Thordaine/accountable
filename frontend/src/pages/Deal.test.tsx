import { screen, waitFor, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { changes } from "../test/fakeApi";
import { renderApp } from "../test/renderApp";

test("shows the deal's figures, links and lateness", async () => {
  renderApp("/deals/1");
  expect(
    await screen.findByRole("heading", { name: "Oven monitoring" }),
  ).toBeInTheDocument();
  expect(screen.getByText("This deal is past its close date.")).toBeVisible();
  expect(screen.getByText("US$6,000")).toBeVisible();
  expect(screen.getByRole("link", { name: "Acme Foods" })).toHaveAttribute(
    "href",
    "/organizations/1",
  );
  expect(screen.getByRole("link", { name: "Priya Raman" })).toHaveAttribute(
    "href",
    "/contacts/1",
  );
});

test("picking a stage moves the deal to the top of that stage", async () => {
  const { user, requests } = renderApp("/deals/1");
  await screen.findByRole("heading", { name: "Oven monitoring" });
  await user.selectOptions(screen.getByLabelText("Stage"), "Won");
  await waitFor(() =>
    expect(changes(requests)).toEqual([
      {
        method: "POST",
        path: "/deals/1/move",
        body: { stage: "Won", index: 0 },
      },
    ]),
  );
  expect(await screen.findByText("Moved to Won")).toBeVisible();
});

test("logging a note adds it to the deal", async () => {
  const { user, requests } = renderApp("/deals/1");
  await screen.findByRole("heading", { name: "Oven monitoring" });
  await user.type(screen.getByLabelText(/Description/), "Sent the quote");
  await user.click(screen.getByRole("button", { name: "Log activity" }));
  await waitFor(() =>
    expect(changes(requests)[0]).toMatchObject({
      method: "POST",
      path: "/activities",
      body: { deal_id: 1, contact_id: null, description: "Sent the quote" },
    }),
  );
});

test("deleting goes back to the deals", async () => {
  const { user, router } = renderApp("/deals/1");
  await user.click(await screen.findByRole("button", { name: "Delete" }));
  await screen.findByText("Its 0 activities will be deleted.");
  await user.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }),
  );
  await waitFor(() => expect(router.state.location.pathname).toBe("/deals"));
});

test("an unknown deal shows Deal not found", async () => {
  renderApp("/deals/404");
  expect(
    await screen.findByRole("heading", { name: "Deal not found" }),
  ).toBeInTheDocument();
});

test("says who added it and when, and nothing about changes until it's changed", async () => {
  renderApp("/deals/1");
  expect(
    await screen.findByText("Added by Sam Lee on 5 Jan 2026"),
  ).toBeVisible();
  expect(screen.queryByText(/Last changed/)).toBeNull();
});
