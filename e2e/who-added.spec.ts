import { format, parseISO } from "date-fns";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const shown = (isoDay: string) => format(parseISO(isoDay), "d MMM yyyy");
const todayIn = (timeZone: string) => new Date().toLocaleDateString("en-CA", { timeZone });

/** Add a deal from the Deals table and open its page. */
async function addDeal(page: Page, name: string) {
  await page.goto("/deals");
  await page.getByRole("button", { name: "Add deal" }).last().click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Deal saved")).toBeVisible();
  await page.getByRole("searchbox").fill(name);
  await page.getByRole("link", { name }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
}

test("a new organization says who added it, and who changed it once edited", async ({ page }) => {
  const today = format(new Date(), "d MMM yyyy");
  await page.goto("/organizations");
  await page.getByRole("button", { name: "Add organization" }).click();
  await page.getByLabel("Name").fill("Quayside Ropeworks");
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("link", { name: "Quayside Ropeworks" }).click();
  const stamps = page.locator(".stamps");
  await expect(stamps).toHaveText(`Added by Test User on ${today}`);

  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Industry").fill("Marine supplies");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(stamps).toContainText(`Last changed by Test User on ${today}`);
});

test("a logged activity is by its author, and sample data is by Sample data", async ({ page }) => {
  await page.goto("/deals");
  await page.getByRole("searchbox").fill("Juniper till refresh");
  await page.getByRole("link", { name: "Juniper till refresh" }).click();
  await expect(page.locator(".stamps")).toContainText("Added by Sample data on");

  const log = page.getByRole("form", { name: "Log an activity" });
  await log.getByLabel("Description").fill("Checked the till count");
  await log.getByRole("button", { name: "Log activity" }).click();
  const entry = page.locator(".timeline li").filter({ hasText: "Checked the till count" });
  await expect(entry).toContainText("by Test User");
});

test.describe("with the browser in Pacific/Kiritimati", () => {
  test.use({ timezoneId: "Pacific/Kiritimati" });

  test("an activity's time and a win's close date follow the browser's zone", async ({ page }) => {
    const today = todayIn("Pacific/Kiritimati");
    await addDeal(page, "Kiritimati dive shop");

    const log = page.getByRole("form", { name: "Log an activity" });
    await log.getByLabel("Description").fill("Morning call");
    await log.getByLabel("Happened at").fill(`${today}T09:15`);
    await log.getByRole("button", { name: "Log activity" }).click();
    await expect(page.getByText("Activity logged")).toBeVisible();
    await page.reload();
    const entry = page.locator(".timeline li").filter({ hasText: "Morning call" });
    await expect(entry).toContainText(`${shown(today)}, 09:15`);

    await page.getByLabel("Stage").selectOption("Won");
    await expect(page.locator(".timeline")).toContainText("Moved from New to Won");
    const closeDate = page.locator(".details div").filter({ hasText: "Close date" });
    await expect(closeDate.locator("dd")).toHaveText(shown(today));
  });
});
