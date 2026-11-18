import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const LIGHT_PAGE = "rgb(240, 244, 245)";
const DARK_PAGE = "rgb(4, 35, 46)";
const BLACK = "rgb(0, 0, 0)";

const toggle = (page: Page) => page.getByRole("button", { name: "Dark mode" });
const revenueLine = (page: Page) =>
  page.getByRole("region", { name: "Revenue won" }).locator(".recharts-area-curve");

async function goDark(page: Page) {
  await page.goto("/");
  await toggle(page).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
}

test("a first visit is light", async ({ page }) => {
  await page.goto("/");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("body")).toHaveCSS("background-color", LIGHT_PAGE);
});

test("the toggle switches the page, panels, charts and badges without a reload", async ({ page }) => {
  await page.goto("/");
  await expect(revenueLine(page)).toHaveCSS("stroke", "rgb(4, 122, 91)");
  await page.evaluate(() => ((window as unknown as { stayed: boolean }).stayed = true));

  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("body")).toHaveCSS("background-color", DARK_PAGE);
  await expect(page.locator(".panel.hero")).toHaveCSS("background-color", BLACK);
  await expect(revenueLine(page)).toHaveCSS("stroke", "rgb(62, 228, 182)");

  await page.getByRole("link", { name: "Deals", exact: true }).click();
  const won = page.locator(".badge", { hasText: /^Won$/ }).first();
  await expect(won).toHaveCSS("background-color", "rgb(205, 216, 219)");
  await expect(won).toHaveCSS("color", "rgb(7, 59, 76)");
  expect(await page.evaluate(() => (window as unknown as { stayed?: boolean }).stayed)).toBe(true);
});

test("dark mode is kept after a reload, on every section", async ({ page }) => {
  await goDark(page);
  await page.reload();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("body")).toHaveCSS("background-color", DARK_PAGE);
  await page.goto("/pipeline");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".column").first()).toHaveCSS("background-color", BLACK);
});

test("the mode is set before the app's script runs", async ({ page }) => {
  await goDark(page);
  await page.route("**/src/main.tsx", (route) =>
    route.fulfill({ body: "", contentType: "text/javascript" }),
  );
  await page.reload();
  await expect(page.locator("#root")).toBeEmpty();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("dialogs and toasts use the dark panel color", async ({ page }) => {
  const contact = await (await page.request.post("/api/contacts", { data: { name: "Ines Moreau" } })).json();
  await goDark(page);

  await page.getByRole("button", { name: "Add deal" }).click();
  await expect(page.locator(".dialog-panel")).toHaveCSS("background-color", BLACK);
  await page.keyboard.press("Escape");

  await page.goto(`/contacts/${contact.id}`);
  const log = page.getByRole("form", { name: "Log an activity" });
  await log.getByLabel("Description").fill("Called about the renewal");
  await log.getByRole("button", { name: "Log activity" }).click();
  const toast = page.locator("[data-sonner-toast]", { hasText: "Activity logged" });
  await expect(toast).toHaveCSS("background-color", BLACK);
});

test("another browser starts light", async ({ page, browser, baseURL }) => {
  await goDark(page);
  const other = await browser.newContext({ baseURL });
  const fresh = await other.newPage();
  await fresh.goto("/");
  await expect(toggle(fresh)).toHaveAttribute("aria-pressed", "false");
  await expect(fresh.locator("body")).toHaveCSS("background-color", LIGHT_PAGE);
  await other.close();
});

test("switching back to light is kept after a reload", async ({ page }) => {
  await goDark(page);
  await toggle(page).click();
  await page.reload();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("body")).toHaveCSS("background-color", LIGHT_PAGE);
});
