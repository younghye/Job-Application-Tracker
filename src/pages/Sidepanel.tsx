import { useEffect, useState } from "react";
import JobForm from "./JobForm";
import type { JobApplication } from "../types/job";

const SidePanel = () => {
  const [job, setJob] = useState<JobApplication | null>(null);
  useEffect(() => {
    console.log("Side Panel Listener Mounted");

    const msgListener = (msg: any, sender: any, sendResponse: any) => {
      // Log EVERY message to see if ANYTHING is coming through
      console.log(
        "DEBUG: Side Panel caught ANY message:",
        msg,
        sender,
        sendResponse,
      );

      if (msg.type === "JOB_UPDATED") {
        console.log("SUCCESS: Job Data Received:", msg.payload.job);
        setJob(msg.payload.job);
      }
      // Return true to keep the channel open for async responses
      return true;
    };

    chrome.runtime.onMessage.addListener(msgListener);

    // Trigger an immediate check in case the data is already there
    // (You need to implement GET_CURRENT_STATE in your content script)
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(
          tab.id,
          { type: "GET_CURRENT_STATE" },
          (res) => {
            if (res?.job) setJob(res.job);
          },
        );
      }
    });

    return () => {
      console.log("Side Panel Listener Unmounted");
      chrome.runtime.onMessage.removeListener(msgListener);
    };
  }, []); // Empty dependency array is correct
  return (
    <div className="p-4">
      <JobForm
        job={job}
        onClose={() => {
          // Handle close action
        }}
        onUpsert={() => {
          // const newJob = { id: crypto.randomUUID(), ...data };
          // saveJob(newJob);
        }}
      />
    </div>
  );
};

export default SidePanel;
