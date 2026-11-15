import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useDeleteActivity, useSetDone } from "../api/queries";
import type { Activity } from "../api/types";
import { ActivityForm } from "../forms/ActivityForm";
import { formatDate, formatDateTime, formatDue, isoDate } from "../lib/format";
import { FormDialog } from "./FormDialog";

const ICON: Record<Activity["type"], { label: string; path: string }> = {
  note: { label: "Note", path: "M5 3h9l5 5v13H5zM14 3v5h5M8 13h8M8 17h6" },
  call: {
    label: "Call",
    path: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z",
  },
  email: { label: "Email", path: "M3 6h18v12H3zM3 7l9 6 9-6" },
  auto: { label: "Automatic entry", path: "M5 12h12M13 7l5 5-5 5" },
};

/** An activity's type as a small icon. */
export function TypeIcon({ type }: { type: Activity["type"] }) {
  const { label, path } = ICON[type];
  return (
    <span className={`type-icon ${type}`} role="img" aria-label={label}>
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={path} />
      </svg>
    </span>
  );
}

/** A follow-up's date and its done checkbox; overdue ones in Raspberry. */
function FollowUp({ activity }: { activity: Activity }) {
  const setDone = useSetDone();
  const [done, setLocalDone] = useState(activity.done);
  const due = activity.follow_up_date!;
  const overdue = !done && due < isoDate(new Date());
  function toggle(checked: boolean) {
    setLocalDone(checked);
    setDone.mutate({ id: activity.id, done: checked }, { onError: () => setLocalDone(!checked) });
  }
  return (
    <label className="follow-up">
      <input type="checkbox" checked={done} aria-label={`Done: ${activity.description}`}
        onChange={(e) => toggle(e.target.checked)} />
      <span className={overdue ? "late" : undefined}>
        Follow-up {done ? formatDate(due) : formatDue(due, new Date())}
      </span>
    </label>
  );
}

function Entry({ activity, showDealName, onEdit, onDelete }: {
  activity: Activity;
  showDealName?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const manual = activity.type !== "auto";
  return (
    <li className="entry">
      <TypeIcon type={activity.type} />
      <div>
        <div className="what">{activity.description}</div>
        <div className="meta">
          <span className="when">{formatDateTime(activity.happened_at)}</span>
          {showDealName && activity.deal_id && (
            <span>On deal: <Link to={`/deals/${activity.deal_id}`}>{activity.deal_name}</Link></span>
          )}
          {activity.follow_up_date && <FollowUp key={String(activity.done)} activity={activity} />}
          {manual && (
            <span className="entry-actions">
              <button type="button" className="link-btn" onClick={onEdit} aria-label="Edit activity">Edit</button>
              <button type="button" className="link-btn danger" onClick={onDelete} aria-label="Delete activity">
                Delete
              </button>
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

/** A record's timeline, newest first. */
export function Timeline({ entries, showDealName }: { entries: Activity[]; showDealName?: boolean }) {
  const [editing, setEditing] = useState<Activity | null>(null);
  const [deleting, setDeleting] = useState<Activity | null>(null);
  const remove = useDeleteActivity();
  const sorted = entries.toSorted((a, b) => b.happened_at.localeCompare(a.happened_at) || b.id - a.id);

  function confirmDelete() {
    remove.mutate(deleting!.id, { onSuccess: () => toast("Activity deleted") });
    setDeleting(null);
  }

  if (sorted.length === 0) return <p className="muted empty-timeline">Nothing logged yet.</p>;
  return (
    <>
      <ul className="timeline">
        {sorted.map((a) => (
          <Entry key={a.id} activity={a} showDealName={showDealName}
            onEdit={() => setEditing(a)} onDelete={() => setDeleting(a)} />
        ))}
      </ul>
      {editing && <ActivityForm activity={editing} onDone={() => setEditing(null)} />}
      {deleting && (
        <FormDialog title="Delete this activity?" onClose={() => setDeleting(null)} onSubmit={confirmDelete}
          submitLabel="Delete" danger>
          <p className="confirm-text">“{deleting.description}” will be removed from the timeline.</p>
        </FormDialog>
      )}
    </>
  );
}
