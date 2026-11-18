import { isoDate } from "./format";

export const STAGES = [
  "New",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
] as const;
export type Stage = (typeof STAGES)[number];
export const OPEN_STAGES: readonly Stage[] = STAGES.slice(0, 4);

export const STATUSES = ["Lead", "Qualified", "Customer"] as const;
export type Status = (typeof STATUSES)[number];

export const USUAL_PROBABILITY: Record<Stage, number> = {
  New: 10,
  Qualified: 25,
  Proposal: 50,
  Negotiation: 75,
  Won: 100,
  Lost: 0,
};

export const STAGE_COLOR: Record<Stage, string> = {
  New: "var(--stage-new)",
  Qualified: "var(--stage-qualified)",
  Proposal: "var(--stage-proposal)",
  Negotiation: "var(--stage-negotiation)",
  Won: "var(--stage-won)",
  Lost: "var(--stage-lost)",
};

/** The text color on each stage color. */
export const STAGE_TEXT: Record<Stage, string> = {
  New: "var(--on-stage-new)",
  Qualified: "var(--on-stage-qualified)",
  Proposal: "var(--on-stage-proposal)",
  Negotiation: "var(--on-stage-negotiation)",
  Won: "var(--on-stage-won)",
  Lost: "var(--on-stage-lost)",
};

/** The shade over each stage color that marks expected revenue in the pipeline band. */
export const STAGE_EXPECTED: Record<Stage, string> = {
  New: "var(--band-expected)",
  Qualified: "var(--band-expected)",
  Proposal: "var(--band-expected)",
  Negotiation: "var(--band-expected-deep)",
  Won: "var(--band-expected-deep)",
  Lost: "var(--band-expected-deep)",
};

export const STATUS_COLOR: Record<Status, string> = {
  Lead: "var(--status-lead)",
  Qualified: "var(--status-qualified)",
  Customer: "var(--status-customer)",
};

/** The text color on each status color. */
export const STATUS_TEXT: Record<Status, string> = {
  Lead: "var(--on-status-lead)",
  Qualified: "var(--on-status-qualified)",
  Customer: "var(--on-status-customer)",
};

export function isOpen(stage: Stage) {
  return OPEN_STAGES.includes(stage);
}

/** Open, with a close date before today. */
export function isLate(
  deal: { stage: Stage; close_date: string },
  today: Date,
) {
  return isOpen(deal.stage) && deal.close_date < isoDate(today);
}

/** Value times probability of close, unrounded. */
export function expectedRevenue(deal: { value: number; probability: number }) {
  return (deal.value * deal.probability) / 100;
}
