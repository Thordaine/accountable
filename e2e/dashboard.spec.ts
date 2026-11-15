import { addDays, format } from "date-fns";
import { expect, test } from "./fixtures";

const OPEN = ["New", "Qualified", "Proposal", "Negotiation"];
const dollars = (text: string | null) => Number(text!.replace(/[^0-9]/g, ""));

test("the open total matches the deals, and the charts and band render", async ({ page }) => {
  const deals: { stage: string; value: number }[] = await (await page.request.get("/api/deals")).json();
  const open = deals.filter((d) => OPEN.includes(d.stage)).reduce((sum, d) => sum + d.value, 0);
  await page.goto("/");
  await expect(page.locator(".big")).toHaveText(`US$${open.toLocaleString("en-US")}`);
  await expect(page.getByRole("region", { name: "Revenue won" }).locator(".recharts-area-curve")).toBeVisible();
  await expect(page.getByRole("region", { name: "Deals won and lost" }).locator(".recharts-bar-rectangle").first()).toBeVisible();
  await expect(page.locator(".river .seg")).toHaveCount(4);
  await page.locator(".river .seg").first().click();
  await expect(page).toHaveURL("/pipeline");
});

test("a new follow-up shows on the dashboard until it's done", async ({ page }) => {
  const contact = await (await page.request.post("/api/contacts", { data: { name: "Hugo Brandt" } })).json();
  await page.goto(`/contacts/${contact.id}`);
  const log = page.getByRole("form", { name: "Log an activity" });
  await log.getByLabel("Description").fill("Send the renewal quote");
  await log.getByLabel("Follow-up date").fill(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  await log.getByRole("button", { name: "Log activity" }).click();
  await expect(page.getByText("Activity logged")).toBeVisible();

  await page.getByRole("link", { name: "Dashboard" }).click();
  const followUps = page.getByRole("region", { name: "Follow-ups" });
  const item = followUps.getByRole("listitem").filter({ hasText: "Send the renewal quote" });
  await expect(item).toContainText("Hugo Brandt");
  await item.getByRole("checkbox").check();
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(followUps).toBeVisible();
  await expect(followUps.getByText("Send the renewal quote")).toHaveCount(0);
});

test("winning a deal raises revenue won and shows first in recent activity", async ({ page }) => {
  const deal = await (await page.request.post("/api/deals", {
    data: { name: "Harbour signage", stage: "Negotiation", value: 4321 },
  })).json();
  await page.goto("/");
  const before = dollars(await page.getByTestId("revenue-total").textContent());

  await page.goto(`/deals/${deal.id}`);
  await page.getByLabel("Stage").selectOption("Won");
  await expect(page.locator(".timeline li").first()).toContainText("Moved from Negotiation to Won");

  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByTestId("revenue-total")).toHaveText(`US$${(before + 4321).toLocaleString("en-US")}`);
  const first = page.getByRole("region", { name: "Recent activity" }).getByRole("listitem").first();
  await expect(first).toContainText("Moved from Negotiation to Won");
  await expect(first).toContainText("Harbour signage");
});
