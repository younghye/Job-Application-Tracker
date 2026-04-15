import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import type { JobApplication } from "../../types/job";
import { STATUS_OPTIONS } from "../../types/job";
import "../../assets/styles/table.css";

const columnHelper = createColumnHelper<JobApplication>();

export const getColumns = (
  handleStatusChange: (id: string, status: string) => void,
  handleDelete: (id: string) => void,
  openEditModal: (job: JobApplication) => void,
) => [
  columnHelper.accessor("id", {
    header: "ID",
    meta: {
      omitFromTable: true,
    },
  }),
  columnHelper.accessor("jobId", {
    header: "Job ID",
    size: 100,
    meta: {
      // omitFromTable: true,
      // omitFromExport: true,
    },
  }),
  columnHelper.accessor("date", {
    header: "Date",
    size: 100,
    cell: (info) => {
      const dateValue = info.getValue();
      if (!dateValue) return "";
      return dayjs(dateValue).format("DD-MM-YYYY");
    },
  }),
  columnHelper.accessor("jobTitle", {
    header: "Job Title",
    size: 160,
    meta: { truncate: true },
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("company", {
    header: "Company",
    size: 160,
    meta: { truncate: true },
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    size: 120,
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
  columnHelper.accessor("link", {
    header: "Link",
    size: 180,
    enableSorting: false,
    meta: { truncate: true },

    cell: (info) => (
      <a
        href={info.getValue()}
        target="_blank"
        rel="noreferrer"
        title={info.getValue()}
      >
        {info.getValue()}
      </a>
    ),
  }),
  columnHelper.accessor("note", {
    header: "Note",
    size: 210,
    enableSorting: false,
    meta: { truncate: true },
    cell: (info) => info.getValue(),
  }),
  columnHelper.display({
    id: "actions",
    header: "Action",
    size: 80,
    cell: (info) => (
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={() => openEditModal(info.row.original)}
          className="edit-btn"
          title="Edit"
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
];
