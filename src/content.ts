import { isJobPage, extractJobLink, extractJobData } from "./utils/extractors";

let lastUrl = "";
let sentUrl = "";
let isExtensionActive = false;
const isMainFrame = window.self === window.top;

const getParentUrl = (): string => {
  try {
    return window.top?.location.href || window.location.href;
  } catch {
    return window.location.href; // cross-origin — can't read parent
  }
};

// Returns true for tracking/ad iframes that should be ignored.
// Allows same-origin iframes (e.g. LinkedIn's /preload/) and known ATS embeds.
const isTrackingFrame = (): boolean => {
  if (isMainFrame) return false;
  const host = window.location.hostname;

  // Explicitly allow known ATS iframe domains embedded in company career pages
  const atsHosts = [
    "workable.com",
    "greenhouse.io",
    "lever.co",
    "ashbyhq.com",
    "myworkday.com",
    "smartrecruiters.com",
    "jobvite.com",
    "icims.com",
  ];
  if (atsHosts.some((d) => host.includes(d))) return false;

  // Allow same-origin iframes (e.g. LinkedIn's /preload/ detail pane)
  try {
    const parentHost = window.top?.location.hostname;
    if (parentHost && host === parentHost) return false;
  } catch {
    return true; // cross-origin parent — can't verify, treat as tracking
  }

  return true;
};

// ─── Core Logic ───────────────────────────────────────────────────────────────

function notifySidePanel(attempts = 0) {
  if (!isExtensionActive || (!isMainFrame && isTrackingFrame())) return;

  // For same-origin iframes (e.g. LinkedIn's /preload/ detail pane), use the
  // parent frame's URL so we get the correct job link (with currentJobId param).
  const currentUrl = isMainFrame ? extractJobLink() : getParentUrl();

  if (isMainFrame && !isJobPage(currentUrl)) {
    chrome.runtime.sendMessage({ type: "JOB_UPDATED", payload: { job: null } });
    return;
  }

  const jobData = extractJobData(currentUrl);
  if (jobData?.jobTitle && jobData?.company) {
    if (sentUrl === currentUrl) return;

    sentUrl = currentUrl;
    chrome.runtime.sendMessage({
      type: "JOB_UPDATED",
      payload: { job: jobData },
    });
  } else if (attempts < 5) {
    // Main frame failed — ask iframes to extract
    if (isMainFrame)
      chrome.runtime.sendMessage({ type: "REQUEST_IFRAME_EXTRACT" });
    setTimeout(() => notifySidePanel(attempts + 1), 700);
  } else {
    // All retries exhausted — tell the panel extraction failed
    chrome.runtime.sendMessage({
      type: "JOB_UPDATED",
      payload: { job: null, extractionFailed: true },
    });
  }
}

const checkUrlChange = () => {
  if (!isExtensionActive || isTrackingFrame()) return;
  const currentUrl = isMainFrame ? extractJobLink() : getParentUrl();
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    sentUrl = "";
    setTimeout(notifySidePanel, 800);
  }
};

// ─── Event Listeners ──────────────────────────────────────────────────────────

// Listen for triggers from Background or Side Panel
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type === "PANEL_STATUS") {
    isExtensionActive = msg.isOpen;
    if (isExtensionActive && isMainFrame) {
      lastUrl = "";
      sentUrl = "";
      notifySidePanel();
    }
  }

  if (msg.type === "EXTRACT_NOW" && !isMainFrame) notifySidePanel();

  if (msg.type === "GET_CURRENT_STATE" && isMainFrame)
    sendResponse({ job: extractJobData(null) });

  return true;
});

// MutationObserver watches for DOM changes in both the main frame and job-site iframes
// (e.g. LinkedIn loads its entire UI inside a /preload/ iframe, so we must observe there too)
if (!isTrackingFrame()) {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const observer = new MutationObserver(() => {
    if (!isExtensionActive) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(checkUrlChange, 500);
  });

  const startObserver = () => {
    if (!chrome.runtime?.id) return;
    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.body) {
    startObserver();
  } else {
    document.addEventListener("DOMContentLoaded", startObserver, {
      once: true,
    });
  }

  window.addEventListener("popstate", () => setTimeout(checkUrlChange, 300));
}
