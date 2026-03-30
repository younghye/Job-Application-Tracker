import React, { useEffect, useState, useMemo } from "react";
import "./index.css";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  type SortingState,
} from "@tanstack/react-table";
import type { JobApplication } from "./types/job";

const STATUS_OPTIONS = [
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
  "Ghosted",
];

const Dashboard: React.FC = () => {
  const [data, setData] = useState<JobApplication[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  // 2. Load Data from Chrome Storage
  useEffect(() => {
    chrome.storage.local.get("applicationList", (result) => {
      const list = result.applicationList as JobApplication[];

      if (list) {
        setData(list);
      }
    });
  }, []);

  // 3. Update Status Logic
  const handleStatusChange = async (id: string, newStatus: string) => {
    const updatedData = data.map((job) =>
      job.id === id ? { ...job, status: newStatus } : job,
    );
    setData(updatedData);
    await chrome.storage.local.set({ applicationList: updatedData });
  };

  // 4. Delete Logic
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this entry?")) return;
    const filtered = data.filter((job) => job.id !== id);
    setData(filtered);
    await chrome.storage.local.set({ jobList: filtered });
  };

  // 5. Column Definitions
  const columnHelper = createColumnHelper<JobApplication>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("date", {
        header: "Date",
        size: 100,
        minSize: 100,
      }),
      columnHelper.accessor("jobTitle", {
        header: "Job Title",
        size: 160,
        minSize: 160,
        cell: (info) => <div title={info.getValue()}>{info.getValue()}</div>,
      }),
      columnHelper.accessor("company", {
        header: "Company",
        size: 160,
        minSize: 160,
        cell: (info) => <div title={info.getValue()}>{info.getValue()}</div>,
      }),
      columnHelper.accessor("status", {
        header: "Status",
        size: 110,
        minSize: 110,

        cell: (info) => (
          <select
            value={info.getValue()}
            onChange={(e) =>
              handleStatusChange(info.row.original.id, e.target.value)
            }
            className="status-select"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ),
      }),
      columnHelper.accessor("url", {
        header: "Link",
        size: 180,
        minSize: 180,
        enableSorting: false,
        cell: (info) => (
          <div title={info.getValue()}>
            <a
              href={info.getValue()}
              target="_blank"
              rel="noreferrer"
              title={info.getValue()}
            >
              {info.getValue()}
            </a>
          </div>
        ),
      }),
      columnHelper.accessor("note", {
        header: "Note",
        size: 180,
        minSize: 180,
        enableSorting: false,
        cell: (info) => <div title={info.getValue()}>{info.getValue()}</div>,
      }),
      columnHelper.display({
        id: "actions",
        header: "Action",
        size: 80,
        minSize: 80,
        enableSorting: false,
        cell: (info) => (
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              //   onClick={() => handleEdit(info.row.original)}
              className="edit-btn"
              title="Edit Application"
            >
              ✏️
            </button>
            <button
              onClick={() => handleDelete(info.row.original.id)}
              className="delete-btn"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        ),
      }),
    ],
    [data],
  );

  // 6. Initialize Table Instance
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>🚀 Job Application Dashboard</h1>
      </header>

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
                    {header.column.getIsSorted() ? (
                      header.column.getIsSorted() === "asc" ? (
                        <span> ▲</span>
                      ) : (
                        <span> ▼</span>
                      )
                    ) : null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{ width: `${cell.column.getSize()}px` }}
                    // className="truncate-text"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
