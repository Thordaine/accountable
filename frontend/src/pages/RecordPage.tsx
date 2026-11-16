import type { ReactNode } from "react";

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

/** Label and value pairs. */
export function Details({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="details">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value ?? <span className="muted">—</span>}</dd>
        </div>
      ))}
    </dl>
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
