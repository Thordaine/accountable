import { addDays, format } from "date-fns";
import { expect, test } from "./fixtures";

const day = (d: Date) => format(d, "yyyy-MM-dd");

test("log, follow up and win a deal from its page", async ({ page }) => {
  const contact = await (await page.request.post("/api/contacts", { data: { name: "Jonas Weber" } })).json();
  await page.request.post("/api/deals", {
    data: { name: "Weber consulting", stage: "Proposal", value: 12000, contact_id: contact.id },
  });

  await page.goto("/deals");
  await page.getByRole("searchbox").fill("Weber consulting");
  await page.getByRole("link", { name: "Weber consulting" }).click();
  await expect(page.getByRole("heading", { name: "Weber consulting" })).toBeVisible();

  const log = page.getByRole("form", { name: "Log an activity" });
  await log.getByRole("button", { name: "Call" }).click();
  await log.getByLabel("Description").fill("Asked about a volume discount");
  await log.getByLabel("Follow-up date").fill(day(addDays(new Date(), 1)));
  await log.getByRole("button", { name: "Log activity" }).click();
  await expect(page.getByText("Activity logged")).toBeVisible();
  const first = page.locator(".timeline li").first();
  await expect(first).toContainText("Asked about a volume discount");
  await expect(first.getByRole("img", { name: "Call" })).toBeVisible();

  await page.getByRole("link", { name: "Jonas Weber" }).click();
  const call = page.locator(".timeline li").filter({ hasText: "Asked about a volume discount" });
  await expect(call).toContainText("On deal: Weber consulting");
  await page.goBack();

  await page.getByLabel("Stage").selectOption("Won");
  await expect(page.locator(".timeline li").first()).toContainText("Moved from Proposal to Won");
  await expect(page.locator(".details")).toContainText(format(new Date(), "d MMM yyyy"));
  await expect(page.locator(".details")).toContainText("100%");

  await page.getByRole("link", { name: "Jonas Weber" }).click();
  await expect(page.locator(".title")).toContainText("Customer");
  await expect(page.locator(".timeline")).toContainText("Status changed from Lead to Customer");

  await page.getByRole("checkbox", { name: "Done: Asked about a volume discount" }).check();
  await expect(page.getByRole("checkbox", { name: "Done: Asked about a volume discount" })).toBeChecked();
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Done: Asked about a volume discount" })).toBeChecked();
});

test("organization page adds a contact with the organization filled in", async ({ page }) => {
  await page.goto("/organizations");
  await page.getByRole("link", { name: "Osprey Materials" }).click();
  await page.getByRole("button", { name: "Add contact" }).click();
  await expect(page.getByRole("combobox", { name: "Organization" })).toHaveValue("Osprey Materials");
  await page.getByLabel("Name").fill("Petra Lindqvist");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("link", { name: "Petra Lindqvist" })).toBeVisible();
});

test("an unknown deal shows Deal not found", async ({ page, consoleErrors }) => {
  await page.goto("/deals/9999");
  await expect(page.getByRole("heading", { name: "Deal not found" })).toBeVisible();
  await page.getByRole("link", { name: "Back to Deals" }).click();
  await expect(page).toHaveURL("/deals");
  expect(consoleErrors.filter((e) => e.includes("status of 404"))).toHaveLength(1);
  consoleErrors.length = 0;
});
