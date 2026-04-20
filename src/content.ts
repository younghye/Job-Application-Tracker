import type { JobApplication } from "./types/job";
import { extractJobId, normalizeDate } from "./utils/jobUtils";
let lastUrl = "";
let isExtensionActive = false;
const isMainFrame = window.self === window.top;

export const isJobPage = (url: string): boolean => {
  if (!url) return false;

  const urlLower = url.toLowerCase();

  // 1. High-confidence markers (If these exist, it's almost certainly a job)
  const hasSpecificJobId = [
    "currentjobid=",
    "jobid=",
    "job_id=",
    "joblistingid=",
    "vjk=", // Indeed
    "jk=", // Indeed
    "jl=", // Glassdoor
  ].some((p) => urlLower.includes(p));

  if (hasSpecificJobId) return true;

  // ATS platforms where any job path is a specific posting (URL structure differs from major boards)
  const atsHosts = ["apply.workable.com", "jobs.lever.co", "jobs.ashbyhq.com"];
  if (atsHosts.some((h) => urlLower.includes(h))) return true;

  try {
    const urlObj = new URL(urlLower);

    // Remove trailing slash so "/jobs/" becomes "/jobs"
    const path = urlObj.pathname.replace(/\/$/, "");

    // We want to return FALSE if the path is EXACTLY one of these
    const hasGenericPaths = [
      "/jobs",
      "/job",
      "/careers",
      "/career",
      "/jobs/search",
      "/jobs/collections",
      "/jobs/tracker",
      "index.htm",
      "search.htm",
    ].some((p) => path === p);

    // We want to return TRUE if it contains these but ISN'T a generic root
    const hasJobPathPattern = [
      "/job/",
      "/jobs/",
      "jobs.",
      "job.",
      "/view/",
      "/posting/",
      "/apply/",
      "/career/",
      "/careers/",
    ].some((p) => urlLower.includes(p));

    return hasJobPathPattern && !hasGenericPaths;
  } catch (e) {
    console.error("Invalid URL:", url);
    return false;
  }
};

export const extractCompany = (): string => {
  const selectors = [
    '[data-automation="advertiser-name"]', // Seek
    ".job-details-jobs-unified-top-card__company-name a", // LinkedIn
    ".jobs-unified-top-card__company-name a", // LinkedIn
    ".job-details-jobs-unified-top-card__company-name", // LinkedIn
    ".jobs-unified-top-card__company-name", // LinkedIn

    ".main-header-logo img", // Lever (Check ALT attribute)
    ".logo img", // Greenhouse (Check ALT attribute)
    ".logo",

    '[class*="employerNameHeading"]', // Glassdoor
    // Indeed — scoped to the job detail header so list cards are not matched
    '.jobsearch-JobInfoHeader [data-testid="inlineHeader-companyName"]',
    '.jobsearch-JobInfoHeader [data-testid="company-name"]',
    '[data-testid="inlineHeader-companyName"]',
    '[data-testid="company-name"]',

    // Common Data Attributes & Classes
    '[class*="companyName"]',
    '[class*="company-name"]',
    '[class*="hiring-organization"]',
    'a[href*="/company/"]',
    'a[aria-label^="Company,"]',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      let text = "";

      if (element.tagName === "IMG") {
        text = element.getAttribute("alt") || "";
      } else if (element.tagName === "META") {
        text = element.getAttribute("content") || "";
      } else {
        text = (element as HTMLElement).innerText || "";
      }

      const isVisible =
        (element as HTMLElement).offsetWidth > 0 || element.tagName === "META";
      const junkRegex =
        /top job picks|recommended|suggested|employment|see more/i;
      const isJunk = junkRegex.test(text.toLowerCase());

      if (text.length > 1 && isVisible && !isJunk) {
        return text;
      }
    }
  }

  return "";
};

const extractJobTitle = (): string => {
  const selectors = [
    // LinkedIn
    ".job-details-jobs-unified-top-card__job-title h1 a",
    ".job-details-jobs-unified-top-card__job-title",
    ".job-details-jobs-unified-top-card__job-title a",
    ".jobs-unified-top-card__job-title",
    ".jobs-unified-top-card__job-title a",
    ".jobs-details-sidebar__title",

    '[data-automation="job-detail-title"]', // SEEK
    ".jobsearch-JobInfoHeader-title", // Indeed
    '[class*="JobDetails_jobTitle"]', // Glassdoor

    "h1",
    ".re-job-title",
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector) as HTMLElement;

    if (el) {
      // Strip Indeed's loading placeholder and "- job post" suffix
      const text = el.innerText
        .trim()
        .replace(/\s*[-–]\s*job\s*post\s*$/i, "");
      const isVisible = el.offsetWidth > 0 && el.offsetHeight > 0;
      const isJunk =
        /no\. 1|Employment|Recruitment|Career|Jobs for you|Search|^welcome[\s,]/i.test(
          text,
        );

      if (text.length > 3 && isVisible && !isJunk) {
        return text;
      }
    }
  }
  return "";
};

const isSpecificJobUrl = (url: string): boolean => {
  const urlLower = url.toLowerCase();
  const hasJobId = [
    "currentjobid",
    "jobid",
    "job_id",
    "/view/",
    "/job/",
    "/posting/",
  ].some((p) => urlLower.includes(p));

  return hasJobId;
};

export const extractJobLink = () => {
  const url = window.location.href.toLowerCase();

  // --- 1. SITE-SPECIFIC "ACTIVE" SELECTORS ---
  // These target the specific job card or detail pane currently in view.

  // LinkedIn: Look for the active item in the list or the title in the detail pane
  if (url.includes("linkedin")) {
    const liActive = document.querySelector(
      '.job-card-container--active a, [aria-current="true"] a, .jobs-details-sidebar__title a',
    ) as HTMLAnchorElement;
    if (liActive?.href && !liActive.href.includes("/jobs/search"))
      return liActive.href;
  }

  // Seek: Target the specific title link in the detail view
  if (url.includes("seek")) {
    // A. Try the Detail Pane Title (The most accurate)
    const detailTitle = document.querySelector(
      '[data-automation="job-detail-title"], [data-automation="jobTitle"]',
    );
    const detailLink =
      detailTitle?.querySelector("a") || detailTitle?.closest("a");

    if (detailLink?.href) return detailLink.href;

    // B. Try the "Active" sidebar item if the detail pane hasn't linked yet
    const activeCard = document.querySelector(
      '[class*="is-selected"], [aria-current="true"]',
    );
    const cardLink = activeCard?.querySelector("a") as HTMLAnchorElement;
    if (cardLink?.href) return cardLink.href;
  }

  // Glassdoor: Use the "selected" class logic we perfected
  if (url.includes("glassdoor")) {
    // 1. Find the <li> or <div> that contains a "selected" or "active" partial class
    const activeItem = document.querySelector(
      'li[class*="selected"], [class*="JobCard_selected"], [data-test="jobListing"].selected, .selected',
    );

    if (activeItem) {
      // 2. Look for the link inside that specific active item
      const gdLink = activeItem.querySelector(
        'a[data-test="job-link"]',
      ) as HTMLAnchorElement;

      // 3. CRITICAL: Ensure we aren't returning the generic search page
      if (gdLink?.href && !gdLink.href.includes("index.htm")) {
        console.log("Glassdoor Active Link Detected:", gdLink.href);
        return gdLink.href;
      }
    }
  }
  if (url.includes("indeed")) {
    // 1. Check if we are already on a specific job page
    if (url.includes("vjk=")) return window.location.href;

    // 2. Fallback: Find the "Active" card in the list
    // Indeed marks the selected card with classes like 'vjs-highlight'
    const activeCard = document.querySelector(
      '.vjs-highlight a[data-jk], [class*="selected"] a[data-jk], .jobsearch-ResultsList .selected a',
    ) as HTMLAnchorElement;

    if (activeCard) {
      const jkId =
        activeCard.getAttribute("data-jk") ||
        activeCard.closest("[data-jk]")?.getAttribute("data-jk");
      console.log("Indeed Active Link Detected:", activeCard.href, jkId);
      if (jkId) return `https://www.indeed.com/viewjob?jk=${jkId}`;
    }
  }
  // --- 2. UNIVERSAL SEMANTIC FALLBACKS ---
  // For company homepages and Greenhouse/Lever/Workday

  // A. Check the Canonical Link (The most reliable non-visual source)
  const canonical = document.querySelector(
    'link[rel="canonical"]',
  ) as HTMLLinkElement;
  if (canonical?.href && isSpecificJobUrl(canonical.href)) {
    return canonical.href;
  }

  // B. Check for high-confidence data attributes used by ATS systems
  const dataLink = document.querySelector(
    '[data-automation*="title"] a, [data-test*="title"] a',
  ) as HTMLAnchorElement;
  if (dataLink?.href && isSpecificJobUrl(dataLink.href)) return dataLink.href;

  return window.location.href;
};

const extractJobData = (url: string | null): JobApplication | null => {
  try {
    const jobTitle = extractJobTitle();
    const company = extractCompany();
    const link = url || extractJobLink();
    const jobId = extractJobId(link);
    const id = crypto.randomUUID();

    return {
      id,
      jobId,
      jobTitle,
      company,
      link,
      date: normalizeDate(new Date()),
      status: "Applied",
    };
  } catch (error) {
    console.error("❌ Extract Job Data Crashed:", error);
    alert("An error occurred while saving. Check the console for details.");
    return null;
  }
};

function notifySidePanel(attempts = 0) {
  if (!isExtensionActive) return; // Stop pending retries when panel closes

  // extractJobLink() finds the canonical job URL (e.g. the active card on Seek/Glassdoor
  // split-views, where window.location.href is still the generic list URL)
  const currentUrl = isMainFrame ? extractJobLink() : window.location.href;

  if (isMainFrame) {
    if (!isJobPage(currentUrl)) {
      console.log("Not a job page, sending null update.");
      chrome.runtime.sendMessage({ type: "JOB_UPDATED", payload: { job: null } });
      return;
    }
    // On first attempt, ask iframes to extract in parallel (job detail may be inside one)
    if (attempts === 0) {
      chrome.runtime.sendMessage({ type: "REQUEST_IFRAME_EXTRACT" });
    }
  }

  const jobData = extractJobData(currentUrl);
  console.log("Extracted Job Data:", jobData, "Attempts:", attempts);
  if (jobData?.jobTitle && jobData?.company) {
    chrome.runtime.sendMessage({ type: "JOB_UPDATED", payload: { job: jobData } });
  } else if (attempts < 8) {
    setTimeout(() => notifySidePanel(attempts + 1), 700);
  }
  // Iframes silently give up after 8 retries — never send null
}

const checkUrlChange = () => {
  if (!isExtensionActive) return;
  if (!isMainFrame) return; // Only the main frame monitors URL changes

  const currentUrl = extractJobLink();
  console.log("Checking URL Change:", currentUrl, "Last URL:", lastUrl);
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    setTimeout(notifySidePanel, 1000);
  }
};

// Listen for triggers from Background or Side Panel
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type === "PANEL_STATUS") {
    isExtensionActive = msg.isOpen;
    // Only main frame reacts to panel status — iframes wait for EXTRACT_NOW
    if (isExtensionActive && isMainFrame) {
      notifySidePanel();
    }
  }

  // Background broadcasts this when the main frame asks iframes to extract
  if (msg.type === "EXTRACT_NOW" && !isMainFrame) {
    notifySidePanel();
  }

  if (msg.type === "GET_CURRENT_STATE" && isMainFrame) {
    sendResponse({ job: extractJobData(null) });
  }
  return true;
});

// Watch for URL changes(Covers back/forward buttons and SPA navigation)
window.addEventListener("popstate", checkUrlChange);

// check the URL every second. This uses almost ZERO CPU.
// The interval is cleared if the extension context is invalidated (e.g. after reload during dev).
const urlCheckInterval = setInterval(() => {
  if (!chrome.runtime?.id) {
    clearInterval(urlCheckInterval);
    return;
  }
  checkUrlChange();
}, 1000);
