import {
  closestCorners, DndContext, type DragEndEvent, type DragOverEvent, DragOverlay, type DragStartEvent,
  KeyboardSensor, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useMoveDeal } from "../api/queries";
import type { Deal } from "../api/types";
import { STAGES, type Stage } from "../lib/stages";
import { columnsFrom } from "./boardMath";
import { Column } from "./Column";
import { CardFace } from "./DealCard";

type Order = Record<Stage, number[]>;

const isStage = (id: unknown): id is Stage => STAGES.includes(id as Stage);

/** Cards shown per column at first: dragging cost grows with every card on the board. */
export const CARDS_SHOWN = 40;

/** The six columns with drag and drop; a drop saves the card's stage and place. */
export function Board({ deals, onAdd }: { deals: Deal[]; onAdd: (stage: Stage) => void }) {
  const columns = useMemo(() => columnsFrom(deals), [deals]);
  const byId = useMemo(() => new Map(deals.map((d) => [d.id, d])), [deals]);
  const [order, setOrder] = useState<Order | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [limits, setLimits] = useState(() => Object.fromEntries(STAGES.map((s) => [s, CARDS_SHOWN])) as Record<Stage, number>);
  const justDragged = useRef(false);
  const move = useMoveDeal();
  const navigate = useNavigate();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // The cache changed (the optimistic move landed, or a refetch): show it instead of the drag order.
  useEffect(() => setOrder(null), [deals]);

  const current: Order = order ?? (Object.fromEntries(STAGES.map((s) => [s, columns[s].map((d) => d.id)])) as Order);
  const stageOf = (id: unknown) => (isStage(id) ? id : STAGES.find((s) => current[s].includes(id as number))!);

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as number);
    setOrder(current);
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const from = stageOf(active.id);
    const to = stageOf(over.id);
    if (from === to) return;
    const target = current[to];
    const index = isStage(over.id) ? Math.min(target.length, limits[to] - 1) : target.indexOf(over.id as number);
    setOrder({
      ...current,
      [from]: current[from].filter((id) => id !== active.id),
      [to]: target.toSpliced(index, 0, active.id as number),
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false), 0);
    if (!over) return setOrder(null);
    const id = active.id as number;
    const stage = stageOf(id);
    const ids = current[stage];
    const overIndex = isStage(over.id) ? ids.indexOf(id) : ids.indexOf(over.id as number);
    const index = arrayMove(ids, ids.indexOf(id), overIndex).indexOf(id);
    const card = byId.get(id)!;
    if (stage === card.stage && index === columns[stage].findIndex((d) => d.id === id)) return setOrder(null);
    move.mutate({ id, stage, index });
  }

  function open(id: number) {
    if (!justDragged.current) navigate(`/deals/${id}`);
  }

  const active = activeId === null ? null : byId.get(activeId)!;
  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners}
      onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}
      onDragCancel={() => { setActiveId(null); setOrder(null); }}>
      <div className="board">
        {STAGES.map((stage) => (
          <Column key={stage} stage={stage} deals={current[stage].map((id) => byId.get(id)!)} limit={limits[stage]}
            onShowMore={(s) => setLimits((l) => ({ ...l, [s]: l[s] + CARDS_SHOWN }))} onAdd={onAdd} onOpen={open} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>{active && <CardFace deal={active} lifted />}</DragOverlay>
    </DndContext>
  );
}
