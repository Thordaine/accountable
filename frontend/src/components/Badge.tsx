import {
  STAGE_COLOR,
  STAGE_TEXT,
  STATUS_COLOR,
  STATUS_TEXT,
  type Stage,
  type Status,
} from "../lib/stages";

/** A small colored label. */
export function Badge({
  color,
  text,
  children,
}: {
  color: string;
  text: string;
  children: string;
}) {
  return (
    <span className="badge" style={{ background: color, color: text }}>
      {children}
    </span>
  );
}

export const StageBadge = ({ stage }: { stage: Stage }) => (
  <Badge color={STAGE_COLOR[stage]} text={STAGE_TEXT[stage]}>
    {stage}
  </Badge>
);

export const StatusBadge = ({ status }: { status: Status }) => (
  <Badge color={STATUS_COLOR[status]} text={STATUS_TEXT[status]}>
    {status}
  </Badge>
);

export const LateBadge = () => (
  <Badge color="var(--rasp-fill)" text="var(--on-rasp)">
    Late
  </Badge>
);
