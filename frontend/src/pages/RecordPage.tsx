import type { ReactNode } from "react";
import type { Stamped } from "../api/types";
import { formatDate } from "../lib/format";
import "./record-page.css";

/** A record page's heading with Edit and Delete. */
export function RecordTitle({
  name,
  badges,
  onEdit,
  onDelete,
}: {
  name: string;
  badges?: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="title">
      <h1>{name}</h1>
      {badges}
      <div className="actions">
        <button type="button" className="btn quiet" onClick={onEdit}>
          Edit
        </button>
        <button
          type="button"
          className="btn quiet danger-text"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

/** Who added a record and when, and who last changed it once it has been. */
function Stamps({ stamped }: { stamped: Stamped }) {
  const changed = stamped.updated_at !== stamped.created_at;
  return (
    <div className="stamps">
      <p>
        Added by {stamped.created_by} on {formatDate(stamped.created_at)}
      </p>
      {changed && (
        <p>
          Last changed by {stamped.updated_by} on{" "}
          {formatDate(stamped.updated_at)}
        </p>
      )}
    </div>
  );
}

/** Label and value pairs, then who added and changed the record. */
export function Details({
  items,
  stamped,
}: {
  items: [string, ReactNode][];
  stamped: Stamped;
}) {
  return (
    <>
      <dl className="details">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value ?? <span className="muted">—</span>}</dd>
          </div>
        ))}
      </dl>
      <Stamps stamped={stamped} />
    </>
  );
}

/** A panel with a heading and an optional action on the right. */
export function Panel({
  title,
  sub,
  action,
  children,
}: {
  title: string;
  sub?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          {sub && <p className="sub">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
