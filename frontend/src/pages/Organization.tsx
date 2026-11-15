import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useRecord } from "../api/queries";
import { StatusBadge } from "../components/Badge";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { NotFound } from "../components/NotFound";
import { ContactForm } from "../forms/ContactForm";
import { DealForm } from "../forms/DealForm";
import { OrganizationForm } from "../forms/OrganizationForm";
import { formatMoney } from "../lib/format";
import { DealList } from "./Contact";
import { Details, Panel, RecordTitle } from "./RecordPage";

type Open = "edit" | "delete" | "contact" | "deal" | null;

/** An organization's details, contacts and deals. */
export function Organization() {
  const id = Number(useParams().id);
  const { data: org, isError } = useRecord("organizations", id);
  const navigate = useNavigate();
  const [open, setOpen] = useState<Open>(null);
  if (isError) return <NotFound noun="Organization" to="/organizations" section="Organizations" />;
  if (!org) return null;
  const close = () => setOpen(null);
  return (
    <>
      <RecordTitle name={org.name} onEdit={() => setOpen("edit")} onDelete={() => setOpen("delete")} />
      <div className="record-grid">
        <Panel title="Details">
          <Details items={[
            ["Website", org.website && <a href={`https://${org.website.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer">{org.website}</a>],
            ["Industry", org.industry],
            ["Notes", org.notes && <span className="notes">{org.notes}</span>],
          ]} />
        </Panel>
        <div className="stack">
          <Panel title="Contacts" action={<button type="button" className="btn small" onClick={() => setOpen("contact")}>Add contact</button>}>
            {org.contacts.length === 0 ? <p className="muted">No contacts yet.</p> : (
              <table className="data short">
                <tbody>
                  {org.contacts.map((c) => (
                    <tr key={c.id}>
                      <td><Link to={`/contacts/${c.id}`}>{c.name}</Link></td>
                      <td>{c.job_title ?? <span className="muted">—</span>}</td>
                      <td><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
          <Panel title="Deals" sub={<><span className="mono">{formatMoney(org.open_deal_value)}</span> in open deals</>}
            action={<button type="button" className="btn small" onClick={() => setOpen("deal")}>Add deal</button>}>
            <DealList deals={org.deals} />
          </Panel>
        </div>
      </div>
      {open === "edit" && <OrganizationForm initial={org} onDone={close} />}
      {open === "contact" && <ContactForm defaults={{ organization_id: id }} onDone={close} />}
      {open === "deal" && <DealForm defaults={{ organization_id: id }} onDone={close} />}
      {open === "delete" && (
        <ConfirmDelete kind="organizations" id={id} name={org.name} onClose={close}
          onDeleted={() => navigate("/organizations")} />
      )}
    </>
  );
}
