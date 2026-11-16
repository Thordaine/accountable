import { screen, waitFor, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { changes } from "../test/fakeApi";
import { renderApp } from "../test/renderApp";

const column = (stage: string) => screen.getByRole("region", { name: stage });

test("shows each deal as a card in its stage's column", async () => {
  renderApp("/pipeline");
  await screen.findByRole("button", { name: "Oven monitoring" });
  expect(screen.getByTestId("open-value")).toHaveTextContent("US$16,000");
  expect(
    within(column("Proposal")).getByRole("button", { name: "Oven monitoring" }),
  ).toBeVisible();
  expect(
    within(column("New")).getByRole("button", { name: "Freezer pilot" }),
  ).toBeVisible();
  expect(within(column("Won")).queryAllByRole("listitem")).toHaveLength(0);
});

test("clicking a card opens the deal", async () => {
  const { user, router } = renderApp("/pipeline");
  await user.click(
    await screen.findByRole("button", { name: "Oven monitoring" }),
  );
  expect(router.state.location.pathname).toBe("/deals/1");
});

test("Enter on a focused card opens the deal", async () => {
  const { user, router } = renderApp("/pipeline");
  (await screen.findByRole("button", { name: "Freezer pilot" })).focus();
  await user.keyboard("{Enter}");
  await waitFor(() => expect(router.state.location.pathname).toBe("/deals/2"));
});

test("a deal added in a column starts in that stage", async () => {
  const { user, requests } = renderApp("/pipeline");
  await user.click(
    await screen.findByRole("button", { name: "Add deal to Negotiation" }),
  );
  expect(screen.getByLabelText(/Probability/)).toHaveValue(75);
  await user.type(screen.getByLabelText(/Name/), "Cold room");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(changes(requests)[0]).toMatchObject({
      method: "POST",
      path: "/deals",
      body: { name: "Cold room", stage: "Negotiation", probability: 75 },
    }),
  );
});
