import { useEffect, useState, useMemo, useRef } from "react";
import "../../assets/styles/index.css";
import type { JobApplication } from "../../types/job";
import Table from "./Table";
import UpsertModal from "./UpsertModal";
import { getColumns } from "./Columns";
import { isExistJobByUrl, sortJobsByDate } from "../../utils/jobUtils";
import { exportCSV, importCSV } from "./CsvService";

const ApplicationList = () => {
  const [data, setData] = useState<JobApplication[]>([]);
  const [editData, setEditData] = useState<JobApplication | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chrome.storage.local.get("applicationList", (result) => {
      const list = result.applicationList as JobApplication[];
      if (list) {
        setData(sortJobsByDate(list));
      }
    });
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const updatedData = data.map((job) =>
      job.id === id ? { ...job, status: newStatus } : job,
    );
    await chrome.storage.local.set({ applicationList: updatedData });
    setData(updatedData);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this entry?")) return;
    const filtered = data.filter((job) => job.id !== id);
    await chrome.storage.local.set({ applicationList: filtered });
    setData(filtered);
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL entries? This cannot be undone.")) return;

    chrome.storage.local.clear(function () {
      var error = chrome.runtime.lastError;
      if (error) {
        console.error("Error clearing storage:", error);
      }
    });
    setData([]);
  };

  const handleUpsert = async (job: JobApplication) => {
    const isExistById = data.some((d) => d.id === job.id);

    let upsertData;
    if (isExistById) {
      // Update existing
      upsertData = data.map((item) => (item.id === job.id ? job : item));
    } else {
      // Add new
      const isExistByUrl = isExistJobByUrl(job.link, data);
      if (isExistByUrl) {
        const msg = `This job link is already in your list.\nAre you sure you want to add a duplicate?`;
        if (!window.confirm(msg)) return;
      }
      upsertData = [job, ...data];
    }
    await chrome.storage.local.set({ applicationList: upsertData });
    setData(upsertData);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const sortedData = await importCSV(e, data, columns);
    await chrome.storage.local.set({ applicationList: sortedData });
    setData(sortedData);

    if (fileInputRef.current) fileInputRef.current.value = "";
    alert("Import successful!");
  };

  const openEditModal = (job: JobApplication) => {
    setEditData(job);
    setOpenModal(true);
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
              exportCSV({ data, columns });
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

          {/* Trigger Import Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-toolbar-gray"
          >
            <span>📤</span> Import CSV
          </button>
          {/* <button onClick={() => {}} className="btn-toolbar-gray">
            <span>📤</span> Import CSV
          </button> */}

          <button
            onClick={() => setOpenModal(true)}
            className="btn-toolbar-amber"
          >
            <span className="text-xs font-black leading-none">+</span> Add Job
          </button>

          <button onClick={handleClearAll} className="btn-toolbar-red">
            <span>🗑️</span> Clear All
          </button>
        </div>
      </div>

      {data && data.length > 0 ? (
        <Table data={data} columns={columns} />
      ) : (
        <p className="text-base">No job applications found.</p>
      )}

      {openModal && (
        <UpsertModal
          job={editData}
          onClose={() => {
            setEditData(null);
            setOpenModal(false);
          }}
          onUpsert={handleUpsert}
        />
      )}
    </div>
  );
};

export default ApplicationList;
