import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const searchBox = (page: Page) =>
  page.getByRole("combobox", { name: "Search organizations, contacts and deals" });

test("part of an organization's name in another case finds it; Enter opens it", async ({ page }) => {
  await page.goto("/");
  await searchBox(page).fill("OSPREY MAT");
  const group = page.getByRole("group", { name: "Organizations" });
  await expect(group.getByRole("option", { name: "Osprey Materials" })).toBeVisible();
  await searchBox(page).press("Enter");
  await expect(page).toHaveURL(/\/organizations\/\d+$/);
  await expect(page.getByRole("heading", { name: "Osprey Materials" })).toBeVisible();
});

test("a click opens a contact or a deal, then empties the box and closes the list", async ({ page }) => {
  const cases = [
    ["nataRAJAN", "Contacts", "Priya Natarajan", "Calder Foods", "contacts"],
    ["TILL ref", "Deals", "Juniper till refresh", "Juniper Retail", "deals"],
  ];
  await page.goto("/");
  for (const [text, group, name, hint, kind] of cases) {
    await searchBox(page).fill(text);
    const option = page.getByRole("group", { name: group }).getByRole("option", { name });
    await expect(option).toContainText(hint);
    await option.click();
    await expect(page).toHaveURL(new RegExp(`/${kind}/\\d+$`));
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(searchBox(page)).toHaveValue("");
    await expect(page.getByRole("listbox")).toBeHidden();
  }
});

test("a query with no matches says so", async ({ page }) => {
  await page.goto("/");
  await searchBox(page).fill("qqzzxx");
  await expect(page.getByText('No matches for "qqzzxx"')).toBeVisible();
});
