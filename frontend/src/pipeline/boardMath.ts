import type { Deal } from "../api/types";
import { isoDate } from "../lib/format";
import {
  expectedRevenue,
  isOpen,
  STAGES,
  type Stage,
  USUAL_PROBABILITY,
} from "../lib/stages";

export type Columns = Record<Stage, Deal[]>;

/** Deals grouped by stage, each column in card order. */
export function columnsFrom(deals: Deal[]): Columns {
  const columns = Object.fromEntries(
    STAGES.map((s) => [s, [] as Deal[]]),
  ) as Columns;
  for (const deal of deals.toSorted(
    (a, b) => a.position - b.position || a.id - b.id,
  ))
    columns[deal.stage].push(deal);
  return columns;
}

/** The columns with one card moved; a change of stage applies the stage rules. */
export function moveCard(
  columns: Columns,
  dealId: number,
  toStage: Stage,
  toIndex: number,
  today = new Date(),
): Columns {
  const card = Object.values(columns)
    .flat()
    .find((d) => d.id === dealId)!;
  const moved =
    card.stage === toStage
      ? card
      : {
          ...card,
          stage: toStage,
          probability: USUAL_PROBABILITY[toStage],
          close_date:
            toStage === "Won" || toStage === "Lost"
              ? isoDate(today)
              : card.close_date,
        };
  const next = {
    ...columns,
    [card.stage]: columns[card.stage].filter((d) => d.id !== dealId),
  };
  const target = next[toStage].toSpliced(toIndex, 0, moved);
  next[toStage] = target.map((d, position) => ({ ...d, position }));
  return next;
}

/** Value and expected revenue of the open deals among these. */
export function totals(deals: Deal[]) {
  const open = deals.filter((d) => isOpen(d.stage));
  return {
    value: open.reduce((sum, d) => sum + d.value, 0),
    expected: open.reduce((sum, d) => sum + expectedRevenue(d), 0),
  };
}
