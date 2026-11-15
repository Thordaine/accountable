import { expect, test } from "vitest";
import { formatDate, formatDue, formatMoney, formatMoneyShort } from "./format";

const today = new Date(2026, 10, 15);

test("formatMoney", () => {
  expect(formatMoney(48200)).toBe("US$48,200");
  expect(formatMoney(0)).toBe("US$0");
  expect(formatMoney(246287.5)).toBe("US$246,288");
});

test("formatMoneyShort", () => {
  expect(formatMoneyShort(48200)).toBe("US$48k");
  expect(formatMoneyShort(1175050)).toBe("US$1.2M");
  expect(formatMoneyShort(950)).toBe("US$950");
  expect(formatMoneyShort(999600)).toBe("US$1.0M");
});

test("formatDate", () => {
  expect(formatDate("2026-11-15")).toBe("15 Nov 2026");
});

test("formatDue", () => {
  expect(formatDue("2026-11-13", today)).toBe("2 days overdue");
  expect(formatDue("2026-11-14", today)).toBe("1 day overdue");
  expect(formatDue("2026-11-15", today)).toBe("Today");
  expect(formatDue("2026-11-17", today)).toBe("Tue 17 Nov");
});
