import { useState, useMemo, useRef } from "react";
import "../../assets/styles/index.css";
import type { JobApplication } from "../../types/job";
import Table from "./Table";
import EditModal from "./EditModal";
import { getColumns } from "./Columns";
// import { sortJobsByDate } from "../../utils/jobUtils";
import { exportCSV, importCSV } from "./CsvService";
import { useApplications } from "../../hooks/useApplications";

const ApplicationList = () => {
  // const [data, setData] = useState<JobApplication[]>([]);
  const [editData, setEditData] = useState<JobApplication | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const data = useApplications();
  // const [data, setData] = useState<JobApplication[]>([]);

  // useEffect(() => {
  //   chrome.storage.local.get("applicationList", (result) => {
  //     const list = result.applicationList as JobApplication[];
  //     if (list) {
  //       setData(sortJobsByDate(list));
  //     }
  //   });
  // }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const updatedData = data.map((job) =>
      job.id === id ? { ...job, status: newStatus } : job,
    );
    await chrome.storage.local.set({ applicationList: updatedData });
    // setData(updatedData);
  };

  const handleEdit = async (job: JobApplication) => {
    const editData = data.map((item) => (item.id === job.id ? job : item));
    await chrome.storage.local.set({ applicationList: editData });
    // setData(editData);
    setEditData(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this entry?")) return;

    const filtered = data.filter((job) => job.id !== id);
    await chrome.storage.local.set({ applicationList: filtered });
    // setData(filtered);
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL entries? This cannot be undone.")) return;

    chrome.storage.local.clear(function () {
      if (chrome.runtime.lastError) {
        console.error("Error clearing storage:", chrome.runtime.lastError);
      }
    });
    // setData([]);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const sortedData = await importCSV(e, data, columns);
    await chrome.storage.local.set({ applicationList: sortedData });
    // setData(sortedData);

    if (fileInputRef.current) fileInputRef.current.value = "";
    alert("Import successful!");
  };

  const openEditModal = (job: JobApplication) => {
    setEditData(job);
  };

  const columns = useMemo(
    () => getColumns(handleStatusChange, handleDelete, openEditModal),
    [data],
  );

  return (
    <div>
      <div className="flex justify-end ">
        <div className="flex gap-2 items-center justify-between pb-6">
          <button
            onClick={() => {
              exportCSV({
                data,
                columns: columns.filter(
                  (col) => !(col.meta as any)?.omitFromExport,
                ),
              });
            }}
            className="btn-toolbar-gray"
          >
            <span>📥</span> Export CSV
          </button>

          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleImportCSV}
            style={{ display: "none" }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-toolbar-gray"
          >
            <span>📤</span> Import CSV
          </button>

          <button onClick={handleClearAll} className="btn-toolbar-red">
            <span>🗑️</span> Clear All
          </button>
        </div>
      </div>

      {data && data.length > 0 ? (
        <Table
          data={data}
          columns={columns.filter((col) => !(col.meta as any)?.omitFromTable)}
        />
      ) : (
        <div className="p-10 text-center text-gray-400 text-base">
          No application data yet.
        </div>
      )}

      {editData && (
        <EditModal
          job={editData}
          onClose={() => {
            setEditData(null);
          }}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
};

export default ApplicationList;
