import { useEffect, useState } from "react";
import JobForm from "../common/JobForm";
import type { JobApplication } from "../../types/job";
import { HomeIcon, XIcon } from "../../assets/styles/Icons";

const SidePanel = () => {
  const [job, setJob] = useState<JobApplication | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);

  useEffect(() => {
    const port = chrome.runtime.connect({ name: "sidepanel" });

    const msgListener = (msg: any, sender: chrome.runtime.MessageSender) => {
      // Ignore direct messages from content scripts — only accept relayed messages from the background
      if (sender.tab) return;
      if (msg.type === "JOB_UPDATED") {
        setJob(msg.payload.job);
        setMessage(null);

        if (msg.payload.job?.jobId) {
          chrome.runtime.sendMessage(
            { action: "CHECK_IF_SAVED", jobId: msg.payload.job.jobId },
            (response) => {
              if (response?.existed) {
                setMessage({
                  text: "This job is already in your list!",
                  type: "warning",
                });
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
    const checkJobExists = (): Promise<boolean> => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: "CHECK_IF_SAVED", jobId: data.jobId },
          (response) => resolve(!!response?.existed),
        );
      });
    };

    try {
      const exists = await checkJobExists();
      if (exists) {
        const proceed = window.confirm(
          "This job is already in your list. Do you want to add it as a duplicate?",
        );
        if (!proceed) return;
      }

      chrome.runtime.sendMessage({ action: "SAVE_JOB", data }, (response) => {
        if (chrome.runtime.lastError) {
          return setMessage({ text: "Connection error", type: "error" });
        }

        if (response?.success) {
          setMessage({ text: "Job saved successfully!", type: "success" });
        } else {
          setMessage({
            text: response?.error || "Failed to save job",
            type: "error",
          });
        }
      });
    } catch (error) {
      console.error("Upsert failed:", error);
      setMessage({ text: "An unexpected error occurred", type: "error" });
    }
  };

  const statusStyles = {
    success: "bg-emerald-50 border-emerald-100 text-emerald-800",
    error: "bg-red-50 border-red-100 text-red-800",
    info: "bg-indigo-50 border-indigo-100 text-indigo-800",
    warning: "bg-amber-50 border-amber-100 text-amber-800",
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header with Dashboard Button */}
      <div className="p-4 border-b border-gray-200 shrink-0">
        <button
          onClick={() =>
            chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") })
          }
          className="group flex items-center justify-center gap-2 w-full py-3 px-4 
             bg-gradient-to-r from-indigo-600 to-violet-600 
             hover:from-indigo-500 hover:to-violet-500 
             active:scale-[0.98] text-white text-sm font-bold rounded-xl 
             shadow-[0_4px_12px_rgba(99,102,241,0.3)] 
             hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] 
             transition-all duration-300 border border-white/10"
        >
          <HomeIcon />
          <span>Go to Dashboard</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {message && (
          <div
            className={`flex justify-between items-center px-3 py-2 mb-5 rounded-md border animate-in fade-in slide-in-from-top-2 duration-300 ${
              statusStyles[message.type]
            }`}
          >
            <p className="text-sm font-semibold leading-tight">
              {message.text}
            </p>
            <button
              onClick={() => setMessage(null)}
              className="ml-2 p-1 hover:bg-black/5 rounded-full transition-colors"
            >
              <XIcon />
            </button>
          </div>
        )}

        <JobForm job={job} onUpsert={handleUpsert} />
      </div>
    </div>
  );
};

export default SidePanel;
