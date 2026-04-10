import type { JobApplication } from "./types/job";

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

let isPanelOpen = false;

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
    console.log("Panel opened.");
    broadcastStatus(true);

    port.onDisconnect.addListener(() => {
      console.log("Panel closed.");
      broadcastStatus(false);
    });
  }
});

/**
 * CORE REFRESH LOGIC
 * Dispatches a message to the content script.
 * Only clears the UI if we are CERTAIN we are on a non-job page.
 */
// const triggerRefresh = async (tabId: number) => {
//   try {
//     if (!isPanelOpen) return;
//     const tab = await chrome.tabs.get(tabId);

//     // 1. Ignore internal Chrome/Edge pages - immediately clear UI for safety
//     if (
//       !tab.url ||
//       tab.url.startsWith("chrome") ||
//       tab.url.startsWith("edge") ||
//       tab.url.startsWith("about:")
//     ) {
//       chrome.runtime.sendMessage({
//         type: "JOB_UPDATED",
//         payload: { job: null },
//       });
//       return;
//     }

//     // 2. Request data from content script
//     chrome.tabs.sendMessage(tabId, { type: "REFRESH_JOB_DATA" }, (response) => {
//       // Check if content script exists
//       if (chrome.runtime.lastError) {
//         // Only clear the panel if the tab is fully loaded and NO script responded.
//         // This prevents clearing during brief navigation/loading states.
//         if (tab.status === "complete") {
//           console.log(
//             "No content script on this page. Clearing panel.",
//             response,
//           );
//           chrome.runtime.sendMessage({
//             type: "JOB_UPDATED",
//             payload: { job: null },
//           });
//         }
//       }
//     });
//   } catch (e) {
//     // Tab might have been closed during the async call
//     console.debug("Tab refresh skipped: Tab no longer exists.");
//   }
// };

/**
 * MESSAGE HUB
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message, sender);
  // Relay updates from Content Script to Side Panel
  if (message.type === "JOB_UPDATED") {
    if (!isPanelOpen) {
      sendResponse({ status: "ignored_panel_closed" });
      return false;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
      // Check if the message is from the tab the user is actually looking at
      if (activeTab && sender.tab && activeTab.id === sender.tab.id) {
        // OPTIONAL: Only allow the main frame to clear the panel
        // If message.payload.job is null, check if sender.frameId is 0 (main frame)
        // if (message.payload.job === null && sender.frameId !== 0) {
        if (sender.frameId !== 0) {
          return; // Ignore "clear" messages from iframes
        }

        chrome.runtime.sendMessage(message);
      }
    });

    // chrome.runtime.sendMessage(message);
    sendResponse({ status: "relayed" });
    return true; // Indicates we will respond asynchronously
  }

  // Persistent Save logic
  if (message.action === "SAVE_JOB") {
    chrome.storage.local.get(["applicationList"], (result) => {
      const list = (result.applicationList as JobApplication[]) || [];
      const isDuplicate = list.some((job) => job.id === message.data.id);

      if (isDuplicate) {
        sendResponse({ success: true, existed: true });
        return;
      }

      const updatedList = [message.data, ...list];
      chrome.storage.local.set({ applicationList: updatedList }, () => {
        sendResponse({ success: true, existed: false });
      });
    });
    return true;
  }

  if (message.action === "CHECK_IF_SAVED") {
    chrome.storage.local.get(["applicationList"], (result) => {
      const list = (result.applicationList as JobApplication[]) || [];
      const existed = list.some((job) => job.id === message.id);
      sendResponse({ existed });
    });
    return true;
  }
});

/**
 * EVENT LISTENERS
 */
// We still need onActivated to handle tab switching
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);

  if (!isPanelOpen) return;

  // 1. Check if it's a "Dead Zone" (New Tab, Settings, etc.)
  const isRestrictedPage =
    !tab.url ||
    tab.url.startsWith("chrome://") ||
    tab.url.startsWith("edge://") ||
    tab.url.startsWith("about:");

  if (isRestrictedPage) {
    console.log("User is on a restricted page. Clearing panel.");
    chrome.runtime.sendMessage({
      type: "JOB_UPDATED",
      payload: { job: null },
    });
  } else {
    // 2. If it's a normal page, wake up the content script
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: "PANEL_STATUS", isOpen: true });
    }
  }
});
// 1. Handle New Tabs or Page Refreshes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // We only care when the page has finished loading ('complete')
  // and if the side panel is currently open
  if (isPanelOpen && changeInfo.status === "complete") {
    console.log("Tab updated and complete. Sending status to:", tab);
    const isRestrictedPage =
      !tab.url ||
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("edge://") ||
      tab.url.startsWith("about:");

    if (isRestrictedPage) {
      console.log("User is on a restricted page. Clearing panel.");
      chrome.runtime.sendMessage({
        type: "JOB_UPDATED",
        payload: { job: null },
      });
    } else {
      // No setTimeout needed here usually, as 'complete' means the script is ready
      chrome.tabs.sendMessage(
        tabId,
        {
          type: "PANEL_STATUS",
          isOpen: true,
        },
        () => {
          if (chrome.runtime.lastError) {
            console.debug(
              "Content script not injected yet or restricted page.",
            );
          }
        },
      );
    }
  }
});
// 1. Handle Tab Switching
// chrome.tabs.onActivated.addListener((activeInfo) => {
//   // 300ms delay allows the browser to focus the tab and the content script to wake up
//   if (isPanelOpen) setTimeout(() => triggerRefresh(activeInfo.tabId), 300);
// });

// // 2. Handle Page Refreshes or New URL loads
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   // Only trigger when the URL changes or the load is complete
//   if (isPanelOpen && changeInfo.status === "complete" && tab.active) {
//     triggerRefresh(tabId);
//   }
// });

// // 3. Handle SPA Navigation (Crucial for LinkedIn/Seek/Glassdoor)
// // This catches URL changes that don't trigger a full page reload
// chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
//   if (details.frameId === 0) {
//     // Only trigger for the main window, not iframes
//     triggerRefresh(details.tabId);
//   }
// });
