import {
  type ColumnDef,
  columnFilteringFeature,
  createFilteredRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { type ReactNode, useMemo, useState } from "react";
import { useWindowRows } from "./useWindowRows";

/** A column: its shown text drives search; sort and cell are optional overrides. */
export type Col<T> = {
  id: string;
  header: string;
  text: (row: T) => string;
  sort?: (row: T) => string | number;
  cell?: (row: T) => ReactNode;
  className?: string;
};

type Props<T> = {
  columns: Col<T>[];
  rows: T[];
  defaultSort: string;
  noun: string;
  searchPlaceholder?: string;
  actions?: (row: T) => ReactNode;
  toolbar?: ReactNode;
};

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
});

const collator = new Intl.Collator("en", {
  sensitivity: "base",
  numeric: true,
});

function compare(a: unknown, b: unknown) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return collator.compare(String(a), String(b));
}

/** A searchable, sortable table with a count line and an empty state. */
export function DataTable<T extends { id: number }>(props: Props<T>) {
  const {
    columns,
    rows,
    defaultSort,
    noun,
    searchPlaceholder,
    actions,
    toolbar,
  } = props;
  const [search, setSearch] = useState("");

  const defs = useMemo(
    () =>
      columns.map((c): ColumnDef<typeof features, T> => ({
        id: c.id,
        header: c.header,
        accessorFn: c.sort ?? c.text,
        sortFn: (a, b, id) => compare(a.getValue(id), b.getValue(id)),
        sortDescFirst: false,
      })),
    [columns],
  );
  const byId = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns]);

  const table = useTable({
    features,
    columns: defs,
    data: rows,
    getRowId: (row) => String(row.id),
    initialState: { sorting: [{ id: defaultSort, desc: false }] },
    enableSortingRemoval: false,
    state: { globalFilter: search },
    onGlobalFilterChange: setSearch,
    getColumnCanGlobalFilter: () => true,
    globalFilterFn: (row, columnId, value: string) =>
      byId
        .get(columnId)!
        .text(row.original)
        .toLowerCase()
        .includes(value.toLowerCase()),
  });

  const shown = table.getRowModel().rows;
  const { bodyRef, measure, visible, padTop, padBottom } = useWindowRows(shown);
  const span = columns.length + (actions ? 1 : 0);
  return (
    <section className="panel table-panel">
      <div className="table-tools">
        <input
          type="search"
          className="search"
          placeholder={searchPlaceholder ?? `Search ${noun}`}
          aria-label={`Search ${noun}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {toolbar}
      </div>
      <table className="data">
        <thead>
          <tr>
            {table.getFlatHeaders().map((header) => {
              const sorted = header.column.getIsSorted();
              return (
                <th
                  key={header.id}
                  className={byId.get(header.id)!.className}
                  aria-sort={
                    sorted
                      ? sorted === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  <button
                    type="button"
                    className="sort"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {byId.get(header.id)!.header}
                    <span className="arrow">
                      {sorted === "asc" ? "↑" : sorted === "desc" ? "↓" : ""}
                    </span>
                  </button>
                </th>
              );
            })}
            {actions && <th aria-label="Actions" />}
          </tr>
        </thead>
        <tbody ref={bodyRef}>
          {padTop > 0 && (
            <tr aria-hidden="true">
              <td
                colSpan={span}
                style={{ height: padTop, padding: 0, border: 0 }}
              />
            </tr>
          )}
          {visible.map(({ row, index }) => (
            <tr key={row.id} ref={measure} data-index={index}>
              {columns.map((c) => (
                <td key={c.id} className={c.className}>
                  {c.cell ? c.cell(row.original) : c.text(row.original)}
                </td>
              ))}
              {actions && (
                <td className="row-actions">{actions(row.original)}</td>
              )}
            </tr>
          ))}
          {padBottom > 0 && (
            <tr aria-hidden="true">
              <td
                colSpan={span}
                style={{ height: padBottom, padding: 0, border: 0 }}
              />
            </tr>
          )}
        </tbody>
      </table>
      {shown.length === 0 && (
        <div className="empty">
          {search ? (
            <>
              <p>
                No {noun} match “{search}”.
              </p>
              <button
                type="button"
                className="btn quiet"
                onClick={() => setSearch("")}
              >
                Clear search
              </button>
            </>
          ) : (
            <p>No {noun} yet.</p>
          )}
        </div>
      )}
      <p className="count">
        {shown.length} of {rows.length} {noun}
      </p>
    </section>
  );
}
