import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { type Col, DataTable } from "./DataTable";

type Org = { id: number; name: string; industry: string };

const rows: Org[] = [
  { id: 1, name: "Café Linde", industry: "Hospitality" },
  { id: 2, name: "Halden Freight", industry: "Logistics" },
  { id: 3, name: "Ashby Engineering", industry: "Engineering" },
];

const columns: Col<Org>[] = [
  { id: "name", header: "Name", text: (o) => o.name },
  { id: "industry", header: "Industry", text: (o) => o.industry },
];

function setup() {
  render(<DataTable columns={columns} rows={rows} defaultSort="industry" noun="organizations" />);
  return userEvent.setup();
}

const names = () =>
  screen.getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("cell")[0].textContent);

test("search matches shown text, ignoring case and accents typed in capitals", async () => {
  const user = setup();
  expect(screen.getByText("3 of 3 organizations")).toBeInTheDocument();
  await user.type(screen.getByRole("searchbox"), "CAFÉ");
  expect(names()).toEqual(["Café Linde"]);
  expect(screen.getByText("1 of 3 organizations")).toBeInTheDocument();
});

test("odd search text is plain text and shows the empty state", async () => {
  const user = setup();
  await user.type(screen.getByRole("searchbox"), "(");
  expect(screen.getByText(/No organizations match/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Clear search" }));
  expect(names()).toHaveLength(3);
});

test("clicking a heading sorts ascending, then descending", async () => {
  const user = setup();
  expect(names()).toEqual(["Ashby Engineering", "Café Linde", "Halden Freight"]);
  await user.click(screen.getByRole("button", { name: /Name/ }));
  expect(names()).toEqual(["Ashby Engineering", "Café Linde", "Halden Freight"]);
  await user.click(screen.getByRole("button", { name: /Name/ }));
  expect(names()).toEqual(["Halden Freight", "Café Linde", "Ashby Engineering"]);
});

test("a long table renders only rows near the screen, but searches and counts all of them", async () => {
  const many = Array.from({ length: 300 }, (_, i) => ({ id: i + 1, name: `Row ${String(i).padStart(4, "0")}`, industry: "Retail" }));
  render(<DataTable columns={columns} rows={many} defaultSort="name" noun="organizations" />);
  expect(screen.getByText("300 of 300 organizations")).toBeInTheDocument();
  expect(names().length).toBeLessThan(300);
  await userEvent.setup().type(screen.getByRole("searchbox"), "Row 0299");
  expect(names()).toEqual(["Row 0299"]);
});
