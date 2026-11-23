import { expect, test } from "vitest";
import type { Deal } from "../api/types";
import type { Stage } from "../lib/stages";
import { columnsFrom, moveCard, totals } from "./boardMath";

let nextId = 1;
function deal(
  stage: Stage,
  value = 1000,
  probability?: number,
  position = 0,
): Deal {
  const id = nextId++;
  return {
    id,
    name: `Deal ${id}`,
    stage,
    value,
    position,
    probability:
      probability ??
      {
        New: 10,
        Qualified: 25,
        Proposal: 50,
        Negotiation: 75,
        Won: 100,
        Lost: 0,
      }[stage],
    close_date: "2026-12-01",
    organization_id: null,
    contact_id: null,
    organization_name: null,
    contact_name: null,
    created_at: "",
    updated_at: "",
    created_by: "",
    updated_by: "",
  };
}

test("moving to another stage applies its usual probability and places the card", () => {
  const proposal = [
    deal("Proposal", 1000, 50, 0),
    deal("Proposal", 1000, 50, 1),
  ];
  const negotiation = [
    deal("Negotiation", 1000, 75, 0),
    deal("Negotiation", 1000, 75, 1),
  ];
  const columns = columnsFrom([...proposal, ...negotiation]);
  const moved = moveCard(columns, proposal[0].id, "Negotiation", 1);
  expect(moved.Proposal.map((d) => d.id)).toEqual([proposal[1].id]);
  expect(moved.Negotiation.map((d) => d.id)).toEqual([
    negotiation[0].id,
    proposal[0].id,
    negotiation[1].id,
  ]);
  expect(moved.Negotiation[1].probability).toBe(75);
  expect(moved.Negotiation[1].stage).toBe("Negotiation");
});

test("moving within a column reorders and keeps a hand-set probability", () => {
  const cards = [
    deal("Proposal", 1000, 50, 0),
    deal("Proposal", 1000, 50, 1),
    deal("Proposal", 1000, 60, 2),
  ];
  const moved = moveCard(columnsFrom(cards), cards[2].id, "Proposal", 0);
  expect(moved.Proposal.map((d) => d.id)).toEqual([
    cards[2].id,
    cards[0].id,
    cards[1].id,
  ]);
  expect(moved.Proposal[0].probability).toBe(60);
});

test("winning sets today's date as the close date", () => {
  const card = deal("Negotiation");
  const moved = moveCard(
    columnsFrom([card]),
    card.id,
    "Won",
    0,
    new Date(2026, 10, 15),
  );
  expect(moved.Won[0].close_date).toBe("2026-11-15");
  expect(moved.Won[0].probability).toBe(100);
});

test("totals cover open deals only", () => {
  const deals = [
    deal("New", 10000),
    deal("Negotiation", 20000),
    deal("Won", 50000),
    deal("Lost", 7000),
  ];
  expect(totals(deals)).toEqual({ value: 30000, expected: 16000 });
});
