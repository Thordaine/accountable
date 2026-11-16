import { screen, waitFor, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { changes } from "../test/fakeApi";
import { renderApp } from "../test/renderApp";

test("lists deals, marking the late ones", async () => {
  renderApp("/deals");
  const late = await screen.findByRole("row", { name: /Oven monitoring/ });
  expect(within(late).getByText("Late")).toBeVisible();
  expect(late).toHaveTextContent("US$12,000");
  expect(late).toHaveTextContent("50%");
  const onTime = screen.getByRole("row", { name: /Freezer pilot/ });
  expect(within(onTime).queryByText("Late")).not.toBeInTheDocument();
});

test("deleting a deal says its activities go too", async () => {
  const { user, requests } = renderApp("/deals");
  await screen.findByText("Oven monitoring");
  await user.click(
    screen.getByRole("button", { name: "Delete Oven monitoring" }),
  );
  expect(
    await screen.findByText("Its 0 activities will be deleted."),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Delete" }));
  await waitFor(() =>
    expect(changes(requests)).toEqual([
      { method: "DELETE", path: "/deals/1", body: undefined },
    ]),
  );
});

test("editing a deal keeps its stage and probability", async () => {
  const { user, requests } = renderApp("/deals");
  await screen.findByText("Oven monitoring");
  await user.click(
    screen.getByRole("button", { name: "Edit Oven monitoring" }),
  );
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(changes(requests)[0]).toMatchObject({
      method: "PUT",
      path: "/deals/1",
      body: { stage: "Proposal", probability: 50, value: 12000 },
    }),
  );
});
