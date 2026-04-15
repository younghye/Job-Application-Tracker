import { useEffect, useState } from "react";
import JobForm from "../common/JobForm";
import type { JobApplication } from "../../types/job";

const SidePanel = () => {
  const [job, setJob] = useState<JobApplication | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const port = chrome.runtime.connect({ name: "sidepanel" });

    const msgListener = (msg: any) => {
      if (msg.type === "JOB_UPDATED") {
        setJob(msg.payload.job);
        setMessage(null);

        if (msg.payload.job?.jobId) {
          chrome.runtime.sendMessage(
            { action: "CHECK_IF_SAVED", jobId: msg.payload.job.jobId },
            (response) => {
              if (response?.existed) {
                setMessage("This job is already in your list!");
              }
            },
          );
        }
      }
    };

    chrome.runtime.onMessage.addListener(msgListener);

    const fetchData = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { type: "GET_CURRENT_STATE" },
            (response) => {
              if (chrome.runtime.lastError) {
                setTimeout(fetchData, 500);
              } else if (response?.job) {
                setJob(response.job);
              } else {
                setJob(null);
              }
            },
          );
        }
      });
    };

    fetchData();

    return () => {
      chrome.runtime.onMessage.removeListener(msgListener);
      port.disconnect();
    };
  }, []);

  const handleUpsert = async (data: JobApplication) => {
    chrome.runtime.sendMessage({ action: "SAVE_JOB", data }, (response) => {
      if (chrome.runtime.lastError) return;

      if (response?.existed) {
        setMessage("This job is already in your list!");
      } else if (response?.success) {
        setMessage("Job saved successfully!");
      } else {
        setMessage(response?.error || "Error occurred while saving.");
      }
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header with Dashboard Button */}
      <div className="p-4 border-b border-gray-200 shrink-0">
        <button
          onClick={() => chrome.tabs.create({ url: "dashboard.html" })}
          className="group flex items-center justify-center gap-2 w-full py-3 px-4 
             bg-gradient-to-r from-indigo-600 to-violet-600 
             hover:from-indigo-500 hover:to-violet-500 
             active:scale-[0.98] text-white text-sm font-bold rounded-xl 
             shadow-[0_4px_12px_rgba(99,102,241,0.3)] 
             hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] 
             transition-all duration-300 border border-white/10"
        >
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>Go to Dashboard</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {message && (
          <div
            className={`flex justify-between items-center p-3 mb-5 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300 ${
              message.includes("already")
                ? "bg-amber-50 border-amber-100 text-amber-800"
                : "bg-indigo-50 border-indigo-100 text-indigo-800"
            }`}
          >
            <p className="text-xs font-semibold leading-tight">{message}</p>
            <button
              onClick={() => setMessage(null)}
              className="ml-2 p-1 hover:bg-black/5 rounded-full transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        <JobForm job={job} onUpsert={handleUpsert} />
      </div>
    </div>
  );
};

export default SidePanel;
