import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

test.use({ storageState: { cookies: [], origins: [] }, extraHTTPHeaders: {} });

async function signIn(page: Page, password = "test") {
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

const signInHeading = (page: Page) => page.getByRole("heading", { name: "Sign in" });

test("signed out, every address shows the sign-in screen and the API refuses", async ({ page }) => {
  for (const path of ["/", "/organizations", "/contacts", "/deals", "/pipeline", "/deals/1"]) {
    await page.goto(path);
    await expect(signInHeading(page)).toBeVisible();
    await expect(page.getByRole("navigation")).toHaveCount(0);
  }
  expect((await page.request.get("/api/organizations")).status()).toBe(401);
});

test("a wrong password says so", async ({ page }) => {
  await page.goto("/");
  await signIn(page, "wrong");
  await expect(page.getByText("Wrong email or password.")).toBeVisible();
  await expect(page.getByLabel("Password")).toHaveValue("");
});

test("signing in opens the page at that address, and a reload stays signed in", async ({ page }) => {
  await page.goto("/pipeline");
  await signIn(page);
  await expect(page.getByRole("link", { name: "Pipeline" })).toHaveAttribute("aria-current", "page");
  await page.reload();
  await expect(page.getByRole("link", { name: "Pipeline" })).toHaveAttribute("aria-current", "page");
  await expect(signInHeading(page)).toHaveCount(0);
});

test("sign out in the menu shows the sign-in screen, and a reload stays signed out", async ({ page }) => {
  await page.goto("/");
  await signIn(page);
  await page.getByRole("button", { name: "Account menu for Test User" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(signInHeading(page)).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await page.reload();
  await expect(signInHeading(page)).toBeVisible();
});

test("when the session ends, the next request shows the sign-in screen, then the same page", async ({ page }) => {
  await page.goto("/organizations");
  await signIn(page);
  await expect(page.getByRole("link", { name: "Organizations" })).toHaveAttribute("aria-current", "page");
  await page.evaluate(() => localStorage.removeItem("accountable.token"));
  await page.getByRole("link", { name: "Contacts" }).click();
  await expect(signInHeading(page)).toBeVisible();
  await signIn(page);
  await expect(page).toHaveURL("/contacts");
  await expect(page.getByRole("link", { name: "Contacts" })).toHaveAttribute("aria-current", "page");
});
