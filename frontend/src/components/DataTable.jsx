import { useMemo } from "react";
import { useUrlParams } from "../utils/useUrlParams.js";

const PAGE_SIZE = 25;

// Buttons-only columns: full width at the bottom of a phone card, not offered for sorting there.
function isActionColumn(c) {
  return c.action === true || ["action", "actions", "open"].includes(c.key);
}

function compare(a, b) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).toLowerCase().localeCompare(String(b).toLowerCase(), undefined, { numeric: true });
}

/**
 * Table with search, click-to-sort headers and pagination (25 per page).
 *
 * columns: [{ key, label, value(row) -> string|number used for sorting, render?(row) }]
 * searchText(row) -> the text the search box matches against.
 * Search, sort and paging run in the browser on the loaded rows.
 */
export default function DataTable({
  columns,
  rows,
  rowKey,
  searchText,
  searchPlaceholder,
  emptyMessage,
  initialSort,
  pageSize = PAGE_SIZE,
}) {
  // Search, sort and page live in the address, so they survive a refresh and Back from a detail page.
  const [params, update] = useUrlParams();
  const defaultSort = initialSort || { key: columns[0].key, dir: "asc" };
  const query = params.get("q") ?? "";
  const sort = { key: params.get("sort") ?? defaultSort.key, dir: params.get("dir") ?? defaultSort.dir };
  const page = Number(params.get("page")) || 1;
  const setPage = (n) => update({ page: n > 1 ? n : null });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matching = q ? rows.filter((row) => searchText(row).toLowerCase().includes(q)) : rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column) return matching;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...matching].sort((a, b) => compare(column.value(a), column.value(b)) * factor);
  }, [rows, query, sort, columns, searchText]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  function toggleSort(key) {
    const next = sort.key === key ? { key, dir: sort.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" };
    update({ sort: next.key, dir: next.dir, page: null });
  }

  if (rows.length === 0) return <div className="ic-empty">{emptyMessage}</div>;

  const sortable = columns.filter((c) => !isActionColumn(c));

  return (
    <>
      <div className="ic-table-tools">
        <input
          type="search"
          className="form-input ic-search"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => update({ q: e.target.value, page: null })}
          aria-label={searchPlaceholder}
        />
        {/* Phones show rows as cards without column headers, so sorting moves to this menu. */}
        <select
          className="form-select ic-sort-select"
          aria-label="Sort by"
          value={`${sort.key}:${sort.dir}`}
          onChange={(e) => {
            const [key, dir] = e.target.value.split(":");
            update({ sort: key, dir, page: null });
          }}
        >
          {sortable.flatMap((c) => [
            <option key={`${c.key}:asc`} value={`${c.key}:asc`}>Sort: {c.label} ▲</option>,
            <option key={`${c.key}:desc`} value={`${c.key}:desc`}>Sort: {c.label} ▼</option>,
          ])}
        </select>
      </div>

      <div className="ic-table-wrap">
        <table className="ic-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>
                  <button type="button" className="ic-sort" onClick={() => toggleSort(c.key)}>
                    {c.label}
                    {sort.key === c.key ? (sort.dir === "asc" ? " ▲" : " ▼") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="ic-table__empty">
                  Nothing matches your search.
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={rowKey(row)}>
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      data-label={c.label}
                      className={isActionColumn(c) ? "ic-td--action" : c === columns[0] ? "ic-td--first" : undefined}
                    >
                      {c.render ? c.render(row) : c.value(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="ic-pager">
          <span>
            Showing {start + 1}–{start + visible.length} of {filtered.length}
          </span>
          <div className="ic-pager__buttons">
            <button type="button" className="btn btn--sm btn--ghost" disabled={current === 1} onClick={() => setPage(current - 1)}>
              Previous
            </button>
            <span>
              Page {current} of {pageCount}
            </span>
            <button type="button" className="btn btn--sm btn--ghost" disabled={current === pageCount} onClick={() => setPage(current + 1)}>
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}
