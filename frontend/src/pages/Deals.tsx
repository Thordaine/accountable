import { useState } from "react";
import { Link } from "react-router";
import { useDeals } from "../api/queries";
import type { Deal } from "../api/types";
import { LateBadge, StageBadge } from "../components/Badge";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { type Col, DataTable } from "../components/DataTable";
import { MaybeLink, RowActions } from "../components/RowActions";
import { DealForm } from "../forms/DealForm";
import { formatDate, formatMoney } from "../lib/format";
import { isLate, STAGES } from "../lib/stages";

/** A close date, in Raspberry with a Late badge when the deal is late. */
export function CloseDate({ deal }: { deal: Deal }) {
  if (!isLate(deal, new Date()))
    return <span className="mono">{formatDate(deal.close_date)}</span>;
  return (
    <span className="late-date">
      <span className="mono late">{formatDate(deal.close_date)}</span>{" "}
      <LateBadge />
    </span>
  );
}

const columns: Col<Deal>[] = [
  {
    id: "name",
    header: "Name",
    text: (d) => d.name,
    cell: (d) => <Link to={`/deals/${d.id}`}>{d.name}</Link>,
  },
  {
    id: "organization",
    header: "Organization",
    text: (d) => d.organization_name ?? "—",
    cell: (d) => (
      <MaybeLink
        to={`/organizations/${d.organization_id}`}
        name={d.organization_name}
      />
    ),
  },
  {
    id: "contact",
    header: "Main contact",
    text: (d) => d.contact_name ?? "—",
    cell: (d) => (
      <MaybeLink to={`/contacts/${d.contact_id}`} name={d.contact_name} />
    ),
  },
  {
    id: "stage",
    header: "Stage",
    text: (d) => d.stage,
    sort: (d) => STAGES.indexOf(d.stage),
    cell: (d) => <StageBadge stage={d.stage} />,
  },
  {
    id: "value",
    header: "Value",
    text: (d) => formatMoney(d.value),
    sort: (d) => d.value,
    className: "num mono",
  },
  {
    id: "probability",
    header: "Probability",
    text: (d) => `${d.probability}%`,
    sort: (d) => d.probability,
    className: "num mono",
  },
  {
    id: "close_date",
    header: "Close date",
    sort: (d) => d.close_date,
    text: (d) =>
      formatDate(d.close_date) + (isLate(d, new Date()) ? " Late" : ""),
    cell: (d) => <CloseDate deal={d} />,
  },
];

/** The Deals table. */
export function Deals() {
  const { data } = useDeals();
  const [editing, setEditing] = useState<Deal | "new" | null>(null);
  const [deleting, setDeleting] = useState<Deal | null>(null);
  return (
    <>
      <div className="title">
        <h1>Deals</h1>
        <div className="actions">
          <button
            type="button"
            className="btn"
            onClick={() => setEditing("new")}
          >
            Add deal
          </button>
        </div>
      </div>
      {data && (
        <DataTable
          columns={columns}
          rows={data}
          defaultSort="close_date"
          noun="deals"
          actions={(d) => (
            <RowActions
              name={d.name}
              onEdit={() => setEditing(d)}
              onDelete={() => setDeleting(d)}
            />
          )}
        />
      )}
      {editing && (
        <DealForm
          initial={editing === "new" ? undefined : editing}
          onDone={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDelete
          kind="deals"
          id={deleting.id}
          name={deleting.name}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
