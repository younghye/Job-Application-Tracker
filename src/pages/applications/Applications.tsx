import { useState, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import type { JobApplication } from "../../types/job";
import Table from "./Table";
import EditModal from "./EditModal";
import { Columns } from "./Columns";
import { exportCSV, importCSV } from "./CsvService";
import { useApplications } from "../../hooks/useApplications";
import { STATUS_OPTIONS } from "../../types/job";
import {
  inputClass,
  labelClass,
  selectArrow,
} from "../../assets/styles/styles";
import {
  SearchIcon,
  ExportIcon,
  ImportIcon,
  XIcon,
  TrashIcon,
} from "../../assets/styles/Icons";

const BTN_STYLE = {
  blue: "px-3 py-1.5 text-sm font-bold border border-blue-200 text-blue-600 rounded-md flex items-center gap-1.5 transition-all active:scale-95 duration-200 hover:bg-blue-50 bg-white shadow-sm",
  red: "px-3 py-1.5 text-sm font-bold border border-red-100 text-red-600 rounded-md flex items-center gap-1.5 transition-all active:scale-95 duration-200 hover:bg-red-50 bg-white shadow-sm",
};

const setToast = (
  promise: Promise<any>,
  successMsg: string,
  errorMsg: string,
) => {
  toast.promise(promise, {
    loading: "Loading...",
    success: successMsg,
    error: errorMsg,
  });
};

const Applications = () => {
  const [editData, setEditData] = useState<JobApplication | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create a ref that always points to the most recent data
  const data = useApplications();
  const dataRef = useRef(data);
  dataRef.current = data;

  const handleStatusChange = async (id: string, newStatus: string) => {
    const updatedData = dataRef.current.map((job) =>
      job.id === id ? { ...job, status: newStatus } : job,
    );
    const promise = chrome.storage.local.set({ applicationList: updatedData });
    setToast(promise, "Status updated!", "Failed to update status.");
  };

  const handleEdit = async (job: JobApplication) => {
    const updated = dataRef.current.map((item) =>
      item.id === job.id ? job : item,
    );
    const promise = chrome.storage.local.set({ applicationList: updated });
    setToast(promise, "Application updated!", "Failed to update application.");
    setEditData(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this application?")) return;

    const filtered = dataRef.current.filter((job) => job.id !== id);
    const promise = chrome.storage.local.set({ applicationList: filtered });
    setToast(promise, "Application deleted!", "Failed to delete application.");
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL applications? This cannot be undone."))
      return;

    const promise = chrome.storage.local.clear();
    setToast(
      promise,
      "All applications cleared!",
      "Failed to clear applications.",
    );
  };

  const handleExportCSV = () => {
    if (dataRef.current.length === 0) {
      toast.error("No applications to export.");
      return;
    }

    const promise = exportCSV({
      data: dataRef.current,
      columns: columns.filter((col) => !(col.meta as any)?.omitFromExport),
    });
    setToast(promise, "CSV exported!", "Failed to generate CSV export.");
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const importData = importCSV(e, dataRef.current, columns);

    toast.promise(importData, {
      loading: "Loading...",
      success: (result) => {
        if (fileInputRef.current) fileInputRef.current.value = "";

        if (result.count === 0) {
          return "No new applications found to import.";
        }

        chrome.storage.local.set({ applicationList: result.data });

        return (
          <span>
            Imported <b>{result.count}</b> job applications.
          </span>
        );
      },
      error: "Failed to parse CSV file.",
    });
  };

  const columns = useMemo(
    () => Columns(handleStatusChange, handleDelete, (job) => setEditData(job)),
    [],
  );

  return (
    <div className="h-full flex flex-col gap-4">
      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative w-full sm:w-64 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search all columns..."
              className={`${inputClass} pl-9 pr-4`}
            />
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="status-filter" className={labelClass}>
              Status
            </label>

            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${inputClass} ${selectArrow}`}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {(globalFilter || statusFilter) && (
            <button
              onClick={() => {
                setGlobalFilter("");
                setStatusFilter("");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
            >
              <XIcon />
              Clear Filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className={BTN_STYLE.blue}>
            <ExportIcon />
            Export
          </button>

          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleImportCSV}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className={BTN_STYLE.blue}
          >
            <ImportIcon />
            Import
          </button>

          <button onClick={handleClearAll} className={BTN_STYLE.red}>
            <TrashIcon />
            Clear All
          </button>
        </div>
      </div>

      {/* TABLE AREA */}
      <div className="flex-1 min-h-0 flex flex-col gap-8">
        {dataRef.current && dataRef.current.length > 0 ? (
          <Table
            data={dataRef.current}
            columns={columns.filter((col) => !(col.meta as any)?.omitFromTable)}
            globalFilter={globalFilter}
            statusFilter={statusFilter}
          />
        ) : (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-100 rounded-[24px]">
            <p className="text-gray-400 font-medium text-lg">
              No application data yet.
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editData && (
        <EditModal
          job={editData}
          onClose={() => setEditData(null)}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
};

export default Applications;
