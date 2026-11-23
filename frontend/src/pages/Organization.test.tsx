import { screen, waitFor, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { changes } from "../test/fakeApi";
import { renderApp } from "../test/renderApp";

test("shows the organization's details, contacts and deals", async () => {
  renderApp("/organizations/1");
  expect(
    await screen.findByRole("heading", { name: "Acme Foods" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "acme.example" })).toHaveAttribute(
    "href",
    "https://acme.example",
  );
  expect(screen.getByText("Budget cycle starts in October.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Priya Raman" })).toHaveAttribute(
    "href",
    "/contacts/1",
  );
  expect(screen.getByRole("link", { name: "Oven monitoring" })).toHaveAttribute(
    "href",
    "/deals/1",
  );
});

test("a contact added here belongs to the organization", async () => {
  const { user, requests } = renderApp("/organizations/1");
  await user.click(await screen.findByRole("button", { name: "Add contact" }));
  await user.type(screen.getByLabelText(/Name/), "Lee Chen");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(changes(requests)[0]).toMatchObject({
      method: "POST",
      path: "/contacts",
      body: { name: "Lee Chen", organization_id: 1 },
    }),
  );
});

test("a deal added here belongs to the organization", async () => {
  const { user, requests } = renderApp("/organizations/1");
  const deals = (await screen.findByRole("heading", { name: "Deals" })).closest(
    "section",
  )!;
  await user.click(within(deals).getByRole("button", { name: "Add deal" }));
  await user.type(screen.getByLabelText(/Name/), "Chiller upgrade");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(changes(requests)[0]).toMatchObject({
      method: "POST",
      path: "/deals",
      body: { name: "Chiller upgrade", organization_id: 1, stage: "New" },
    }),
  );
});

test("editing saves the changed details", async () => {
  const { user, requests } = renderApp("/organizations/1");
  await user.click(await screen.findByRole("button", { name: "Edit" }));
  const industry = screen.getByLabelText(/Industry/);
  await user.clear(industry);
  await user.type(industry, "Frozen food");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(changes(requests)[0]).toMatchObject({
      method: "PUT",
      path: "/organizations/1",
      body: { name: "Acme Foods", industry: "Frozen food" },
    }),
  );
});

test("deleting goes back to the organizations", async () => {
  const { user, router } = renderApp("/organizations/1");
  await user.click(await screen.findByRole("button", { name: "Delete" }));
  expect(
    await screen.findByText(
      "Its 1 contact and 1 deal will be kept, with no organization.",
    ),
  ).toBeInTheDocument();
  await user.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }),
  );
  await waitFor(() =>
    expect(router.state.location.pathname).toBe("/organizations"),
  );
});

test("an unknown organization shows Organization not found", async () => {
  renderApp("/organizations/404");
  expect(
    await screen.findByRole("heading", { name: "Organization not found" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Back to Organizations" }),
  ).toHaveAttribute("href", "/organizations");
});

test("says who added it and when, and nothing about changes until it's changed", async () => {
  renderApp("/organizations/1");
  expect(
    await screen.findByText("Added by Sam Lee on 5 Jan 2026"),
  ).toBeVisible();
  expect(screen.queryByText(/Last changed/)).toBeNull();
});
