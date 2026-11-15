import { expect, type Locator, type Page, test as base } from "@playwright/test";

/** Playwright's test, failing any test whose page logs a console error. */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        const handled422 = msg.text().includes("status of 422");
        if (msg.type() === "error" && !handled422) errors.push(msg.text());
      });
      page.on("pageerror", (err) => errors.push(err.message));
      await use(errors);
      expect(errors, "console errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Drag with real mouse moves, ending at the top part of the target. */
export async function drag(page: Page, source: Locator, target: Locator) {
  const s = (await source.boundingBox())!;
  const t = (await target.boundingBox())!;
  await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
  await page.mouse.down();
  await page.mouse.move(s.x + s.width / 2 + 8, s.y + s.height / 2 + 8, { steps: 4 });
  await page.mouse.move(t.x + t.width / 2, t.y + t.height / 4, { steps: 20 });
  await page.mouse.move(t.x + t.width / 2, t.y + t.height / 4 + 2, { steps: 2 });
  await page.mouse.up();
}

