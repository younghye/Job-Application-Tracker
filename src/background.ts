import type { JobApplication } from "./types/job";
// import { isExistJobByUrl } from "./utils/jobUtils";

// chrome.action.onClicked.addListener(() => {
//   chrome.tabs.create({
//     url: chrome.runtime.getURL("index.html"),
//   });
// });
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "JOB_UPDATED" && sender.tab) {
    console.log("Relaying JOB_UPDATED from tab to Side Panel");
    chrome.runtime.sendMessage(message);
    sendResponse({ status: "relayed" });
    return true; // Keep the channel open for async response
  }

  if (message.action === "SAVE_JOB") {
    chrome.storage.local.get(["applicationList"], (result) => {
      const list = (result.applicationList as JobApplication[]) || [];
      const existed = list.some((job) => job.id === message.data.id);
      if (existed) {
        console.log("⚠️ Duplicate detected. Skipping save.");
        sendResponse({ success: true, existed: true });
        return;
      }

      const updatedList = [message.data, ...list];
      chrome.storage.local.set({ applicationList: updatedList }, () => {
        console.log("🎯 Saved:", message.data.jobTitle);
        sendResponse({ success: true, existed: false });
      });
    });
    return true;
  }

  // 2. Handling the Status Check (for UI updates)
  if (message.action === "CHECK_IF_SAVED") {
    chrome.storage.local.get(["applicationList"], (result) => {
      const list = (result.applicationList as JobApplication[]) || [];
      const existed = list.some((job) => job.id === message.id);
      // const existed = isExistJobByUrl(message.id, list);

      sendResponse({ existed });
    });
    return true;
  }
});
// A. Catch SPA Navigation (Clicks in LinkedIn/Glassdoor that change URL without reload)
// chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
//   chrome.tabs.sendMessage(details.tabId, { type: "REFRESH_JOB_DATA" });
// });

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   // If the content script sends a job, broadcast it to the Side Panel
//   console.log("Background received message:", sender, sendResponse);
//   if (message.type === "JOB_UPDATED") {
//     chrome.runtime.sendMessage(message);
//   }
// });
// Listen for tab switches or URL changes
// A. Catch SPA Navigation (Clicks in LinkedIn/Glassdoor that change URL without reload)
chrome.webNavigation.onHistoryStateUpdated.addListener(triggerRefresh);

// chrome.tabs.onActivated.addListener(triggerRefresh);
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log("Tab switched to:", activeInfo.tabId);
  // Give the browser 100ms to settle the new tab context
  setTimeout(() => {
    chrome.tabs
      .sendMessage(activeInfo.tabId, { type: "REFRESH_JOB_DATA" })
      .catch(() => console.log("No script on this tab."));
  }, 100);
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("Tab updated:", tabId, changeInfo, tab);

  if (
    changeInfo.status === "complete" &&
    tab.url &&
    !tab.url.startsWith("chrome://")
  ) {
    triggerRefresh();
  }
});

function triggerRefresh() {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    console.log(" internal chrome page:", tab?.url);
    if (!tab || !tab.url || tab.url.startsWith("chrome")) {
      console.log("Skipping internal chrome page:", tab?.url);
      return;
    }
    if (tab?.id) {
      // Tell the content script to scrape the page and report back
      chrome.tabs
        .sendMessage(tab.id, { type: "REFRESH_JOB_DATA" })
        .catch((err) => {
          // Content script might not be loaded yet, which is fine
          console.debug("Content script not ready", err);
        });
    }
  });
}

// Add these variables at the top of background.js to track state
// let lastTabId: number | null = null;
// let lastUrl = "";

// function triggerRefresh() {
//   chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
//     if (!tab?.id || !tab.url) return;

//     // LAYER 1: Hard filter for internal Chrome pages
//     if (tab.url.startsWith("chrome") || tab.url.startsWith("about:")) {
//       return; // Exit silently. No logging needed for internal pages.
//     }

//     // LAYER 2: Skip if we are on the exact same URL and Tab as 2 seconds ago
//     // This stops the "spam" when LinkedIn does minor background updates
//     if (tab.id === lastTabId && tab.url === lastUrl) {
//       return;
//     }

//     // Update trackers
//     lastTabId = tab.id;
//     lastUrl = tab.url;

//     // Only log when we are actually about to send a message
//     console.log("🚀 Valid page detected, requesting refresh:", tab.url);

//     chrome.tabs.sendMessage(tab.id, { type: "REFRESH_JOB_DATA" })
//       .catch((err) => {
//         console.debug("Content script not ready on this tab yet.");
//       });
//   });
// }
