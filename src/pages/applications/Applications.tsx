import { useState, useMemo, useRef } from "react";
import type { JobApplication } from "../../types/job";
import Table from "./Table";
import EditModal from "./EditModal";
import { getColumns } from "./Columns";
import { exportCSV, importCSV } from "./CsvService";
import { useApplications } from "../../hooks/useApplications";
import toast from "react-hot-toast";

const BTN_STYLE = {
  blue: "px-3 py-1.5 text-xs font-medium border border-blue-300 text-blue-600 rounded flex items-center gap-1.5 transition-all active:scale-95 duration-200 hover:bg-blue-50",
  red: "px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded flex items-center gap-1.5 transition-all active:scale-95 duration-200 hover:bg-red-50",
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const data = useApplications();

  const handleStatusChange = async (id: string, newStatus: string) => {
    const updatedData = data.map((job) =>
      job.id === id ? { ...job, status: newStatus } : job,
    );
    const promise = chrome.storage.local.set({ applicationList: updatedData });
    setToast(promise, "Status updated!", "Failed to update status.");
  };

  const handleEdit = async (job: JobApplication) => {
    const updated = data.map((item) => (item.id === job.id ? job : item));
    const promise = chrome.storage.local.set({ applicationList: updated });
    setToast(promise, "Application updated!", "Failed to update application.");
    setEditData(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this application?")) return;

    const filtered = data.filter((job) => job.id !== id);
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
    if (data.length === 0) {
      toast.error("No applications to export.");
      return;
    }

    const promise = exportCSV({
      data,
      columns: columns.filter((col) => !(col.meta as any)?.omitFromExport),
    });
    setToast(promise, "CSV exported!", "Failed to generate CSV export.");
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const importData = importCSV(e, data, columns);

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
    () =>
      getColumns(handleStatusChange, handleDelete, (job) => setEditData(job)),
    [data],
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-end gap-2 mb-6 shrink-0">
        <button onClick={handleExportCSV} className={BTN_STYLE.blue}>
          <span>📥</span> Export CSV
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
          <span>📤</span> Import CSV
        </button>

        <button onClick={handleClearAll} className={BTN_STYLE.red}>
          <span>🗑️</span> Clear All
        </button>
      </div>

      <div className="flex-1 min-h-0">
        {data && data.length > 0 ? (
          <Table
            data={data}
            columns={columns.filter((col) => !(col.meta as any)?.omitFromTable)}
          />
        ) : (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl">
            <p className="text-gray-400 font-medium text-lg">
              No application data yet.
            </p>
          </div>
        )}
      </div>

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
