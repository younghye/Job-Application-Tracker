import type { JobApplication } from "./types/job";

export const isJobPage = (url: string): boolean => {
  console.log("Checking if URL is a job page:", url);
  if (!url) return false;

  const urlLower = url.toLowerCase();
  let urlObj: URL;

  try {
    urlObj = new URL(urlLower);
  } catch (e) {
    console.error("Invalid URL:", url);
    return false;
  }

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
};

export const detectCompany = (): string => {
  const selectors = [
    // --- 1. Site-Specific High Confidence ---
    ".main-header-logo img", // Lever (Check ALT attribute)
    ".logo img", // Greenhouse (Check ALT attribute)
    ".logo",
    '[data-automation="advertiser-name"]', // Seek
    ".job-details-jobs-unified-top-card__company-name a", // LinkedIn
    ".jobs-unified-top-card__company-name a", // LinkedIn
    ".job-details-jobs-unified-top-card__company-name", // LinkedIn
    ".jobs-unified-top-card__company-name", // LinkedIn

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
      console.log(`Company Element Found for Selector "${selector}":`, element);
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
      text = text
        .split("\n")[0] // Get first line only
        .replace(/Company, |at | - Senior| - Junior/gi, "") // Remove prefixes/suffixes
        .replace(/Logos?|Logo/gi, "") // Remove common "Logo" text from ALT tags
        .trim();

      if (text && text.length > 1) return text;
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
    console.log(`Job Title Element Found for Selector "${selector}":`, el);
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

let lastProcessedId = "";
function notifySidePanel(attempts = 0) {
  const currentUrl = detectJobLink();
  const currentId = extractJobId(currentUrl);

  // 1. QUICK EXIT: If we are NOT on a job page, clear the panel.
  // This must happen BEFORE the "Duplicate ID" check.
  if (!isJobPage(currentUrl)) {
    // if (window.self === window.top) {
    // Only clear if we actually had something stored previously
    console.log("🚫 Left job page. Clearing side panel.");
    sendToSidePanel(null);
    lastProcessedId = "";
    // }
    return;
  }

  // 2. FRAME CHECK: Stop non-essential iframes from processing job data
  const hasJobDetails = !!document.querySelector(
    "h1, .job-title, .jobs-details",
  );
  if (!hasJobDetails && attempts === 0) {
    return;
  }

  // 3. DUPLICATE CHECK: Now that we know we ARE on a job page,
  // check if we've already handled this specific ID.
  if (attempts === 0 && currentId && currentId === lastProcessedId) {
    return;
  }

  // 4. ATTEMPT EXTRACTION
  const jobData = extractJobData();

  // 5. SUCCESS: Send to Side Panel
  if (jobData && jobData.jobTitle && jobData.company) {
    lastProcessedId = jobData.id;
    console.log(`🎯 Job Found:`, jobData.jobTitle);
    sendToSidePanel(jobData);
    return;
  }

  // 6. RETRY LOGIC: URL is correct, but the DOM hasn't rendered yet
  if (attempts < 10) {
    setTimeout(() => notifySidePanel(attempts + 1), 500);
  } else {
    console.log("Giving up. DOM elements not found.");
    // Optional: Only clear if you want the panel empty when a load fails
    // sendToSidePanel(null);
  }
}
// function notifySidePanel(attempts = 0) {
//   // Step 0: Get the ID immediately from the URL/Link
//   const currentUrl = detectJobLink();
//   const currentId = extractJobId(currentUrl);

//   // If we are already on this job and this is the FIRST attempt of a new trigger, stop.
//   // (We allow attempts > 0 to continue so the current retry loop can finish)
//   if (attempts === 0 && currentId && currentId === lastProcessedId) {
//     console.log("Already tracking this ID. Ignoring duplicate trigger.");
//     return;
//   }

//   console.log(`Notify Side Panel Attempt ${attempts} | ID: ${currentId}`);

//   // 1. Quick Exit
//   if (!isJobPage(currentUrl)) {
//     console.log("Not a job page. Clearing side panel.");
//     sendToSidePanel(null);
//     lastProcessedId = "";
//     return;
//   }

//   // 2. Attempt Extraction
//   const jobData = extractJobData();

//   // 3. If extraction is complete
//   if (jobData && jobData.jobTitle && jobData.company) {
//     // Final check before sending
//     if (lastProcessedId === jobData.id) {
//       return;
//     }

//     lastProcessedId = jobData.id;
//     console.log("🎯 Job Data Found:", jobData);
//     sendToSidePanel(jobData);
//     return;
//   }

//   // 4. Retry Logic
//   if (attempts < 10) {
//     setTimeout(() => notifySidePanel(attempts + 1), 500);
//     return;
//   }

//   console.log("Giving up.");
//   sendToSidePanel(null);
// }
// function notifySidePanel(attempts = 0) {
//   const currentUrl = detectJobLink();
//   console.log("Notify Side Panel Attempt ", lastProcessedId);
//   // 1. Quick Exit: If it's definitely not a job page, clear the panel
//   if (!isJobPage(currentUrl)) {
//     console.log("Not a job page. Clearing side panel.");
//     sendToSidePanel(null);
//     lastProcessedId = ""; // Reset so we can re-detect if they go back
//     return;
//   }

//   // 2. Attempt Extraction
//   const jobData = extractJobData();
//   console.log(`Attempt ${attempts}: Extracted Job Data:`, jobData);
//   // 3. Logic Gate: Do we have enough data?
//   if (jobData && jobData.jobTitle && jobData.company) {
//     if (lastProcessedId === jobData.id && jobData.jobTitle && jobData.company) {
//       console.log("Still on the same job, skipping update.", lastProcessedId);
//       return;
//     }
//     // 4392439074
//     // Only update lastProcessedId when extraction is complete
//     if (jobData.jobTitle && jobData.company) {
//       lastProcessedId = jobData.id;
//     }
//     console.log("🎯 Job Data Found:", jobData);
//     sendToSidePanel(jobData);
//     return;
//   } else if (attempts < 10) {
//     // RETRY: URL looks like a job, but DOM isn't ready yet
//     console.log(`Searching for DOM elements... Attempt ${attempts + 1}/10`);
//     setTimeout(() => notifySidePanel(attempts + 1), 500);
//   } else {
//     // FAILURE: We tried 10 times (5 seconds) and couldn't find the title/company
//     console.log("Giving up. DOM elements not found.");
//     sendToSidePanel(null);
//     return;
//   }
// }

// Helper to keep the messaging logic clean
function sendToSidePanel(jobData: JobApplication | null) {
  chrome.runtime.sendMessage(
    {
      type: "JOB_UPDATED",
      payload: { job: jobData },
    },
    () => {
      if (chrome.runtime.lastError) {
        // Ignore: happens if side panel is closed
      }
    },
  );
}
// let lastProcessedId = "";

// function notifySidePanel() {
//   let jobData: JobApplication | null = null;

//   const currentUrl = detectJobLink();

//   if (isJobPage(currentUrl)) {
//     // Always extract the latest data to ensure sidepanel is fresh
//     jobData = extractJobData();
//     // Only log/update tracker if it's a NEW job
//     if (jobData?.id && jobData?.id !== lastProcessedId) {
//       lastProcessedId = jobData.id;
//     }
//   }
//   // } else {
//   //   console.log("Not a job page or URL missing. Clearing side panel data.");
//   //   jobData = null;
//   // }
//   console.log("Sending to Side Panel:", jobData);

//   chrome.runtime.sendMessage(
//     {
//       type: "JOB_UPDATED",
//       payload: {
//         job: jobData, // Send the actual data, not the undefined variable
//       },
//     },
//     () => {
//       if (chrome.runtime.lastError) {
//         console.log("Side panel closed.");
//       }
//     },
//   );
// }
// Listen for triggers from Background or Side Panel
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Content script received message:", sender, msg);
  if (msg.type === "REFRESH_JOB_DATA") notifySidePanel();
  if (msg.type === "GET_CURRENT_STATE") sendResponse({ job: extractJobData() });
  return true;
});

// Event-driven: Watch for clicks (LinkedIn/Seek sidebars)
// window.addEventListener("click", () => setTimeout(notifySidePanel, 3000));
window.addEventListener(
  "click",
  () => {
    setTimeout(notifySidePanel, 5000);
  },
  true,
);

// Fallback Heartbeat: Safety net for silent React updates
// setInterval(notifySidePanel, 3000);
