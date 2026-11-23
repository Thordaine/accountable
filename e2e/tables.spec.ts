import { expect, test } from "./fixtures";

const row = (page, name: string) => page.getByRole("row").filter({ hasText: name });

test("add, find, sort, edit, filter and delete a contact", async ({ page }) => {
  await page.goto("/contacts");
  const before = Number((await page.locator(".count").textContent())!.split(" of ")[1].split(" ")[0]);
  await page.getByRole("button", { name: "Add contact" }).click();
  await page.getByLabel("Name").fill("Priya Raman");
  await page.getByRole("combobox", { name: "Organization", exact: true }).fill("Calder");
  await page.getByRole("option", { name: "Calder Foods" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Contact saved")).toBeVisible();
  await expect(row(page, "Priya Raman")).toContainText("Calder Foods");

  await page.reload();
  await expect(row(page, "Priya Raman")).toContainText("Lead");

  await page.getByRole("searchbox").fill("raman");
  await expect(page.getByText(`1 of ${before + 1} contacts`)).toBeVisible();

  await page.getByRole("searchbox").fill("");
  await page.getByRole("button", { name: "Name" }).click();
  await expect(page.getByRole("row").nth(1)).toContainText("Zara Ahmed");

  await page.getByRole("button", { name: "Edit Priya Raman" }).click();
  await page.getByLabel("Job title").fill("Category Buyer");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(row(page, "Priya Raman")).toContainText("Category Buyer");

  await page.getByRole("button", { name: "Lead", exact: true }).click();
  await expect(row(page, "Priya Raman")).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "Customer" })).toHaveCount(0);

  await page.getByRole("button", { name: "Delete Priya Raman" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Their 0 deals will be kept, with no main contact. Their 0 activities will be deleted.",
  );
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Contact deleted")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("row").filter({ hasText: "Lena Brandt" })).toBeVisible();
  await expect(row(page, "Priya Raman")).toHaveCount(0);
});

test("required fields and server errors show next to the field", async ({ page }) => {
  await page.goto("/contacts");
  await page.getByRole("button", { name: "Add contact" }).click();
  await page.getByLabel("Email").fill("ann@");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Required")).toBeVisible();
  await page.getByLabel("Name").fill("Ann Example");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Doesn't look like an email address")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("a deal with only a name, added from the nav", async ({ page }) => {
  await page.goto("/deals");
  await page.getByRole("navigation").getByRole("button", { name: "Add deal" }).click();
  await page.getByLabel("Name").fill("Walk-in enquiry");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Deal saved")).toBeVisible();
  const cells = row(page, "Walk-in enquiry").getByRole("cell");
  await expect(cells.nth(1)).toHaveText("—");
  await expect(cells.nth(2)).toHaveText("—");
});

test("deleting an organization says what happens to its records", async ({ page }) => {
  await page.goto("/organizations");
  await page.getByRole("button", { name: "Delete Calder Foods" }).click();
  await expect(page.getByRole("dialog")).toContainText(/Its \d+ contacts and \d+ deals will be kept, with no organization\./);
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(row(page, "Calder Foods")).toBeVisible();
});

test("late deals stand out in the Deals table", async ({ page }) => {
  await page.goto("/deals");
  await expect(page.getByRole("row").filter({ hasText: "Late" }).first()).toBeVisible();
});
