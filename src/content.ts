import type { JobApplication } from "./types/job";
let lastUrl = "";
let isExtensionActive = false;
export const isJobPage = (url: string): boolean => {
  console.log("Checking if URL is a job page:", url);
  if (!url) return false;

  const urlLower = url.toLowerCase();

  // 1. High-confidence markers (If these exist, it's almost certainly a job)
  const hasSpecificJobId = [
    "currentjobid=",
    "jobid=",
    "job_id=",
    "joblistingid=",
    "jk=", // Indeed
    "jl=", // Glassdoor
  ].some((p) => urlLower.includes(p));

  if (hasSpecificJobId) return true;

  try {
    const urlObj = new URL(urlLower);

    // 2. Normalize the Path (Crucial Fix)
    // Remove trailing slash so "/jobs/" becomes "/jobs"
    const path = urlObj.pathname.replace(/\/$/, "");

    // 3. Define Generic "Listing" Roots
    // We want to return FALSE if the path is EXACTLY one of these
    const genericPaths = [
      "/jobs",
      "/job",
      "/careers",
      "/career",
      "/jobs/search",
      "/jobs/collections",
      "/jobs/tracker",
      "index.htm",
      "search.htm",
    ];

    const isGenericRoot = genericPaths.some((p) => path === p);

    // 4. Define Valid "Job" Path Patterns
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

    // LOGIC:
    // - If it's a generic root (like /jobs), it's FALSE.
    // - If it's not a root, but has a job-like path (like /jobs/123), it's TRUE.
    console.log(
      `URL Path: "${path}", isGenericRoot: ${isGenericRoot}, hasJobPathPattern: ${hasJobPathPattern}`,
    );
    console.log("Final Determination:", hasJobPathPattern && !isGenericRoot);
    return hasJobPathPattern && !isGenericRoot;
  } catch (e) {
    console.error("Invalid URL:", url);
    return false;
  }
};

export const detectCompany = (): string => {
  const selectors = [
    // --- 1. Site-Specific High Confidence ---

    '[data-automation="advertiser-name"]', // Seek
    ".job-details-jobs-unified-top-card__company-name a", // LinkedIn
    ".jobs-unified-top-card__company-name a", // LinkedIn
    ".job-details-jobs-unified-top-card__company-name", // LinkedIn
    ".jobs-unified-top-card__company-name", // LinkedIn

    ".main-header-logo img", // Lever (Check ALT attribute)
    ".logo img", // Greenhouse (Check ALT attribute)
    ".logo",

    '[class*="employerNameHeading"]', // Glassdoor
    ".jobsearch-CompanyReview--full", // Indeed
    // --- 2. Common Data Attributes & Classes ---
    '[class*="companyName"]',
    '[class*="company-name"]',
    '[class*="hiring-organization"]',
    'a[href*="/company/"]',
    'a[aria-label^="Company,"]',

    // --- 3. Meta Tags (Hidden in <head>) ---
    // "meta[property='og:site_name']",
    // "meta[name='twitter:title']", // Often contains "Job at Company"
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

      // --- CLEANING LOGIC ---
      // --- JUNK FILTER (Same logic as Job Title fix) ---
      const isVisible =
        (element as HTMLElement).offsetWidth > 0 || element.tagName === "META";
      const junkRegex =
        /top job picks|recommended|suggested|search|careers|employment|recruitment|see more/i;
      const isJunk = junkRegex.test(text.toLowerCase());

      if (text.length > 1 && isVisible && !isJunk) {
        console.log(`✅ Company Found via "${selector}":`, text);
        return text;
      }
    }
  }

  // --- 4. ULTIMATE FALLBACK: Document Title ---
  // Many sites follow "Job Title - Company Name | Site"
  const titleParts = document.title.split(/[-|]/);
  if (titleParts.length > 1) {
    // Usually the company is the first or second part
    const potentialCompany = titleParts[0].trim();
    if (potentialCompany && potentialCompany.length > 2)
      return potentialCompany;
  }

  return "";
};

const detectJobTitle = (): string => {
  const selectors = [
    // 1. LinkedIn Detail Pane (The most specific)
    ".job-details-jobs-unified-top-card__job-title",
    ".job-details-jobs-unified-top-card__job-title a", // LinkedIn sometimes puts the title in the company name area
    ".jobs-unified-top-card__job-title",
    ".jobs-unified-top-card__job-title a",
    ".jobs-details-sidebar__title",

    '[data-automation="job-detail-title"]', // SEEK
    ".jobsearch-JobInfoHeader-title", // Indeed
    '[class*="JobDetails_jobTitle"]', // Glassdoor

    // 3. Scoped Search (Looking for h1 inside a 'main' or 'article' tag only)
    "h1",
    // "main h1",
    // "article h1",
    ".re-job-title", // Common in some regional sites
  ];
  for (const selector of selectors) {
    const el = document.querySelector(selector) as HTMLElement;

    if (el) {
      const text = el.innerText.trim();
      const isVisible = el.offsetWidth > 0 && el.offsetHeight > 0;
      const isJunk = /no\. 1|Employment|Recruitment|Career|Search/i.test(text);

      if (text.length > 3 && isVisible && !isJunk) {
        return text;
      }
    }
  }
  return "";
};

/**
 * Helper to ensure we aren't returning a generic search or "Jobs" home page
 */
const isSpecificJobUrl = (url: string): boolean => {
  const lowUrl = url.toLowerCase();
  // const genericPatterns = ["/jobs", "/search", "index.htm", "?q=", "keywords="];

  // If it ends exactly in /jobs or /jobs/, it's usually a root page

  // If it contains an ID or "view", it's usually specific
  const hasJobId = [
    "currentjobid",
    "jobid",
    "job_id",
    "/view/",
    "/job/",
    "/posting/",
  ].some((p) => lowUrl.includes(p));

  return hasJobId;
};

export const detectJobLink = () => {
  const url = window.location.href.toLowerCase();

  // --- 1. SITE-SPECIFIC "ACTIVE" SELECTORS ---
  // These target the specific job card or detail pane currently in view.

  // LinkedIn: Look for the active item in the list or the title in the detail pane
  if (url.includes("linkedin.com")) {
    const liActive = document.querySelector(
      '.job-card-container--active a, [aria-current="true"] a, .jobs-details-sidebar__title a',
    ) as HTMLAnchorElement;
    if (liActive?.href && !liActive.href.includes("/jobs/search"))
      return liActive.href;
  }

  // Seek: Target the specific title link in the detail view
  if (url.includes("seek.co.nz") || url.includes("seek.com.au")) {
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

  // Indeed: Target the job title in the right-hand "vjs" (Visual Job Search) pane
  if (url.includes("indeed.com")) {
    const indeedLink = document.querySelector(
      '.jobsearch-JobInfoHeader-title a, [class*="vjs-highlight"] a',
    ) as HTMLAnchorElement;
    if (indeedLink?.href) return indeedLink.href;
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

const extractJobId = (url: string): string => {
  if (!url) return "";
  const lowUrl = url.toLowerCase();

  // 1. Specific Key-Value patterns (Indeed, Glassdoor, Greenhouse, LinkedIn)
  // We look for common ID keys and capture the alphanumeric value
  const keyMatch = lowUrl.match(
    /(?:jk=|jl=|gh_jid=|currentjobid=|postingid=|joblistingid=)([a-z0-9_-]+)/,
  );
  if (keyMatch) return keyMatch[1];

  // 2. Path-based IDs (Seek, LinkedIn /view/, Lever)
  // We look for /job/ or /view/ followed by a sequence
  const pathMatch = lowUrl.match(/\/(?:job|view|interstitial)\/([a-z0-9_-]+)/);
  if (pathMatch) return pathMatch[1];

  // 3. The "Long Number" Fallback (The 8-12 digit string)
  const numericMatch = lowUrl.match(/(\d{8,12})/);
  if (numericMatch) return numericMatch[0];

  // 4. Ultimate Fallback: The "Clean" URL Path
  // If no ID is found, we use the URL without the "junk" (query params)
  // return lowUrl.split(/[?#]/)[0].replace(/\/$/, "");
  return url;
};

const extractJobData = (): JobApplication | null => {
  try {
    const jobTitle = detectJobTitle();
    const company = detectCompany();
    const link = detectJobLink();
    const jobId = extractJobId(link);
    console.log("Extracted Job Data:", { jobTitle, company, link, jobId });
    // const isValidRecord =
    //   jobId || (jobTitle && company && jobTitle !== company);

    // if (!isValidRecord) return null;

    return {
      id: jobId,
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
  const currentUrl = detectJobLink();

  // 1. FAST-FAIL: Exit if not a job-related URL
  if (!isJobPage(currentUrl)) {
    console.log(
      "Not a job page. URL:",
      currentUrl,
      isMainFrame,
      "Attempt:",
      attempts,
    );
    if (isMainFrame && attempts === 0) {
      // if (isMainFrame) {
      console.log("🚫 Main frame: Not a job page. Clearing.");
      sendToSidePanel(null);
    }
    return; // Stop here for all frames
  }

  // 2. IFRAME GUARD: Only frames that actually find data should talk
  // Main frame is allowed to proceed to extraction regardless

  // 3. EXTRACTION
  const jobData = extractJobData();
  if (jobData?.jobTitle) {
    // REMOVED: lastProcessedId check.
    // We send data every time this is called on a valid job page.
    console.log("🎯 Sending Job Data to Side Panel");
    sendToSidePanel(jobData);
  } else if (attempts < 8) {
    // 4. RETRY: If it's a job URL but elements haven't rendered yet
    setTimeout(() => notifySidePanel(attempts + 1), 700);
  }
}

// Helper to keep the messaging logic clean
function sendToSidePanel(job: JobApplication | null) {
  console.log("Sending Job Data to Side Panel:", { job });
  chrome.runtime.sendMessage({ type: "JOB_UPDATED", payload: { job: job } });
}
// Listen for triggers from Background or Side Panel
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type === "PANEL_STATUS") {
    console.log("Received PANEL_STATUS message:", msg);
    if (msg.isOpen) {
      isExtensionActive = msg.isOpen;
      if (window.self === window.top) {
        notifySidePanel();
      }
    }
  }

  if (msg.type === "REFRESH_JOB_DATA") notifySidePanel();

  if (msg.type === "GET_CURRENT_STATE" && window.self === window.top) {
    sendResponse({ job: extractJobData() });
  }
  return true;
});

// Event-driven: Watch for clicks (LinkedIn/Seek sidebars)
// window.addEventListener("click", () => setTimeout(notifySidePanel, 3000));
// window.addEventListener(
//   "click",
//   () => {

//     setTimeout(notifySidePanel, 1000);
//   },
//   true,
// );

const checkUrlChange = () => {
  if (!isExtensionActive) return;

  const currentUrl = detectJobLink();
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    console.log("URL Change detected:", lastUrl);

    setTimeout(notifySidePanel, 1000);
  }
};

// 2. Watch for URL changes
// (Covers back/forward buttons and SPA navigation)
window.addEventListener("popstate", checkUrlChange);

// 3. The "Safety Net"
// Since some SPAs use pushState without triggering popstate,
// we check the URL every second. This uses almost ZERO CPU.
setInterval(checkUrlChange, 1000);
// Hack for SPAs: Watch for URL changes by intercepting history pushes
// let lastUrl = location.href;
// new MutationObserver(() => {
//   const url = location.href;
//   if (url !== lastUrl) {
//     lastUrl = url;
//     console.log("Navigation detected:", url);
//     // Reset state and try to extract
//     lastProcessedId = "";
//     setTimeout(notifySidePanel, 1500); // Give LinkedIn time to render the new view
//   }
// }).observe(document, { subtree: true, childList: true });
