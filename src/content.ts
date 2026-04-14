import type { JobApplication } from "./types/job";
import { extractJobId } from "./utils/jobUtils";
let lastUrl = "";
let isExtensionActive = false;

export const isJobPage = (url: string): boolean => {
  console.log("Checking URL for Job Page:", url);
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
    '[data-testid="inlineHeader-companyName"]', // Indeed
    '[data-testid="company-name"]', // Indeed

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

      // Special handling for Images (Lever/Greenhouse)
      if (element.tagName === "IMG") {
        text = element.getAttribute("alt") || "";
      }
      // Special handling for Meta tags
      else if (element.tagName === "META") {
        text = element.getAttribute("content") || "";
      }
      // Standard elements
      else {
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

  // --- 4. ULTIMATE FALLBACK: Document Title ---
  // Many sites follow "Job Title - Company Name | Site"
  // const titleParts = document.title.split(/[-|]/);
  // if (titleParts.length > 1) {
  //   // Usually the company is the first or second part
  //   const potentialCompany = titleParts[0].trim();
  //   if (potentialCompany && potentialCompany.length > 2)
  //     return potentialCompany;
  // }

  return "";
};

const extractJobTitle = (): string => {
  const selectors = [
    // LinkedIn
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
      const text = el.innerText.trim();
      const isVisible = el.offsetWidth > 0 && el.offsetHeight > 0;
      const isJunk =
        /no\. 1|Employment|Recruitment|Career|Jobs for you|Search/i.test(text);

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
    // Seek often adds a specific ID or state to the selected card
    const activeCard = document.querySelector(
      '[class*="is-selected"], [aria-current="true"]',
    );
    const cardLink = activeCard?.querySelector("a") as HTMLAnchorElement;
    if (cardLink?.href) return cardLink.href;
  }

  // Glassdoor: Use the "selected" class logic we perfected
  if (url.includes("glassdoor")) {
    // 1. Find the <li> or <div> that contains a "selected" or "active" partial class
    // This is the most common way Glassdoor marks the sidebar item
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

// const extractJobId = (url: string): string => {
//   if (!url) return "";
//   const lowUrl = url.toLowerCase();

//   // 1. Specific Key-Value patterns (Indeed, Glassdoor, Greenhouse, LinkedIn)
//   // We look for common ID keys and capture the alphanumeric value
//   const keyMatch = lowUrl.match(
//     /(?:jk=|jl=|gh_jid=|currentjobid=|postingid=|joblistingid=)([a-z0-9_-]+)/,
//   );
//   if (keyMatch) return keyMatch[1];

//   // 2. Path-based IDs (Seek, LinkedIn /view/, Lever)
//   // We look for /job/ or /view/ followed by a sequence
//   const pathMatch = lowUrl.match(/\/(?:job|view|interstitial)\/([a-z0-9_-]+)/);
//   if (pathMatch) return pathMatch[1];

//   // 3. The "Long Number" Fallback (The 8-12 digit string)
//   const numericMatch = lowUrl.match(/(\d{8,12})/);
//   if (numericMatch) return numericMatch[0];

//   return url;
// };

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
      date: new Date().toISOString().split("T")[0],
      status: "Applied",
    };
  } catch (error) {
    console.error("❌ Extract Job Data Crashed:", error);
    alert("An error occurred while saving. Check the console for details.");
    return null;
  }
};

function notifySidePanel(attempts = 0) {
  const isMainFrame = window.self === window.top;
  const currentUrl = extractJobLink();

  if (!isJobPage(currentUrl)) {
    if (isMainFrame && attempts === 0) {
      chrome.runtime.sendMessage({
        type: "JOB_UPDATED",
        payload: { job: null },
      });
    }
    return;
  }

  // IFRAME GUARD: Only frames that actually find data should talk
  // Main frame is allowed to proceed to extraction regardless
  const jobData = extractJobData(currentUrl);

  if (jobData?.jobTitle && jobData?.company) {
    chrome.runtime.sendMessage({
      type: "JOB_UPDATED",
      payload: { job: jobData },
    });
  } else if (attempts < 8) {
    // RETRY: If it's a job URL but elements haven't rendered yet
    setTimeout(() => notifySidePanel(attempts + 1), 700);
  }
}

const checkUrlChange = () => {
  if (!isExtensionActive) return;

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
    if (msg.isOpen) {
      isExtensionActive = msg.isOpen;
      if (window.self === window.top) {
        notifySidePanel();
      }
    }
  }

  if (msg.type === "GET_CURRENT_STATE" && window.self === window.top) {
    sendResponse({ job: extractJobData(null) });
  }
  return true;
});

// Watch for URL changes(Covers back/forward buttons and SPA navigation)
window.addEventListener("popstate", checkUrlChange);

// check the URL every second. This uses almost ZERO CPU.
setInterval(checkUrlChange, 1000);
