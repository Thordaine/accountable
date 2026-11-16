import { screen, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";
import { changes } from "../test/fakeApi";
import { renderApp } from "../test/renderApp";

test("lists organizations with their contacts and open deal value", async () => {
  renderApp("/organizations");
  const row = await screen.findByRole("row", { name: /Acme Foods/ });
  expect(row).toHaveTextContent("Food");
  expect(row).toHaveTextContent("US$12,000");
});

test("adding an organization saves blank fields as empty", async () => {
  const { user, requests } = renderApp("/organizations");
  await screen.findByText("Acme Foods");
  await user.click(screen.getByRole("button", { name: "Add organization" }));
  await user.type(screen.getByLabelText(/Name/), "Birch Dairy");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(changes(requests)).toEqual([
      {
        method: "POST",
        path: "/organizations",
        body: {
          name: "Birch Dairy",
          website: null,
          industry: null,
          notes: null,
        },
      },
    ]),
  );
});
