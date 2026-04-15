import { useState, useMemo, useRef } from "react";
import type { JobApplication } from "../../types/job";
import Table from "./Table";
import EditModal from "./EditModal";
import { getColumns } from "./Columns";
import { exportCSV, importCSV } from "./CsvService";
import { useApplications } from "../../hooks/useApplications";

const BTN_STYLE = {
  gray: "px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 rounded flex items-center gap-1.5 transition-all active:scale-95 duration-200 hover:bg-gray-50",
  red: "px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded flex items-center gap-1.5 transition-all active:scale-95 duration-200 hover:bg-red-50",
};

const Applications = () => {
  const [editData, setEditData] = useState<JobApplication | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const data = useApplications();

  const handleStatusChange = async (id: string, newStatus: string) => {
    const updatedData = data.map((job) =>
      job.id === id ? { ...job, status: newStatus } : job,
    );
    await chrome.storage.local.set({ applicationList: updatedData });
  };

  const handleEdit = async (job: JobApplication) => {
    const updated = data.map((item) => (item.id === job.id ? job : item));
    await chrome.storage.local.set({ applicationList: updated });
    setEditData(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this entry?")) return;
    const filtered = data.filter((job) => job.id !== id);
    await chrome.storage.local.set({ applicationList: filtered });
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL entries? This cannot be undone.")) return;
    await chrome.storage.local.clear();
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const sortedData = await importCSV(e, data, columns);
    await chrome.storage.local.set({ applicationList: sortedData });
    if (fileInputRef.current) fileInputRef.current.value = "";
    alert("Import successful!");
  };

  const columns = useMemo(
    () =>
      getColumns(handleStatusChange, handleDelete, (job) => setEditData(job)),
    [data],
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-end gap-2 mb-6 shrink-0">
        <button
          onClick={() =>
            exportCSV({
              data,
              columns: columns.filter(
                (col) => !(col.meta as any)?.omitFromExport,
              ),
            })
          }
          className={BTN_STYLE.gray}
        >
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
          className={BTN_STYLE.gray}
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
