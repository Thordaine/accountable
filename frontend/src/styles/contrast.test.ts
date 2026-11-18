import { describe, expect, test } from "vitest";
import css from "./tokens.css?raw";

type Tokens = Record<string, string>;

/** The custom properties declared in the block that opens with `selector {`. */
function block(selector: string): Tokens {
  const start = css.indexOf(`${selector} {`);
  expect(start, selector).toBeGreaterThanOrEqual(0);
  const body = css.slice(start, css.indexOf("}", start));
  const pairs = body.matchAll(/(--[\w-]+):\s*([^;]+);/g);
  return Object.fromEntries([...pairs].map((m) => [m[1], m[2].trim()]));
}

/** A token's value, following var() references. */
function resolve(tokens: Tokens, name: string): string {
  const value = tokens[`--${name}`];
  expect(value, name).toBeDefined();
  const ref = value.match(/^var\(--([\w-]+)\)$/);
  return ref ? resolve(tokens, ref[1]) : value;
}

function luminance(hex: string) {
  const digits = hex.slice(1);
  const full =
    digits.length === 3 ? [...digits].map((d) => d + d) : digits.match(/../g)!;
  const [r, g, b] = full.map((h) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The WCAG contrast ratio of two tokens. */
function ratio(tokens: Tokens, fg: string, bg: string) {
  const [a, b] = [fg, bg].map((t) => luminance(resolve(tokens, t)));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const STAGES = ["new", "qualified", "proposal", "negotiation", "won", "lost"];
const STATUSES = ["lead", "qualified", "customer"];

/** Normal text and its background: at least 4.5:1. */
const TEXT: [string, string][] = [
  ["ink", "page"],
  ["ink", "panel"],
  ["ink", "input"],
  ["ink", "raised"],
  ["muted", "page"],
  ["muted", "panel"],
  ["muted", "card"],
  ["muted", "card-late"],
  ...STAGES.map((s): [string, string] => [`on-stage-${s}`, `stage-${s}`]),
  ...STATUSES.map((s): [string, string] => [`on-status-${s}`, `status-${s}`]),
  ["on-ink", "ink"],
  ["on-sea", "sea"],
  ["ink", "row-hover"],
  ["ink", "card"],
  ["ink", "card-hover"],
  ["ceru-ink", "card"],
  ["on-rasp", "rasp-fill"],
  ["sea-ink", "panel"],
  ["mari-ink", "panel"],
  ["mari-ink", "email-tint"],
  ["ceru-ink", "panel"],
  ["rasp-ink", "panel"],
  ["rasp-ink", "card"],
  ["rasp-ink", "card-late"],
];

/** Parts that carry meaning and their background: at least 3:1. */
const PARTS: [string, string][] = [
  ["ceru", "page"],
  ["ceru", "panel"],
  ["ceru", "call-tint"],
  ["on-mark", "mark"],
  ["stage-won", "panel"],
  ["rasp", "panel"],
  ["sea-ink", "panel"],
  ["check-border", "input"],
  ["sea-ink", "input"],
];

/** Light values before dark mode, other than the pairs changed for AA. */
const TODAY: Tokens = {
  "--page": "#f0f4f5",
  "--panel": "#ffffff",
  "--ink": "#073b4c",
  "--line": "#e4ebed",
  "--mist": "#cdd8db",
  "--sea": "#06d6a0",
  "--mari": "#ffc145",
  "--coral": "#f78c6b",
  "--ceru": "#118ab2",
  "--rasp": "#ef476f",
  "--input": "#ffffff",
  "--raised": "#ffffff",
  "--row-hover": "#f7fafa",
  "--card": "#f6f9f9",
  "--card-hover": "#edf3f4",
  "--card-late": "#fdebef",
  "--card-late-ring": "rgba(239, 71, 111, 0.55)",
  "--backdrop": "rgba(7, 59, 76, 0.35)",
  "--call-tint": "#e1f1f7",
  "--email-tint": "#fff3d9",
  "--band-expected": "rgba(7, 59, 76, 0.16)",
  "--band-expected-deep": "rgba(4, 35, 46, 0.35)",
  "--band-key-expected": "#9db1b7",
};

const light = block(":root");
const dark = { ...light, ...block(':root[data-theme="dark"]') };

describe.each([
  ["light", light],
  ["dark", dark],
])("%s mode", (_, tokens) => {
  test.each(TEXT)("text %s on %s is at least 4.5:1", (fg, bg) => {
    expect(ratio(tokens, fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  test.each(PARTS)("part %s on %s is at least 3:1", (fg, bg) => {
    expect(ratio(tokens, fg, bg)).toBeGreaterThanOrEqual(3);
  });
});

test("light tokens outside the AA pairs keep their values", () => {
  for (const [name, value] of Object.entries(TODAY)) {
    expect(light[name], name).toBe(value);
  }
});
