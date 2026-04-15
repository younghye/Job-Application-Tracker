import { flexRender } from "@tanstack/react-table";
import { useState } from "react";
import {
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import type { JobApplication } from "../../types/job";

const Table = ({
  data,
  columns,
}: {
  data: JobApplication[];
  columns: any[];
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 12,
  });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
  });

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-[950px] w-full border-collapse table-fixed bg-white">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-gray-900">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="px-4 py-3 text-left text-sm font-semibold text-white cursor-pointer hover:bg-gray-800 transition-colors border-r border-gray-700 last:border-r-0"
                  style={{ width: `${header.getSize()}px` }}
                >
                  <div className="flex items-center gap-1">
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
                        px-4 py-2.5 text-sm text-gray-700 border-r border-gray-100 last:border-r-0
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

      {/* PAGINATION CONTROLS */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-t border-gray-200">
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
            <span className="text-gray-900">
              {table.getState().pagination.pageIndex + 1}
            </span>{" "}
            of {table.getPageCount()}
          </div>

          <div className="flex items-center gap-1">
            <PaginationButton
              onClick={() => table.firstPage()}
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
              onClick={() => table.lastPage()}
              disabled={!table.getCanNextPage()}
              label=">>"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal sub-component for pagination buttons to keep it DRY
const PaginationButton = ({ onClick, disabled, label }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="px-3 py-1 text-xs font-bold bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
  >
    {label}
  </button>
);

export default Table;
