import { screen, waitFor, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { changes } from "../test/fakeApi";
import { renderApp } from "../test/renderApp";

test("shows the contact's details, deals and timeline", async () => {
  renderApp("/contacts/1");
  expect(
    await screen.findByRole("heading", { name: "Priya Raman" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "priya@acme.example" }),
  ).toHaveAttribute("href", "mailto:priya@acme.example");
  expect(screen.getByText("+1 201 555 1234")).toBeVisible();
  expect(screen.getByRole("link", { name: "Oven monitoring" })).toBeVisible();
  expect(screen.getByText("Talked pricing")).toBeVisible();
});

test("editing changes the contact's status", async () => {
  const { user, requests } = renderApp("/contacts/1");
  await user.click(await screen.findByRole("button", { name: "Edit" }));
  await user.selectOptions(screen.getByLabelText(/Status/), "Qualified");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(changes(requests)[0]).toMatchObject({
      method: "PUT",
      path: "/contacts/1",
      body: { name: "Priya Raman", status: "Qualified", organization_id: 1 },
    }),
  );
});

test("deleting goes back to the contacts", async () => {
  const { user, router } = renderApp("/contacts/1");
  await user.click(await screen.findByRole("button", { name: "Delete" }));
  await screen.findByText(/Their 1 deal will be kept/);
  await user.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }),
  );
  await waitFor(() => expect(router.state.location.pathname).toBe("/contacts"));
});

test("an unknown contact shows Contact not found", async () => {
  renderApp("/contacts/404");
  expect(
    await screen.findByRole("heading", { name: "Contact not found" }),
  ).toBeInTheDocument();
});
