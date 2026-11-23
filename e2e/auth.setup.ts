import { SIGNED_IN } from "../playwright.config";
import { expect, test as setup } from "./fixtures";

setup("signs in as Test User", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("test");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  await page.context().storageState({ path: SIGNED_IN });
});
