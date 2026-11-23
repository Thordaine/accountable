import { expect, test } from "vitest";
import { initials } from "./initials";

test.each([
  ["Ingo Prause", "IP"],
  ["Ingo van Prause", "IP"],
  ["Cher", "C"],
  ["test@example.com", "T"],
])("%s gives %s", (name, expected) => {
  expect(initials(name)).toBe(expected);
});
