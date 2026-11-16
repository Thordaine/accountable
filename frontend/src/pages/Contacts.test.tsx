import { screen, waitFor, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { changes } from "../test/fakeApi";
import { renderApp } from "../test/renderApp";

const rowOf = (name: string) =>
  screen.getByRole("row", { name: new RegExp(name) });

test("lists contacts with their organization and status", async () => {
  renderApp("/contacts");
  const row = await screen.findByRole("row", { name: /Priya Raman/ });
  expect(within(row).getByRole("link", { name: "Acme Foods" })).toHaveAttribute(
    "href",
    "/organizations/1",
  );
  expect(row).toHaveTextContent("Lead");
});

test("the status filter shows only contacts with that status", async () => {
  const { user } = renderApp("/contacts");
  await screen.findByText("Priya Raman");
  await user.click(screen.getByRole("button", { name: "Customer" }));
  expect(screen.queryByText("Priya Raman")).not.toBeInTheDocument();
  expect(rowOf("Sam Okafor")).toBeInTheDocument();
});

test("adding a contact saves it as a Lead", async () => {
  const { user, requests } = renderApp("/contacts");
  await screen.findByText("Priya Raman");
  await user.click(screen.getByRole("button", { name: "Add contact" }));
  await user.type(screen.getByLabelText(/Name/), "Lee Chen");
  await user.type(screen.getByLabelText(/Email/), "lee@example.com");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(changes(requests)).toEqual([
      {
        method: "POST",
        path: "/contacts",
        body: expect.objectContaining({
          name: "Lee Chen",
          email: "lee@example.com",
          phone: null,
          status: "Lead",
        }),
      },
    ]),
  );
});

test("editing a contact starts from its details", async () => {
  const { user } = renderApp("/contacts");
  await screen.findByText("Priya Raman");
  await user.click(screen.getByRole("button", { name: "Edit Priya Raman" }));
  expect(screen.getByLabelText(/Email/)).toHaveValue("priya@acme.example");
  expect(screen.getByLabelText(/Job title/)).toHaveValue("Buyer");
});

test("deleting a contact says what happens to its records", async () => {
  const { user, requests } = renderApp("/contacts");
  await screen.findByText("Priya Raman");
  await user.click(screen.getByRole("button", { name: "Delete Priya Raman" }));
  expect(
    await screen.findByText(
      "Their 1 deal will be kept, with no main contact. Their 1 activity will be deleted.",
    ),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Delete" }));
  await waitFor(() =>
    expect(changes(requests)).toEqual([
      { method: "DELETE", path: "/contacts/1", body: undefined },
    ]),
  );
});
