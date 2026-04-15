import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import type { JobApplication } from "../../types/job";
import { STATUS_OPTIONS } from "../../types/job";

const columnHelper = createColumnHelper<JobApplication>();

export const getColumns = (
  handleStatusChange: (id: string, status: string) => void,
  handleDelete: (id: string) => void,
  openEditModal: (job: JobApplication) => void,
) => [
  columnHelper.accessor("id", {
    header: "ID",
    meta: { omitFromTable: true },
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
      return dateValue ? dayjs(dateValue).format("DD-MM-YYYY") : "";
    },
  }),
  columnHelper.accessor("jobTitle", {
    header: "Job Title",
    size: 160,
    meta: { truncate: true },
  }),
  columnHelper.accessor("company", {
    header: "Company",
    size: 160,
    meta: { truncate: true },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    size: 130,
    cell: (info) => (
      <select
        value={info.getValue()}
        onChange={(e) =>
          handleStatusChange(info.row.original.id, e.target.value)
        }
        className="w-full px-2 py-1 text-xs border border-gray-200 rounded-md bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
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
        className="text-blue-600 hover:underline transition-all"
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
  }),
  columnHelper.display({
    id: "actions",
    header: "Action",
    size: 80,
    cell: (info) => (
      <div className="flex items-center gap-3">
        <button
          onClick={() => openEditModal(info.row.original)}
          className="hover:scale-125 transition-transform duration-100"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => handleDelete(info.row.original.id)}
          className="hover:scale-125 transition-transform duration-100 grayscale hover:grayscale-0"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    ),
  }),
];
