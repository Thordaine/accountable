import type { Page } from "@playwright/test";
import { drag, expect, test } from "./fixtures";

const column = (page: Page, stage: string) => page.getByRole("region", { name: stage, exact: true });
const cards = (page: Page, stage: string) => column(page, stage).locator("li.card-slot");
const count = async (page: Page, stage: string) => Number(await column(page, stage).getByTestId("count").textContent());

test("dragging to another column updates figures at once and saves the place", async ({ page }) => {
  await page.goto("/pipeline");
  await expect(cards(page, "New").first()).toBeVisible();
  const [newCount, qualifiedCount] = [await count(page, "New"), await count(page, "Qualified")];
  const expected = await page.getByTestId("open-expected").textContent();
  const card = cards(page, "New").first();
  const name = (await card.getAttribute("aria-label"))!;

  await page.route("**/api/deals/*/move", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await route.continue();
  });
  const saved = page.waitForResponse("**/api/deals/*/move");
  await drag(page, card, cards(page, "Qualified").nth(1));

  await expect(column(page, "Qualified").getByTestId("count")).toHaveText(String(qualifiedCount + 1), { timeout: 1000 });
  await expect(column(page, "New").getByTestId("count")).toHaveText(String(newCount - 1), { timeout: 1000 });
  await expect(page.getByTestId("open-expected")).not.toHaveText(expected!, { timeout: 1000 });
  await saved;

  await page.reload();
  await expect(cards(page, "Qualified").nth(1)).toHaveAttribute("aria-label", name);
  await page.goto("/deals");
  await page.getByRole("searchbox").fill(name);
  const row = page.getByRole("row").filter({ hasText: name });
  await expect(row).toContainText("Qualified");
  await expect(row).toContainText("25%");
});

test("dragging within a column keeps the new place", async ({ page }) => {
  await page.goto("/pipeline");
  const third = cards(page, "Proposal").nth(2);
  const name = (await third.getAttribute("aria-label"))!;
  const saved = page.waitForResponse("**/api/deals/*/move");
  await drag(page, third, cards(page, "Proposal").first());
  await expect(cards(page, "Proposal").first()).toHaveAttribute("aria-label", name);
  await saved;
  await page.reload();
  await expect(cards(page, "Proposal").first()).toHaveAttribute("aria-label", name);
});

test("a deal added in a column starts at the top of that stage", async ({ page }) => {
  await page.goto("/pipeline");
  await page.getByRole("button", { name: "Add deal to Proposal" }).click();
  await expect(page.getByLabel("Stage")).toHaveValue("Proposal");
  await page.getByLabel("Name").fill("Board-added deal");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(cards(page, "Proposal").first()).toHaveAttribute("aria-label", "Board-added deal");
});

test("late cards show Late, and a click opens the deal", async ({ page }) => {
  await page.goto("/pipeline");
  const late = page.locator("li.card-slot").filter({ has: page.locator(".card.is-late") }).first();
  await expect(late).toContainText("Late");
  const name = (await late.getAttribute("aria-label"))!;
  await late.click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
});

test("a long column shows its first 40 cards and the rest on request", async ({ page }) => {
  for (let i = 0; i < 35; i++) {
    await page.request.post("/api/deals", { data: { name: `Old lost deal ${i}`, stage: "Lost", close_date: "2026-01-15" } });
  }
  await page.goto("/pipeline");
  const total = await count(page, "Lost");
  await expect(cards(page, "Lost")).toHaveCount(40);
  await column(page, "Lost").getByRole("button", { name: `Show ${total - 40} more` }).click();
  await expect(cards(page, "Lost")).toHaveCount(total);
});
