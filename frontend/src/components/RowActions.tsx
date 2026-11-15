import { Link } from "react-router";

/** Edit and Delete for one row. */
export function RowActions({ name, onEdit, onDelete }: { name: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <>
      <button type="button" className="link-btn" aria-label={`Edit ${name}`} onClick={onEdit}>Edit</button>
      <button type="button" className="link-btn danger" aria-label={`Delete ${name}`} onClick={onDelete}>
        Delete
      </button>
    </>
  );
}

/** A link to a record, or a dash when there is none. */
export function MaybeLink({ to, name }: { to: string; name: string | null }) {
  return name ? <Link to={to}>{name}</Link> : <span className="muted">—</span>;
}
