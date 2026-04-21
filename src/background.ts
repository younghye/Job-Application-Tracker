import type { JobApplication } from "./types/job";
import { extractJobId, normalizeDate } from "./utils/jobUtils";

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

let isPanelOpen = false;
let lastRelayedJobId = "";

// 1. BROADCASTER: Tell all tabs if the panel is open or closed
const broadcastStatus = (isOpen: boolean) => {
  isPanelOpen = isOpen;
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: "PANEL_STATUS", isOpen });
      }
    });
  });
};

// Listen for the Side Panel connecting/disconnecting
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "sidepanel") {
    broadcastStatus(true);

    port.onDisconnect.addListener(() => {
      broadcastStatus(false);
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Relay updates from Content Script to Side Panel
  if (message.type === "JOB_UPDATED") {
    if (!isPanelOpen) {
      sendResponse({ status: "ignored_panel_closed" });
      return false;
    }

    // Deduplicate synchronously before async tab query to avoid race conditions
    if (sender.frameId !== 0 && !message.payload?.job) {
      sendResponse({ status: "ignored_iframe_null" });
      return false;
    }
    const jobId = message.payload?.job?.jobId ?? "";
    if (jobId && jobId === lastRelayedJobId) {
      sendResponse({ status: "duplicate" });
      return false;
    }
    lastRelayedJobId = jobId;

    chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
      if (activeTab && sender.tab && activeTab.id === sender.tab.id) {
        chrome.runtime.sendMessage(message);
      }
    });
    sendResponse({ status: "relayed" });
    return true;
  }

  // Main frame requests iframes to attempt extraction when its own attempt fails
  if (message.type === "REQUEST_IFRAME_EXTRACT") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, { type: "EXTRACT_NOW" });
      }
    });
    return false;
  }

  if (message.action === "SAVE_JOB") {
    chrome.storage.local.get(["applicationList"], (result) => {
      const list = (result.applicationList as JobApplication[]) || [];

      const newJob = {
        ...message.data,
        jobId: message.data.jobId || extractJobId(message.data.link),
        id: message.data.id || crypto.randomUUID(),
        date: normalizeDate(message.data.date),
      };

      if (!newJob.jobId) {
        sendResponse({ success: false, error: "Could not extract job ID" });
        return;
      }

      const updatedList = [newJob, ...list];
      chrome.storage.local.set({ applicationList: updatedList }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message.action === "CHECK_IF_SAVED") {
    chrome.storage.local.get(["applicationList"], (result) => {
      const list = (result.applicationList as JobApplication[]) || [];
      const existed = list.some((job) => job.jobId === message.jobId);
      sendResponse({ existed });
    });
    return true;
  }
});

const handleTabChange = (tab: chrome.tabs.Tab) => {
  if (!isPanelOpen) return;
  const isRestricted =
    !tab.url ||
    tab.url.startsWith("chrome://") ||
    tab.url.startsWith("edge://") ||
    tab.url.startsWith("about:");

  if (isRestricted) {
    lastRelayedJobId = "";
    chrome.runtime.sendMessage({ type: "JOB_UPDATED", payload: { job: null } });
  } else if (tab.id) {
    // Wake up the content script
    chrome.tabs.sendMessage(tab.id, { type: "PANEL_STATUS", isOpen: true });
  }
};

// Catch tab switches
chrome.tabs.onActivated.addListener(async (info) => {
  const tab = await chrome.tabs.get(info.tabId);
  handleTabChange(tab);
});

// Catch new URLs/refreshes
chrome.tabs.onUpdated.addListener((_, change, tab) => {
  if (change.status === "complete") handleTabChange(tab);
});
