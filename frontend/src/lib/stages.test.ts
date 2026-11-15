import { expect, test } from "vitest";
import { isLate } from "./stages";

const today = new Date(2026, 10, 15);

test("isLate", () => {
  expect(isLate({ stage: "Proposal", close_date: "2026-11-14" }, today)).toBe(true);
  expect(isLate({ stage: "Proposal", close_date: "2026-11-15" }, today)).toBe(false);
  expect(isLate({ stage: "Won", close_date: "2025-06-01" }, today)).toBe(false);
});
