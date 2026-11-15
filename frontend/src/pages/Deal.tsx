import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { useMoveDeal, useRecord } from "../api/queries";
import { LateBadge, StageBadge } from "../components/Badge";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { NotFound } from "../components/NotFound";
import { MaybeLink } from "../components/RowActions";
import { Timeline } from "../components/Timeline";
import { DealForm } from "../forms/DealForm";
import { LogActivity } from "../forms/ActivityForm";
import { formatMoney } from "../lib/format";
import { expectedRevenue, isLate, STAGES, type Stage } from "../lib/stages";
import { CloseDate } from "./Deals";
import { Details, Panel, RecordTitle } from "./RecordPage";

/** A deal's details, stage selector and timeline. */
export function Deal() {
  const id = Number(useParams().id);
  const { data: deal, isError } = useRecord("deals", id);
  const move = useMoveDeal();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  if (isError) return <NotFound noun="Deal" to="/deals" section="Deals" />;
  if (!deal) return null;

  function changeStage(stage: Stage) {
    move.mutate({ id, stage, index: 0 }, { onSuccess: () => toast(`Moved to ${stage}`) });
  }

  const late = isLate(deal, new Date());
  return (
    <>
      <RecordTitle name={deal.name} onEdit={() => setEditing(true)} onDelete={() => setDeleting(true)}
        badges={<>{<StageBadge stage={deal.stage} />}{late && <LateBadge />}</>} />
      <div className="record-grid">
        <Panel title="Details" sub={late ? <span className="late">This deal is past its close date.</span> : undefined}>
          <label className="field stage-select">
            <span className="field-label">Stage</span>
            <select value={deal.stage} onChange={(e) => changeStage(e.target.value as Stage)} disabled={move.isPending}>
              {STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <Details items={[
            ["Value", <span className="mono">{formatMoney(deal.value)}</span>],
            ["Probability", <span className="mono">{deal.probability}%</span>],
            ["Expected revenue", <span className="mono">{formatMoney(expectedRevenue(deal))}</span>],
            ["Close date", <CloseDate deal={deal} />],
            ["Organization", <MaybeLink to={`/organizations/${deal.organization_id}`} name={deal.organization_name} />],
            ["Main contact", <MaybeLink to={`/contacts/${deal.contact_id}`} name={deal.contact_name} />],
          ]} />
        </Panel>
        <Panel title="Timeline" sub="Newest first">
          <LogActivity dealId={id} />
          <Timeline entries={deal.timeline} />
        </Panel>
      </div>
      {editing && <DealForm initial={deal} onDone={() => setEditing(false)} />}
      {deleting && (
        <ConfirmDelete kind="deals" id={id} name={deal.name} onClose={() => setDeleting(false)}
          onDeleted={() => navigate("/deals")} />
      )}
    </>
  );
}
