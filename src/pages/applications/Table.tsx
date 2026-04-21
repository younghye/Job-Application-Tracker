import { flexRender } from "@tanstack/react-table";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import type { JobApplication } from "../../types/job";

interface TableProps {
  data: JobApplication[];
  columns: any[];
  globalFilter: string;
  statusFilter: string;
}

const Table = ({ data, columns, globalFilter, statusFilter }: TableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const lastCount = useRef(data.length);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      globalFilter,
      columnFilters: useMemo(
        () => (statusFilter ? [{ id: "status", value: statusFilter }] : []),
        [statusFilter],
      ),
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: true, // This automatically handles "Add" and "Filter" by resetting to Page 1.
    enableColumnFilters: true,
    enableGlobalFilter: true,
  });

  useEffect(() => {
    const isDeletion = data.length < lastCount.current;
    const isUpdate = data.length === lastCount.current;

    const pageIndex = table.getState().pagination.pageIndex;

    //  If we are UPDATING or DELETING, we "undo" the auto-reset to Page 1
    if (isUpdate || isDeletion) {
      const rowCountOnPage = table.getRowModel().rows.length;

      // If deleting the last item on a page, go back. Otherwise, stay at current index.
      const targetIndex =
        isDeletion && rowCountOnPage === 0 && pageIndex > 0
          ? pageIndex - 1
          : pageIndex;

      table.setPageIndex(targetIndex);
    }

    lastCount.current = data.length;
  }, [data]);

  return (
    <div className="w-full flex-1 flex flex-col rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex-1 overflow-auto min-h-0">
      <table className="w-full border-collapse table-fixed bg-white min-w-[1020px]">
        <thead className="sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-slate-500 ">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="px-4 py-3 text-left text-sm font-semibold text-slate-100 cursor-pointer hover:bg-slate-600 transition-colors border-r border-slate-700"
                  style={{ width: `${header.column.getSize()}px` }}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    <span className="text-[10px]">
                      {header.column.getIsSorted() === "asc" && " ▲"}
                      {header.column.getIsSorted() === "desc" && " ▼"}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody className="divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => {
            const isRejected = row.original.status === "Rejected";

            return (
              <tr
                key={row.id}
                className={`
                    transition-colors 
                  ${isRejected ? "bg-gray-300 opacity-60" : "bg-white hover:bg-gray-50"}
                  `}
              >
                {row.getVisibleCells().map((cell) => {
                  const isTruncated = (cell.column.columnDef.meta as any)
                    ?.truncate;

                  return (
                    <td
                      key={cell.id}
                      style={{ width: `${cell.column.getSize()}px` }}
                      className={`
                          px-4 py-2.5 text-sm text-gray-700 border-r border-gray-100 last:border-r-0 whitespace-nowrap
                          ${isTruncated ? "truncate" : ""}
                        `}
                      title={
                        isTruncated ? String(cell.getValue() ?? "") : undefined
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {/* PAGINATION CONTROLS */}
      <div className="flex-none flex items-center justify-between p-3 bg-gray-50 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Showing{" "}
          <span className="font-bold text-gray-900">
            {table.getRowModel().rows.length}
          </span>{" "}
          of{" "}
          <span className="font-bold text-gray-900">{table.getRowCount()}</span>{" "}
          Rows
        </div>

        <div className="flex items-center gap-6">
          <div className="text-xs text-gray-500">
            Page{" "}
            <span className="font-bold text-gray-900">
              {table.getState().pagination.pageIndex + 1}
            </span>{" "}
            of{" "}
            <span className="font-bold text-gray-900">
              {table.getPageCount()}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <PaginationButton
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              label="<<"
            />
            <PaginationButton
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              label="<"
            />
            <PaginationButton
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              label=">"
            />
            <PaginationButton
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              label=">>"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const PaginationButton = ({ onClick, disabled, label }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="px-2 py-1 text-xs font-bold bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
  >
    {label}
  </button>
);

export default Table;
