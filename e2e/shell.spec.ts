import { expect, test } from "./fixtures";

test("lands on the dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
});

test("navigates to the pipeline", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Pipeline" }).click();
  await expect(page).toHaveURL("/pipeline");
  await expect(page.getByRole("link", { name: "Pipeline" })).toHaveAttribute("aria-current", "page");
});

test("reloading a section stays there", async ({ page }) => {
  await page.goto("/contacts");
  await page.reload();
  await expect(page.getByRole("link", { name: "Contacts" })).toHaveAttribute("aria-current", "page");
});
