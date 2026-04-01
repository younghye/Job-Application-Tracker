import type { JobApplication } from "./types/job";

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("index.html"),
  });
});

const isAlreadySaved = (url: string, list: JobApplication[]): boolean => {
  // Removes query params, hashes, and trailing slashes for a fair comparison
  // const clean = (u: string) => u.split("?")[0].split("#")[0].replace(/\/$/, "");
  // const targetUrl = clean(url);

  // return list.some((job) => clean(job.link) === targetUrl);
  return list.some((job) => job.link === url);
};

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  // 1. Handling the Save Action
  if (message.action === "SAVE_JOB") {
    chrome.storage.local.get(["applicationList"], (result) => {
      const list = (result.applicationList as JobApplication[]) || [];

      if (isAlreadySaved(message.data.link, list)) {
        console.log("⚠️ Duplicate detected. Skipping save.");
        sendResponse({ success: true, existed: true });
        return;
      }

      const updatedList = [...list, message.data];
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
      const isSaved = isAlreadySaved(message.url, list);

      sendResponse({ isSaved });
    });
    return true;
  }
});
