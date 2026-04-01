import type { JobApplication } from "./types/job";
import { isExistJobByUrl } from "./utils/jobUtils";

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("index.html"),
  });
});

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  // 1. Handling the Save Action
  if (message.action === "SAVE_JOB") {
    chrome.storage.local.get(["applicationList"], (result) => {
      const list = (result.applicationList as JobApplication[]) || [];

      if (isExistJobByUrl(message.data.link, list)) {
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
      const existed = isExistJobByUrl(message.url, list);

      sendResponse({ existed });
    });
    return true;
  }
});
