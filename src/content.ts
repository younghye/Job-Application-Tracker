import type { JobApplication } from "./types/job";

const JOB_PATTERNS = [
  "/job",
  "/jobs",
  "career",
  "careers",
  "workday",
  "greenhouse",
  "lever",
  "seek.co.nz",
  "linkedin.com/jobs",
];

function isJobPage(url: string): boolean {
  return JOB_PATTERNS.some((p) => url.toLowerCase().includes(p));
}

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
      const link = window.location.href;

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

function detectCompany(): string {
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
}

const updateButtonState = (isSaved: boolean) => {
  const btn = document.getElementById("jobTrackerBtn") as HTMLButtonElement;
  if (!btn) return;

  btn.innerText = isSaved ? "✓ Saved" : "Add to Applied List";
  btn.disabled = isSaved;
  btn.style.backgroundColor = isSaved ? "#057642" : "#f59e0b";
};

function observeNavigation() {
  let lastUrl = location.href;

  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      syncJobTrackerUI(lastUrl);
    }
  });

  observer.observe(document.querySelector("body")!, {
    subtree: true,
    childList: true,
  });
}

const syncJobTrackerUI = (url: string) => {
  const btn = document.getElementById("jobTrackerBtn");
  if (isJobPage(url)) {
    if (!btn) injectButton();

    chrome.runtime.sendMessage(
      { action: "CHECK_IF_SAVED", url: url },
      (response) => {
        updateButtonState(response.isSaved);
      },
    );
  } else {
    if (btn) btn.remove();
  }
};
// Start the script
console.log("🚀 Job Tracker Extension Active");

syncJobTrackerUI(window.location.href);
observeNavigation();
