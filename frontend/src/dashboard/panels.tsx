import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { useState } from "react";
import { Link } from "react-router";
import { useSetDone } from "../api/queries";
import type { Dashboard, RecordLink } from "../api/types";
import { TYPES } from "../forms/ActivityForm";
import { formatDue, formatMoneyShort } from "../lib/format";
import { STAGE_COLOR, STAGES, type Stage, STATUS_COLOR } from "../lib/stages";

const recordPath = (r: RecordLink) => `/${r.kind}s/${r.id}`;

/** For each stage up to Won, the value that reached it or went further. */
export function Funnel({ funnel }: { funnel: Dashboard["funnel"] }) {
  const top = funnel[0]?.value || 1;
  return (
    <div className="stairs">
      {funnel.map((f) => (
        <div key={f.stage} className="stair">
          <div className="v">{formatMoneyShort(f.value)}</div>
          <div className="col" style={{ height: `${(f.value / top) * 82}%`, background: STAGE_COLOR[f.stage] }} />
          <div className="n">{f.stage}</div>
        </div>
      ))}
    </div>
  );
}

type FollowUp = Dashboard["follow_ups"][number];

function FollowUpItem({ item }: { item: FollowUp }) {
  const setDone = useSetDone();
  const [done, setLocalDone] = useState(false);
  function tick(checked: boolean) {
    setLocalDone(checked);
    setDone.mutate({ id: item.activity_id, done: checked }, { onError: () => setLocalDone(!checked) });
  }
  return (
    <li>
      <input type="checkbox" className="check" checked={done} onChange={(e) => tick(e.target.checked)}
        aria-label={`Done: ${item.description}`} />
      <div>
        <div className="what">{item.description}</div>
        <div className="meta">
          <Link to={recordPath(item.record)}>{item.record.name}</Link>
          <span className={`when${item.overdue ? " late" : ""}`}>{formatDue(item.follow_up_date, new Date())}</span>
        </div>
      </div>
    </li>
  );
}

/** Follow-ups not done that are overdue or due in the next 7 days. */
export function FollowUps({ items }: { items: Dashboard["follow_ups"] }) {
  if (items.length === 0) return <p className="muted">Nothing due in the next 7 days.</p>;
  return <ul className="list">{items.map((item) => <FollowUpItem key={item.activity_id} item={item} />)}</ul>;
}

/** The pip color: the new stage or status for automatic entries, mist for the rest. */
function pipColor(description: string, type: string) {
  if (type !== "auto") return "var(--mist)";
  const to = description.split(" to ").at(-1)!;
  if (STAGES.includes(to as Stage)) return STAGE_COLOR[to as Stage];
  return STATUS_COLOR.Customer;
}

/** When, short: 10:40 today, Yesterday, or 12 Nov. */
function when(happenedAt: string) {
  const date = parseISO(happenedAt);
  const days = differenceInCalendarDays(new Date(), date);
  if (days === 0) return format(date, "HH:mm");
  if (days === 1) return "Yesterday";
  return format(date, "d MMM");
}

const typeLabel = Object.fromEntries(TYPES);

/** The newest timeline entries across the app. */
export function RecentActivity({ items }: { items: Dashboard["recent"] }) {
  if (items.length === 0) return <p className="muted">No activity yet.</p>;
  return (
    <ul className="list">
      {items.map((a) => (
        <li key={a.id}>
          <span className="pip" style={{ background: pipColor(a.description, a.type) }} />
          <div>
            <div className="what">{a.type === "auto" ? a.description : `${typeLabel[a.type]}: ${a.description}`}</div>
            <div className="meta">
              <Link to={recordPath(a.record)}>{a.record.name}</Link>
              <span className="when">{when(a.happened_at)}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
