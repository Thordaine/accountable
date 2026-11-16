import { useState } from "react";
import { Link } from "react-router";
import { useContacts } from "../api/queries";
import type { Contact } from "../api/types";
import { StatusBadge } from "../components/Badge";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { type Col, DataTable } from "../components/DataTable";
import { MaybeLink, RowActions } from "../components/RowActions";
import { ContactForm } from "../forms/ContactForm";
import { STATUSES, type Status } from "../lib/stages";

const columns: Col<Contact>[] = [
  {
    id: "name",
    header: "Name",
    text: (c) => c.name,
    cell: (c) => <Link to={`/contacts/${c.id}`}>{c.name}</Link>,
  },
  {
    id: "organization",
    header: "Organization",
    text: (c) => c.organization_name ?? "—",
    cell: (c) => (
      <MaybeLink
        to={`/organizations/${c.organization_id}`}
        name={c.organization_name}
      />
    ),
  },
  { id: "job_title", header: "Job title", text: (c) => c.job_title ?? "—" },
  { id: "email", header: "Email", text: (c) => c.email ?? "—" },
  {
    id: "phone",
    header: "Phone",
    text: (c) => c.phone ?? "—",
    className: "mono",
  },
  {
    id: "status",
    header: "Status",
    text: (c) => c.status,
    cell: (c) => <StatusBadge status={c.status} />,
  },
];

/** All, Lead, Qualified or Customer. */
function StatusFilter({
  value,
  onChange,
}: {
  value: Status | "All";
  onChange: (s: Status | "All") => void;
}) {
  return (
    <div className="segmented" role="group" aria-label="Filter by status">
      {(["All", ...STATUSES] as const).map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={value === s}
          onClick={() => onChange(s)}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

/** The Contacts table, with a status filter. */
export function Contacts() {
  const { data } = useContacts();
  const [status, setStatus] = useState<Status | "All">("All");
  const [editing, setEditing] = useState<Contact | "new" | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const rows = data?.filter((c) => status === "All" || c.status === status);
  return (
    <>
      <div className="title">
        <h1>Contacts</h1>
        <div className="actions">
          <button
            type="button"
            className="btn"
            onClick={() => setEditing("new")}
          >
            Add contact
          </button>
        </div>
      </div>
      {rows && (
        <DataTable
          columns={columns}
          rows={rows}
          defaultSort="name"
          noun="contacts"
          toolbar={<StatusFilter value={status} onChange={setStatus} />}
          actions={(c) => (
            <RowActions
              name={c.name}
              onEdit={() => setEditing(c)}
              onDelete={() => setDeleting(c)}
            />
          )}
        />
      )}
      {editing && (
        <ContactForm
          initial={editing === "new" ? undefined : editing}
          onDone={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDelete
          kind="contacts"
          id={deleting.id}
          name={deleting.name}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
