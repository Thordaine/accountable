import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useRecord } from "../api/queries";
import type { Deal } from "../api/types";
import { StageBadge, StatusBadge } from "../components/Badge";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { NotFound } from "../components/NotFound";
import { MaybeLink } from "../components/RowActions";
import { Timeline } from "../components/Timeline";
import { ContactForm } from "../forms/ContactForm";
import { LogActivity } from "../forms/ActivityForm";
import { formatMoney } from "../lib/format";
import { CloseDate } from "./Deals";
import { Details, Panel, RecordTitle } from "./RecordPage";

/** A short table of deals linking to each. */
export function DealList({ deals }: { deals: Deal[] }) {
  if (deals.length === 0) return <p className="muted">No deals yet.</p>;
  return (
    <table className="data short">
      <tbody>
        {deals.map((d) => (
          <tr key={d.id}>
            <td>
              <Link to={`/deals/${d.id}`}>{d.name}</Link>
            </td>
            <td>
              <StageBadge stage={d.stage} />
            </td>
            <td className="num mono">{formatMoney(d.value)}</td>
            <td>
              <CloseDate deal={d} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** A contact's details, deals and timeline. */
export function Contact() {
  const id = Number(useParams().id);
  const { data: contact, isError } = useRecord("contacts", id);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  if (isError)
    return <NotFound noun="Contact" to="/contacts" section="Contacts" />;
  if (!contact) return null;
  return (
    <>
      <RecordTitle
        name={contact.name}
        badges={<StatusBadge status={contact.status} />}
        onEdit={() => setEditing(true)}
        onDelete={() => setDeleting(true)}
      />
      <div className="record-grid">
        <div className="stack">
          <Panel title="Details">
            <Details
              items={[
                [
                  "Organization",
                  <MaybeLink
                    to={`/organizations/${contact.organization_id}`}
                    name={contact.organization_name}
                  />,
                ],
                ["Job title", contact.job_title],
                [
                  "Email",
                  contact.email && (
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  ),
                ],
                [
                  "Phone",
                  contact.phone && (
                    <span className="mono">{contact.phone}</span>
                  ),
                ],
              ]}
            />
          </Panel>
          <Panel title="Deals" sub="Where they're the main contact">
            <DealList deals={contact.deals} />
          </Panel>
        </div>
        <Panel
          title="Timeline"
          sub="Their activities and their deals', newest first"
        >
          <LogActivity contactId={id} />
          <Timeline entries={contact.timeline} showDealName />
        </Panel>
      </div>
      {editing && (
        <ContactForm initial={contact} onDone={() => setEditing(false)} />
      )}
      {deleting && (
        <ConfirmDelete
          kind="contacts"
          id={id}
          name={contact.name}
          onClose={() => setDeleting(false)}
          onDeleted={() => navigate("/contacts")}
        />
      )}
    </>
  );
}
