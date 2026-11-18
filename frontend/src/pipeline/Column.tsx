import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Deal } from "../api/types";
import { formatMoneyShort } from "../lib/format";
import {
  expectedRevenue,
  STAGE_COLOR,
  STAGE_TEXT,
  type Stage,
} from "../lib/stages";
import { DealCard } from "./DealCard";

type Props = {
  stage: Stage;
  deals: Deal[];
  limit: number;
  onShowMore: (stage: Stage) => void;
  onAdd: (stage: Stage) => void;
  onOpen: (id: number) => void;
};

/** One stage: header with its figures for all its deals, Add, and its first `limit` sortable cards. */
export function Column({
  stage,
  deals,
  limit,
  onShowMore,
  onAdd,
  onOpen,
}: Props) {
  const { setNodeRef } = useDroppable({ id: stage });
  const value = deals.reduce((sum, d) => sum + d.value, 0);
  const expected = deals.reduce((sum, d) => sum + expectedRevenue(d), 0);
  const shown = deals.slice(0, limit);
  const hidden = deals.length - shown.length;
  return (
    <section className="column" aria-label={stage}>
      <header
        className="column-head"
        style={{
          background: STAGE_COLOR[stage],
          color: STAGE_TEXT[stage],
        }}
      >
        <div className="column-title">
          <span>{stage}</span>
          <span className="column-count" data-testid="count">
            {deals.length}
          </span>
        </div>
        <div className="column-figures mono">
          <span data-testid="value">{formatMoneyShort(value)}</span>
          <span data-testid="expected">
            {formatMoneyShort(expected)} expected
          </span>
        </div>
      </header>
      <button
        type="button"
        className="column-add"
        onClick={() => onAdd(stage)}
        aria-label={`Add deal to ${stage}`}
      >
        + Add
      </button>
      <SortableContext
        id={stage}
        items={shown.map((d) => d.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul ref={setNodeRef} className="cards">
          {shown.map((d) => (
            <DealCard key={d.id} deal={d} onOpen={onOpen} />
          ))}
        </ul>
      </SortableContext>
      {hidden > 0 && (
        <button
          type="button"
          className="column-more"
          onClick={() => onShowMore(stage)}
        >
          Show {hidden} more
        </button>
      )}
    </section>
  );
}
