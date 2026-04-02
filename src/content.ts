import type { JobApplication } from "./types/job";

// const JOB_PATTERNS = [
//   "/job",
//   "/jobs",
//   "career",
//   "careers",
//   "workday",
//   "greenhouse",
//   "lever",
//   "seek.co.nz",
//   "linkedin.com/jobs",
// ];

// export const isJobPage = (url: string): boolean => {
//   return JOB_PATTERNS.some((p) => url.toLowerCase().includes(p));
// };
// Look for indicators that we are on a SPECIFIC listing, not a general directory
export const isJobPage1 = (url: string): boolean => {
  const urlLower = url.toLowerCase();

  // If we found a specific job detail title in the DOM, it's definitely a job page
  const hasDetailTitle = !!document.querySelector(
    '[data-automation="job-detail-title"], [data-automation="jobTitle"]',
  );
  if (hasDetailTitle) return true;

  // Fallback to URL patterns
  return ["/job/", "/view/", "currentjobid"].some((p) => urlLower.includes(p));
};
export const isJobPage = (url: string): boolean => {
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
    "/view/",
    "/posting/",
    "/apply/",
    "/career/",
    "/careers/",
  ].some((p) => urlLower.includes(p));

  // 3. Refined Root Check
  // We only want to exclude it if it's the bare "search" or "listing" page without an ID
  const urlObj = new URL(urlLower);
  const isListingPage =
    urlObj.pathname.endsWith("/jobs") || urlObj.pathname.endsWith("/jobs/");

  // Logic: It's a job page if it has a specific ID parameter,
  // OR if it has a job path and isn't just the generic listing root.
  const result = hasSpecificJobId || (hasJobPath && !isListingPage);

  console.log("############# Checked if job page:", {
    url,
    hasSpecificJobId,
    hasJobPath,
    isListingPage,
    result,
  });

  return result;
};

export const detectCompany = (): string => {
  const selectors = [
    // --- 1. Site-Specific High Confidence ---
    ".main-header-logo img", // Lever (Check ALT attribute)
    ".logo img", // Greenhouse (Check ALT attribute)
    '[data-automation="advertiser-name"]', // Seek
    ".job-details-jobs-unified-top-card__company-name", // LinkedIn
    ".jobs-unified-top-card__company-name", // LinkedIn

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
export const detectJobLink2 = (): string => {
  // 1. THE GOLD STANDARD: Canonical Link
  // This is an SEO requirement. If they change this, they lose Google ranking.
  const canonical = document.querySelector(
    'link[rel="canonical"]',
  ) as HTMLLinkElement;
  if (canonical?.href && !canonical.href.includes("index.htm"))
    return canonical.href;

  // 2. SEARCH BY DATA ATTRIBUTES (High Stability)
  const dataLink = document.querySelector(
    [
      '[data-automation="job-detail-title"] a',
      '[data-test="job-title"] a',
      '[data-test="job-link"]',
    ].join(", "),
  ) as HTMLAnchorElement;
  if (dataLink?.href) return dataLink.href;

  // 3. SEARCH BY "SELECTED" STATE (Fuzzy Class Matching)
  // Instead of a full class name, we look for ANY class that INCLUDES "selected"
  const activeItem = document.querySelector(
    '[class*="selected"], [class*="active"], [aria-selected="true"]',
  );
  const nestedLink = activeItem?.querySelector("a");
  if (nestedLink?.href) return nestedLink.href;

  return window.location.href;
};

// export const detectJobLink = (): string | null => {
//   // 1. Look for the list item that has the "active" or "selected" styling
//   // Glassdoor typically uses a class containing "selected" or "active"
//   const activeJobItem = document.querySelector(
//     'li[class*="selected"], li[class*="active"], [data-test="jobListing"].selected',
//   );

//   if (activeJobItem) {
//     // 2. Find the job-link INSIDE only that specific active item
//     const link = activeJobItem.querySelector(
//       'a[data-test="job-link"]',
//     ) as HTMLAnchorElement;
//     if (link?.href) {
//       // Clean the URL (remove tracking parameters if you want)
//       console.log(
//         "Glassdoor Detected, looking for job link in job listing:",
//         link.href,
//       );
//       return link.href.split("?")[0];
//     }
//   }

//   // 3. Fallback: If the sidebar isn't cooperating, look at the right-hand detail pane
//   const detailTitleLink = document.querySelector(
//     '[data-test="jobDetails"] a[data-test="job-link"], #JDCol a',
//   ) as HTMLAnchorElement;

//   return detailTitleLink?.href || window.location.href;
// };
// export const detectJobLink = () => {
//   const currentUrl = window.location.href;

//   // If we are on Glassdoor, the address bar is often useless
//   if (currentUrl.includes("glassdoor")) {
//     document.querySelectorAll('a[data-test="job-link"]').forEach((link) => {
//       console.log("Glassdoor Detected, looking for job link in job listing:", {
//         link,
//       });
//     });
//   }

//   return currentUrl;
// };

/**
 * Helper to ensure we aren't returning a generic search or "Jobs" home page
 */
const isSpecificJobUrl = (url: string): boolean => {
  const lowUrl = url.toLowerCase();
  // const genericPatterns = ["/jobs", "/search", "index.htm", "?q=", "keywords="];

  // If it ends exactly in /jobs or /jobs/, it's usually a root page
  if (lowUrl.endsWith("/jobs") || lowUrl.endsWith("/jobs/")) return false;

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
      const jobTitle =
        document.querySelector("h1")?.innerText.trim() || document.title;
      const company = detectCompany();
      const link = detectJobLink();

      const isInvalid =
        !jobTitle || !company || !link || link.includes("about:blank");

      if (isInvalid) {
        alert("⚠️ Could not detect job details. Please add manually.");
        console.warn("Validation Failed:", { jobTitle, company, link });
        return;
      }

      const jobData: JobApplication = {
        id: crypto.randomUUID(),
        jobTitle,
        company,
        link: link,
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
// function observeNavigation() {
//   let lastUrl = location.href;

//   console.log("@@@@@@@@@");
//   const observer = new MutationObserver(() => {
//     if (location.href !== lastUrl) {
//       lastUrl = location.href;
//       syncJobTrackerUI(lastUrl);
//     }
//   });

//   observer.observe(document.querySelector("body")!, {
//     subtree: true,
//     childList: true,
//   });
// }

const syncJobTrackerUI = (url: string | null) => {
  const btn = document.getElementById("jobTrackerBtn");
  console.log("Syncing UI for URL:", url);

  if (url && isJobPage(url)) {
    console.log("@@@@@@@@@2");
    if (!btn) injectButton();

    chrome.runtime.sendMessage(
      { action: "CHECK_IF_SAVED", url: url },
      (response) => {
        updateButtonState(response.existed);
      },
    );
  } else {
    if (btn) btn.remove();
  }
};

export function extractJobData() {
  // const title = detectJobTitle();
  // const company = detectCompanyName();
  const url = detectJobLink();
  console.log("Extracted Job Data:", { url });
}
// 1. Keep track of the last ID we processed, not just the URL
let lastProcessedId = "";

function heartbeat() {
  const currentUrl = detectJobLink();

  // 1. Guard clause: if currentUrl is undefined or empty, return early
  if (!currentUrl) return;

  // 2. Extract a Unique ID (Very important for Seek/LinkedIn)
  // This regex looks for 8+ digit IDs or currentJobId=...
  const idMatch = currentUrl.match(/(\d{8,})|currentJobId=(\d+)/);
  const currentId = idMatch ? idMatch[0] : currentUrl;

  // 3. Only sync if the JOB changed (ignoring URL junk)
  if (currentId !== lastProcessedId) {
    console.log("🎯 Job Identity Changed:", currentId);
    lastProcessedId = currentId;

    // This updates your "Saved" or "Not Saved" state
    syncJobTrackerUI(currentUrl);
  }
  // 2. Safety Check: If the button was deleted by the site's React engine
  // but we are still on a job page, put it back.
  if (isJobPage(currentUrl) && !document.getElementById("jobTrackerBtn")) {
    injectButton();
  }
}

//   let lastUrl = location.href;

//   console.log("@@@@@@@@@");
//   const observer = new MutationObserver(() => {
//     if (location.href !== lastUrl) {
//       lastUrl = location.href;
//       syncJobTrackerUI(lastUrl);
//     }
//   });

//   observer.observe(document.querySelector("body")!, {
//     subtree: true,
//     childList: true,
//   });

// Start the Heartbeat instead of the Observer
console.log("🚀 Job Tracker Heartbeat Active");
setInterval(heartbeat, 500);

// Initial check for page load
syncJobTrackerUI(detectJobLink() || null);

// Start the script
// console.log("🚀 Job Tracker Extension Active");
// extractJobData();
// syncJobTrackerUI(detectJobLink());
// observeNavigation();
