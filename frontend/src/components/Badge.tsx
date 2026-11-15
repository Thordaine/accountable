import { DARK_STAGES, STAGE_COLOR, STATUS_COLOR, type Stage, type Status } from "../lib/stages";

/** A small colored label. */
export function Badge({ color, dark, children }: { color: string; dark?: boolean; children: string }) {
  return (
    <span className="badge" style={{ background: color, color: dark ? "#fff" : "var(--ink)" }}>
      {children}
    </span>
  );
}

export const StageBadge = ({ stage }: { stage: Stage }) => (
  <Badge color={STAGE_COLOR[stage]} dark={DARK_STAGES.includes(stage)}>{stage}</Badge>
);

export const StatusBadge = ({ status }: { status: Status }) => (
  <Badge color={STATUS_COLOR[status]} dark={status === "Qualified"}>{status}</Badge>
);

export const LateBadge = () => <Badge color="var(--rasp)" dark>Late</Badge>;
