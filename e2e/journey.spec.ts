import { addDays, format } from "date-fns";
import { drag, expect, test } from "./fixtures";

test("a salesperson's day, end to end", async ({ page }) => {
  test.setTimeout(90_000);

  await test.step("land on the dashboard", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Open pipeline" })).toBeVisible();
  });

  await test.step("add an organization", async () => {
    await page.getByRole("link", { name: "Organizations" }).click();
    await page.getByRole("button", { name: "Add organization" }).click();
    await page.getByLabel("Name").fill("Northwind Bakeries");
    await page.getByLabel("Industry").fill("Food manufacturing");
    await page.getByRole("button", { name: "Save" }).click();
    await page.getByRole("link", { name: "Northwind Bakeries" }).click();
    await expect(page.getByRole("heading", { name: "Northwind Bakeries" })).toBeVisible();
  });

  await test.step("add a contact at it, and a deal for them", async () => {
    await page.getByRole("button", { name: "Add contact" }).click();
    await page.getByLabel("Name").fill("Ines Okonkwo");
    await page.getByLabel("Job title").fill("Operations Director");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("link", { name: "Ines Okonkwo" })).toBeVisible();

    await page.getByRole("button", { name: "Add deal" }).last().click();
    await expect(page.getByRole("combobox", { name: "Organization" })).toHaveValue("Northwind Bakeries");
    await page.getByLabel("Name").fill("Northwind oven monitoring");
    await page.getByRole("combobox", { name: "Main contact" }).fill("Ines");
    await page.getByRole("option", { name: /Ines Okonkwo/ }).click();
    await page.getByLabel("Value (US$)").fill("36000");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("link", { name: "Northwind oven monitoring" })).toBeVisible();
  });

  await test.step("move the deal across the pipeline to Won", async () => {
    await page.getByRole("link", { name: "Pipeline" }).click();
    const card = (stage: string) => page.getByRole("region", { name: stage, exact: true }).locator(".card-slot");
    const ours = page.locator(".card-slot", { hasText: "Northwind oven monitoring" });
    for (const [from, to] of [["New", "Qualified"], ["Qualified", "Proposal"], ["Proposal", "Negotiation"], ["Negotiation", "Won"]]) {
      await expect(card(from).filter({ hasText: "Northwind oven monitoring" })).toBeVisible();
      const saved = page.waitForResponse("**/api/deals/*/move");
      await drag(page, ours, card(to).first());
      await saved;
    }
    await expect(card("Won").first()).toHaveAttribute("aria-label", "Northwind oven monitoring");
  });

  await test.step("log a call with a follow-up on the deal", async () => {
    await page.locator(".card-slot", { hasText: "Northwind oven monitoring" }).click();
    await expect(page.locator(".timeline")).toContainText("Moved from Negotiation to Won");
    const log = page.getByRole("form", { name: "Log an activity" });
    await log.getByRole("button", { name: "Call" }).click();
    await log.getByLabel("Description").fill("Agree the installation dates");
    await log.getByLabel("Follow-up date").fill(format(addDays(new Date(), 2), "yyyy-MM-dd"));
    await log.getByRole("button", { name: "Log activity" }).click();
    await expect(page.locator(".timeline li").first()).toContainText("Agree the installation dates");
  });

  await test.step("the contact became a customer", async () => {
    await page.locator(".details").getByRole("link", { name: "Ines Okonkwo" }).click();
    await expect(page.locator(".title")).toContainText("Customer");
  });

  await test.step("see the follow-up on the dashboard and mark it done", async () => {
    await page.getByRole("link", { name: "Dashboard" }).click();
    const item = page.getByRole("region", { name: "Follow-ups" }).getByRole("listitem")
      .filter({ hasText: "Agree the installation dates" });
    await expect(item).toContainText("Northwind oven monitoring");
    await item.getByRole("checkbox").check();
    await expect(item).toHaveCount(0);
  });

  await test.step("delete the organization; its contact and deal are kept, unlinked", async () => {
    await page.getByRole("link", { name: "Organizations" }).click();
    await page.getByRole("button", { name: "Delete Northwind Bakeries" }).click();
    await expect(page.getByRole("dialog")).toContainText("Its 1 contact and 1 deal will be kept, with no organization.");
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText("Organization deleted")).toBeVisible();

    await page.getByRole("link", { name: "Deals" }).click();
    await page.getByRole("searchbox").fill("Northwind");
    const row = page.getByRole("row").filter({ hasText: "Northwind oven monitoring" });
    await expect(row.getByRole("cell").nth(1)).toHaveText("—");
    await expect(row).toContainText("Ines Okonkwo");
  });
});
