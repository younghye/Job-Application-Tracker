import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import type { JobApplication } from "../../types/job";
import { STATUS_OPTIONS } from "../../types/job";
import { NoteIcon } from "../../assets/Icons";
const columnHelper = createColumnHelper<JobApplication>();

export const Columns = (
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
      omitFromTable: true,
      omitFromExport: true,
    },
  }),
  columnHelper.accessor("date", {
    header: "Date",
    size: 100,
  }),
  columnHelper.accessor("jobTitle", {
    header: "Job Title",
    size: 190,
    cell: (info) => {
      const hasNote = !!info.row.original.note;
      return (
        <div className="flex items-center gap-2 group">
          <span className="truncate text-slate-700" title={info.getValue()}>
            {info.getValue()}
          </span>

          {hasNote && <NoteIcon title="Has notes" />}
        </div>
      );
    },
  }),
  columnHelper.accessor("company", {
    header: "Company",
    size: 160,
    meta: { truncate: true },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    size: 140,
    id: "status",
    cell: (info) => (
      <select
        value={info.getValue()}
        onChange={(e) =>
          handleStatusChange(info.row.original.id, e.target.value)
        }
        className="w-full px-2 py-1 text-sm border border-gray-200 rounded-md cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
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
    meta: { omitFromTable: true },
  }),
  columnHelper.accessor("interviews", {
    header: "Interviews",
    size: 200,
    cell: (info) => {
      const interviews = info.getValue() || [];
      if (interviews.length === 0) return;

      const sorted = [...interviews].sort((a, b) =>
        dayjs(a.date).diff(dayjs(b.date)),
      );

      // in the future or started within the last 20 minute
      const activeBuffer = dayjs().subtract(20, "minute");
      const next =
        sorted.find((i) => dayjs(i.date).isAfter(activeBuffer)) ||
        sorted[sorted.length - 1];

      const isActive = dayjs(next.date).isAfter(activeBuffer);
      const hoverText = `${next.type || "Interview"} • ${dayjs(next.date).format("MMM D, HH:mm")}`;

      return (
        <div className="flex items-center gap-2" title={hoverText}>
          <span
            className={` ${isActive ? "text-emerald-500" : "text-slate-700"}`}
          >
            {`${next.type || "Interview"} • ${dayjs(next.date).format("MMM D, HH:mm")}`}
          </span>

          {interviews.length > 1 && (
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded-md shrink-0">
              +{interviews.length - 1}
            </span>
          )}
        </div>
      );
    },
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
