import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const LIGHT_PAGE = "rgb(240, 244, 245)";
const DARK_PAGE = "rgb(4, 35, 46)";
const BLACK = "rgb(0, 0, 0)";
const MIDNIGHT = "rgb(7, 59, 76)";
const MIST = "rgb(205, 216, 219)";
const WHITE = "rgb(255, 255, 255)";

const avatar = (page: Page) => page.getByRole("button", { name: "Account menu for Test User" });
const choice = (page: Page, name: string) => page.getByRole("menuitemradio", { name });
const revenueLine = (page: Page) =>
  page.getByRole("region", { name: "Revenue won" }).locator(".recharts-area-curve");

/** Opens the user menu and picks a theme; the menu stays open. */
async function pick(page: Page, name: string) {
  if (!(await page.getByRole("menu").isVisible())) await avatar(page).click();
  await choice(page, name).click();
}

/** The theme checked in the menu, which is then closed again. */
async function checked(page: Page, name: string) {
  await avatar(page).click();
  await expect(choice(page, name)).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Escape");
}

async function goDark(page: Page) {
  await page.goto("/");
  await pick(page, "Dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.keyboard.press("Escape");
}

test("a first visit is light", async ({ page }) => {
  await page.goto("/");
  await checked(page, "Light");
  await expect(page.locator("body")).toHaveCSS("background-color", LIGHT_PAGE);
});

test("the initials button is Midnight in light mode and Sea Mist in dark", async ({ page }) => {
  await page.goto("/");
  await expect(avatar(page)).toHaveText("TU");
  await expect(avatar(page)).toHaveCSS("background-color", MIDNIGHT);
  await expect(avatar(page)).toHaveCSS("color", WHITE);
  await pick(page, "Dark");
  await expect(avatar(page)).toHaveCSS("background-color", MIST);
  await expect(avatar(page)).toHaveCSS("color", MIDNIGHT);
});

test("picking Dark switches the page, panels, charts and badges without a reload", async ({ page }) => {
  await page.goto("/");
  await expect(revenueLine(page)).toHaveCSS("stroke", "rgb(4, 122, 91)");
  await page.evaluate(() => ((window as unknown as { stayed: boolean }).stayed = true));

  await pick(page, "Dark");
  await expect(page.getByRole("menu")).toBeVisible();
  await expect(choice(page, "Dark")).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("body")).toHaveCSS("background-color", DARK_PAGE);
  await expect(page.locator(".panel.hero")).toHaveCSS("background-color", BLACK);
  await expect(revenueLine(page)).toHaveCSS("stroke", "rgb(62, 228, 182)");

  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Deals", exact: true }).click();
  const won = page.locator(".badge", { hasText: /^Won$/ }).first();
  await expect(won).toHaveCSS("background-color", MIST);
  await expect(won).toHaveCSS("color", MIDNIGHT);
  expect(await page.evaluate(() => (window as unknown as { stayed?: boolean }).stayed)).toBe(true);
});

test("dark mode is kept after a reload, on every section", async ({ page }) => {
  await goDark(page);
  await page.reload();
  await checked(page, "Dark");
  await expect(page.locator("body")).toHaveCSS("background-color", DARK_PAGE);
  await page.goto("/pipeline");
  await checked(page, "Dark");
  await expect(page.locator(".column").first()).toHaveCSS("background-color", BLACK);
});

test("the theme is set before the app's script runs", async ({ page }) => {
  await goDark(page);
  await page.route("**/src/main.tsx", (route) =>
    route.fulfill({ body: "", contentType: "text/javascript" }),
  );
  await page.reload();
  await expect(page.locator("#root")).toBeEmpty();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("System follows the device, and switches when it does, with no reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await pick(page, "System");
  await expect(page.locator("body")).toHaveCSS("background-color", DARK_PAGE);
  await page.keyboard.press("Escape");

  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("body")).toHaveCSS("background-color", LIGHT_PAGE);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("body")).toHaveCSS("background-color", DARK_PAGE);
  await checked(page, "System");
});

test("System on a dark device is set before the app's script runs", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await pick(page, "System");
  await page.route("**/src/main.tsx", (route) =>
    route.fulfill({ body: "", contentType: "text/javascript" }),
  );
  await page.reload();
  await expect(page.locator("#root")).toBeEmpty();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("dialogs, toasts and the menu use the dark colors", async ({ page }) => {
  const contact = await (await page.request.post("/api/contacts", { data: { name: "Ines Moreau" } })).json();
  await goDark(page);

  await avatar(page).click();
  await expect(page.getByRole("menu")).toHaveCSS("background-color", "rgb(11, 47, 59)");
  await page.keyboard.press("Escape");

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
  await checked(fresh, "Light");
  await expect(fresh.locator("body")).toHaveCSS("background-color", LIGHT_PAGE);
  await other.close();
});

test("switching back to light is kept after a reload", async ({ page }) => {
  await goDark(page);
  await pick(page, "Light");
  await page.reload();
  await checked(page, "Light");
  await expect(page.locator("body")).toHaveCSS("background-color", LIGHT_PAGE);
});

test("the theme is kept after signing out", async ({ page }) => {
  await goDark(page);
  await avatar(page).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("background-color", DARK_PAGE);
});
