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
import "../../assets/styles/table.css";

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
    pageSize: 10,
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
    <div className="table-wrapper">
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ width: `${header.getSize()}px` }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                  {header.column.getIsSorted() === "asc" && " ▲"}
                  {header.column.getIsSorted() === "desc" && " ▼"}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              // style={{
              //   backgroundColor: row.index % 2 === 0 ? "#fff" : "#f9f9f9",
              // }}
              style={{
                backgroundColor:
                  row.original.status === "Rejected" ? "#949292" : "white",
              }}
            >
              {row.getVisibleCells().map((cell) => {
                const isTruncated = (cell.column.columnDef.meta as any)
                  ?.truncate;

                return (
                  <td
                    key={cell.id}
                    style={{ width: `${cell.column.getSize()}px` }}
                    className="truncate-text"
                    title={
                      isTruncated ? String(cell.getValue() ?? "") : undefined
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Showing{" "}
          <strong>{table.getRowModel().rows.length.toLocaleString()}</strong> of{" "}
          <strong>{table.getRowCount().toLocaleString()}</strong> Rows
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 mr-4 text-sm">
            <div>Page</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount().toLocaleString()}
            </strong>
          </span>

          <div className="flex gap-1">
            <button
              className="px-2 py-1 disabled:opacity-30"
              onClick={() => table.firstPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <strong>{"<<"}</strong>
            </button>
            <button
              className="px-2 py-1 disabled:opacity-30"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <strong>{"<"}</strong>
            </button>
            <button
              className="px-2 py-1 disabled:opacity-30"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <strong>{">"}</strong>
            </button>
            <button
              className="px-2 py-1 disabled:opacity-30"
              onClick={() => table.lastPage()}
              disabled={!table.getCanNextPage()}
            >
              <strong>{">>"}</strong>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Table;
