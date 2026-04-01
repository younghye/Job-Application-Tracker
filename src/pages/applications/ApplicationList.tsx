import { useEffect, useState, useMemo } from "react";
import "../../assets/styles/index.css";
// import { createColumnHelper } from "@tanstack/react-table";
import type { JobApplication } from "../../types/job";
// import { STATUS_OPTIONS } from "../../types/job";
import Table from "./Table";
import EditModal from "./EditModal";
import { getColumns } from "./columns";

const ApplicationList = () => {
  const [data, setData] = useState<JobApplication[]>([]);
  const [editData, setEditData] = useState<JobApplication | null>(null);
  //   const [sorting, setSorting] = useState<SortingState>([]);

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
    await chrome.storage.local.set({ applicationList: updatedData });
    setData(updatedData);
  };

  // 4. Delete Logic
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this entry?")) return;
    const filtered = data.filter((job) => job.id !== id);
    await chrome.storage.local.set({ applicationList: filtered });
    setData(filtered);
  };

  const handleResetStorage = async () => {
    if (!window.confirm("Delete ALL entries? This cannot be undone.")) return;
    setData([]);
    chrome.storage.local.clear(function () {
      var error = chrome.runtime.lastError;
      if (error) {
        console.error("Error clearing storage:", error);
      } else {
        console.log("All data cleared successfully.");
      }
    });
  };

  const handleUpdate = async (updatedJob: JobApplication) => {
    const updatedData = data.map((item) =>
      item.id === updatedJob.id ? updatedJob : item,
    );

    await chrome.storage.local.set({ applicationList: updatedData });
    setData(updatedData);
  };

  // 5. Column Definitions
  // const columnHelper = createColumnHelper<JobApplication>();
  // const columns = useMemo(
  //   () => [
  //     columnHelper.accessor("date", {
  //       header: "Date",
  //       size: 100,
  //     }),
  //     columnHelper.accessor("jobTitle", {
  //       header: "Job Title",
  //       size: 160,
  //       meta: { truncate: true },
  //       cell: (info) => info.getValue(),
  //     }),
  //     columnHelper.accessor("company", {
  //       header: "Company",
  //       size: 160,
  //       meta: { truncate: true },
  //       cell: (info) => info.getValue(),
  //     }),
  //     columnHelper.accessor("status", {
  //       header: "Status",
  //       size: 110,
  //       cell: (info) => (
  //         <select
  //           value={info.getValue()}
  //           onChange={(e) =>
  //             handleStatusChange(info.row.original.id, e.target.value)
  //           }
  //           className="status-select"
  //         >
  //           {STATUS_OPTIONS.map((opt) => (
  //             <option key={opt} value={opt}>
  //               {opt}
  //             </option>
  //           ))}
  //         </select>
  //       ),
  //     }),
  //     columnHelper.accessor("link", {
  //       header: "Link",
  //       size: 180,
  //       enableSorting: false,
  //       meta: { truncate: true },

  //       cell: (info) => (
  //         <a
  //           href={info.getValue()}
  //           target="_blank"
  //           rel="noreferrer"
  //           title={info.getValue()}
  //         >
  //           {info.getValue()}
  //         </a>
  //       ),
  //     }),
  //     columnHelper.accessor("note", {
  //       header: "Note",
  //       size: 210,
  //       enableSorting: false,
  //       meta: { truncate: true },
  //       cell: (info) => info.getValue(),
  //     }),
  //     columnHelper.display({
  //       id: "actions",
  //       header: "Action",
  //       size: 80,
  //       cell: (info) => (
  //         <div style={{ display: "flex", gap: "12px" }}>
  //           <button
  //             onClick={() => setEditData(info.row.original)}
  //             className="edit-btn"
  //             title="Edit"
  //           >
  //             ✏️
  //           </button>
  //           <button
  //             onClick={() => handleDelete(info.row.original.id)}
  //             className="delete-btn"
  //             title="Delete"
  //           >
  //             🗑️
  //           </button>
  //         </div>
  //       ),
  //     }),
  //   ],
  //   [data],
  // );
  // 2. Initialize columns using the imported helper
  const columns = useMemo(
    () => getColumns(handleStatusChange, handleDelete, setEditData),
    [data], // Re-memoize if data changes to ensure handlers have fresh closure
  );

  return (
    <div>
      <div className="flex justify-end pb-4">
        {/* <button
          type="button"
          className="btn-secondary"
          onClick={handleResetStorage}
        >
          All Delete
        </button> */}
        <div className="flex items-center justify-between pb-6">
          {/* Left Side: Data Utilities */}
          <div className="flex gap-2">
            <button
              // onClick={handleExport}
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
            >
              📥 Export JSON
            </button>

            <button
              // onClick={handleImportClick}
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
            >
              📤 Import
            </button>
            <button
              className="px-3 py-1.5 text-xs font-medium border border-amber-400 text-amber-700 bg-amber-50 rounded hover:bg-amber-100 flex items-center gap-1 transition-colors"
              onClick={() => {}}
            >
              <span className="text-sm font-bold">+</span> Add Job
            </button>
            <button
              onClick={handleResetStorage}
              className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded hover:bg-red-50 flex items-center gap-1"
            >
              🗑️ Clear All
            </button>
          </div>
        </div>
      </div>

      {data && data.length > 0 ? (
        <div className="table-wrapper">
          <Table data={data} columns={columns} />
        </div>
      ) : (
        <p className="text-base">No job applications found.</p>
      )}

      {editData && (
        <EditModal
          job={editData}
          onClose={() => setEditData(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default ApplicationList;
