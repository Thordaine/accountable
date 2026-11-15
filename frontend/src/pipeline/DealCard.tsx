import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo } from "react";
import type { Deal } from "../api/types";
import { LateBadge } from "../components/Badge";
import { formatDate, formatMoney } from "../lib/format";
import { isLate } from "../lib/stages";

/** A deal's card face: name, organization, value and close date. Memoized: dragging re-renders every card. */
export const CardFace = memo(function CardFace({ deal, lifted }: { deal: Deal; lifted?: boolean }) {
  const late = isLate(deal, new Date());
  return (
    <div className={`card${late ? " is-late" : ""}${lifted ? " lifted" : ""}`}>
      <div className="card-name">{deal.name}</div>
      {deal.organization_name && <div className="card-org">{deal.organization_name}</div>}
      <div className="card-foot">
        <span className="mono">{formatMoney(deal.value)}</span>
        <span className={`mono card-date${late ? " late" : ""}`}>{formatDate(deal.close_date)}</span>
      </div>
      {late && <div className="card-late"><LateBadge /></div>}
    </div>
  );
});

/** A draggable card; a click opens the deal. */
export function DealCard({ deal, onOpen }: { deal: Deal; onOpen: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });
  return (
    <li ref={setNodeRef} className={`card-slot${isDragging ? " placeholder" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes} {...listeners}
      aria-label={deal.name}
      onClick={() => onOpen(deal.id)}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e);
        if (e.key === "Enter" && !e.defaultPrevented) onOpen(deal.id);
      }}>
      <CardFace deal={deal} />
    </li>
  );
}
