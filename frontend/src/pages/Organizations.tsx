import { useState } from "react";
import { Link } from "react-router";
import { useOrganizations } from "../api/queries";
import type { Organization } from "../api/types";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { type Col, DataTable } from "../components/DataTable";
import { RowActions } from "../components/RowActions";
import { OrganizationForm } from "../forms/OrganizationForm";
import { formatMoney } from "../lib/format";

const columns: Col<Organization>[] = [
  {
    id: "name",
    header: "Name",
    text: (o) => o.name,
    cell: (o) => <Link to={`/organizations/${o.id}`}>{o.name}</Link>,
  },
  { id: "industry", header: "Industry", text: (o) => o.industry ?? "—" },
  { id: "website", header: "Website", text: (o) => o.website ?? "—" },
  {
    id: "contacts",
    header: "Contacts",
    text: (o) => String(o.contact_count),
    sort: (o) => o.contact_count,
    className: "num mono",
  },
  {
    id: "open",
    header: "Open deals",
    text: (o) => formatMoney(o.open_deal_value),
    sort: (o) => o.open_deal_value,
    className: "num mono",
  },
];

/** The Organizations table. */
export function Organizations() {
  const { data } = useOrganizations();
  const [editing, setEditing] = useState<Organization | "new" | null>(null);
  const [deleting, setDeleting] = useState<Organization | null>(null);
  return (
    <>
      <div className="title">
        <h1>Organizations</h1>
        <div className="actions">
          <button
            type="button"
            className="btn"
            onClick={() => setEditing("new")}
          >
            Add organization
          </button>
        </div>
      </div>
      {data && (
        <DataTable
          columns={columns}
          rows={data}
          defaultSort="name"
          noun="organizations"
          actions={(o) => (
            <RowActions
              name={o.name}
              onEdit={() => setEditing(o)}
              onDelete={() => setDeleting(o)}
            />
          )}
        />
      )}
      {editing && (
        <OrganizationForm
          initial={editing === "new" ? undefined : editing}
          onDone={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDelete
          kind="organizations"
          id={deleting.id}
          name={deleting.name}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
