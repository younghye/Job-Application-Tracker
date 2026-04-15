import { useEffect, useState } from "react";
import JobForm from "../common/JobForm";
import type { JobApplication } from "../../types/job";
import "../../assets/styles/index.css";

const SidePanel = () => {
  const [job, setJob] = useState<JobApplication | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    //  Open a "Port" to the background script.
    const port = chrome.runtime.connect({ name: "sidepanel" });

    const msgListener = (msg: any, _sender: any, _sendResponse: any) => {
      if (msg.type === "JOB_UPDATED") {
        setJob(msg.payload.job);
        setMessage(null);

        if (msg.payload.job) {
          chrome.runtime.sendMessage(
            {
              action: "CHECK_IF_SAVED",
              jobId: msg.payload.job?.jobId,
            },
            (response) => {
              if (response?.existed) {
                setMessage("This job is already in your list!");
              }
            },
          );
        }
      }
      return true;
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
              } else if (response && response.job) {
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
    chrome.runtime.sendMessage(
      {
        action: "SAVE_JOB",
        data: data,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error saving:", chrome.runtime.lastError);
          return;
        }

        if (response?.existed) {
          setMessage("This job is already in your list!");
        } else if (response?.success) {
          setMessage("Job saved successfully!");
        } else {
          setMessage(response?.error || "Unknown error occurred while saving.");
        }
      },
    );
  };

  return (
    <div className="flex flex-col h-screen ">
      <div className="p-4 bg-white border-b border-gray-200 shadow-sm z-10">
        <button
          onClick={() => chrome.tabs.create({ url: "dashboard.html" })}
          className="btn-dashboard"
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
              strokeWidth="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>Go to Dashboard</span>
        </button>
      </div>
      <div className="p-4 relative min-h-screen">
        {message && (
          <div
            className={`p-3 mb-4 rounded-lg flex justify-between items-center ${
              message.includes("already")
                ? "bg-amber-50 border border-amber-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                message.includes("already") ? "text-amber-700" : "text-blue-700"
              }`}
            >
              {message}
            </p>
            <button
              onClick={() => setMessage(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        )}
        {/* {message && (
          <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center">
            <p className="text-blue-500 text-lg font-semibold">{message}</p>
          </div>
        )} */}
        <JobForm job={job} onUpsert={handleUpsert} />
      </div>
    </div>
  );
};

export default SidePanel;
