import type { JobApplication } from "./types/job";

export const isJobPage = (url: string): boolean => {
  console.log("Checking if URL is a job page:", url);
  //https://jobs.ashbyhq.com/halter/c734a3e5-0d63-4cd3-9d82-ae2ec0f3ad84
  const urlLower = url.toLowerCase();

  // 1. High-confidence markers (Parameters that usually signify a specific record)
  const hasSpecificJobId = [
    "currentjobid=",
    "jobid=",
    "job_id=",
    "joblistingid=",
  ].some((p) => urlLower.includes(p));

  // 2. Path markers
  const hasJobPath = [
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

  // 3. Refined Root Check
  // We only want to exclude it if it's the bare "search" or "listing" page without an ID
  const urlObj = new URL(urlLower);
  const genericPages = [
    "/jobs",
    "/job",
    "/careers",
    "/career",
    "index.htm",
    "search.htm",
  ];
  const isListingPage = genericPages.some((page) =>
    urlObj.pathname.endsWith(page),
  );

  // Logic: It's a job page if it has a specific ID parameter,
  // OR if it has a job path and isn't just the generic listing root.
  const result = hasSpecificJobId || (hasJobPath && !isListingPage);

  return result;
};

export const detectCompany = (): string => {
  const selectors = [
    // --- 1. Site-Specific High Confidence ---
    ".main-header-logo img", // Lever (Check ALT attribute)
    ".logo img", // Greenhouse (Check ALT attribute)
    ".logo",
    '[data-automation="advertiser-name"]', // Seek
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
    "meta[property='og:site_name']",
    "meta[name='twitter:title']", // Often contains "Job at Company"
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
    '[data-automation="job-detail-title"]', // SEEK
    ".jobs-unified-top-card__job-title", // LinkedIn
    '[class*="JobDetails_jobTitle"]', // Glassdoor
    ".jobsearch-JobInfoHeader-title", // Indeed
    "main h1",
    "h1", // General Fallbacks
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
  return document.title.split(/[-|]/)[0].trim();
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

let currentUrl = detectJobLink();
let jobId = extractJobId(currentUrl);

function injectButton() {
  if (document.getElementById("jobTrackerBtn")) return;

  const btn = document.createElement("button");
  btn.id = "jobTrackerBtn";
  btn.innerText = "Add to Applied List";

  // Using a very high z-index to stay above LinkedIn/Seek headers
  Object.assign(btn.style, {
    position: "fixed",
    right: "20px",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: "2147483647",
    padding: "12px 20px",
    background: "#f59e0b",
    color: "white",
    borderRadius: "25px",
    cursor: "pointer",
    border: "none",
    fontWeight: "bold",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transition: "all 0.2s ease",
  });
  btn.addEventListener("click", () => {
    try {
      // const jobTitle =
      //   document.querySelector("h1")?.innerText.trim() || document.title;
      const jobTitle = detectJobTitle();
      const company = detectCompany();
      // const link = detectJobLink();

      const isInvalid =
        !jobTitle ||
        !company ||
        !currentUrl ||
        currentUrl.includes("about:blank");

      if (isInvalid) {
        alert("⚠️ Could not detect job details. Please add manually.");
        console.warn("Validation Failed:", { jobTitle, company, currentUrl });
        return;
      }

      const jobData: JobApplication = {
        id: jobId,
        jobTitle,
        company,
        link: currentUrl,
        date: new Date().toISOString().split("T")[0],
        status: "Applied",
      };
      console.log("🎯 Tracking Job:", jobData);

      // Send the "package" to the background script
      chrome.runtime.sendMessage(
        { action: "SAVE_JOB", data: jobData },
        (response) => {
          if (response.success) {
            updateButtonState(response.success);
            if (response.existed) {
              alert("This job is already in your list.");
            }
          }
        },
      );
    } catch (error) {
      console.error("❌ Click Handler Crashed:", error);
      alert("An error occurred while saving. Check the console for details.");
    }
  });

  document.body.appendChild(btn);
}

const updateButtonState = (isSaved: boolean) => {
  const btn = document.getElementById("jobTrackerBtn") as HTMLButtonElement;
  if (!btn) return;

  btn.innerText = isSaved ? "✓ Saved" : "Add to Applied List";
  btn.disabled = isSaved;
  btn.style.backgroundColor = isSaved ? "#057642" : "#f59e0b";
};

const syncJobTrackerUI = () => {
  const btn = document.getElementById("jobTrackerBtn");
  console.log("Syncing UI for URL:", currentUrl);

  if (currentUrl && isJobPage(currentUrl)) {
    console.log("@@@@@@@@@2");
    if (!btn) injectButton();

    chrome.runtime.sendMessage(
      { action: "CHECK_IF_SAVED", id: jobId },
      (response) => {
        updateButtonState(response.existed);
      },
    );
  } else {
    if (btn) btn.remove();
  }
};
// 1. Keep track of the last ID we processed, not just the URL
let lastProcessedId = "";

function heartbeat() {
  currentUrl = detectJobLink();

  if (!currentUrl) return;
  if (isJobPage(currentUrl)) {
    jobId = extractJobId(currentUrl);

    if (jobId !== lastProcessedId) {
      console.log("🎯 Job Identity Changed:", jobId);
      lastProcessedId = jobId;

      // syncJobTrackerUI();
      chrome.runtime.sendMessage(
        {
          type: "JOB_CHANGED",
          payload: {
            job: extractJobData(),
          },
        },
        () => {
          // Optional: handle error if sidepanel isn't open
          if (chrome.runtime.lastError) {
            console.log("Side panel likely closed, ignoring.");
          }
        },
      );
    }
  }
}

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.action === "EXTRACT_JOB") {
    sendResponse(extractJobData());
  }
});

const extractJobData = (): JobApplication | undefined => {
  try {
    const jobTitle = detectJobTitle();
    const company = detectCompany();
    const link = detectJobLink();
    const jobId = extractJobId(currentUrl);

    const jobData = {
      id: jobId,
      jobTitle,
      company,
      link,
      date: new Date().toISOString().split("T")[0],
      status: "Applied",
    };
    console.log("Extracted Job Data for Side Panel:", jobData);
    return jobData;
  } catch (error) {
    console.error("❌ Extract Job Data Crashed:", error);
    alert("An error occurred while saving. Check the console for details.");
    return undefined;
  }
};
// Start the script
console.log("🚀 Job Tracker Heartbeat Active");

setInterval(heartbeat, 500);

// Initial check for page load
syncJobTrackerUI();
