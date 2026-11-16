import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useLayoutEffect, useRef, useState } from "react";

/** Lists longer than this render only the rows near the screen. */
export const VIRTUAL_FROM = 150;

/**
 * The rows to render for a long table scrolled by the window: the ones on screen plus a margin,
 * with the space above and below them. Short lists render every row.
 */
export function useWindowRows<T>(rows: T[]) {
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const [offset, setOffset] = useState(0);
  const enabled = rows.length > VIRTUAL_FROM;
  useLayoutEffect(() => {
    setOffset(bodyRef.current!.getBoundingClientRect().top + window.scrollY);
  }, [enabled]);

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 46,
    overscan: 12,
    scrollMargin: offset,
    enabled,
  });
  if (!enabled)
    return {
      bodyRef,
      visible: rows.map((row, index) => ({ row, index })),
      padTop: 0,
      padBottom: 0,
    };

  const items = virtualizer.getVirtualItems();
  return {
    bodyRef,
    measure: virtualizer.measureElement,
    visible: items.map((item) => ({
      row: rows[item.index],
      index: item.index,
    })),
    padTop: items.length ? items[0].start - offset : 0,
    padBottom: items.length
      ? virtualizer.getTotalSize() - items.at(-1)!.end
      : 0,
  };
}
