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

/**
 * Checks if the current URL matches common job board patterns
 */
function isJobPage(url: string): boolean {
  return JOB_PATTERNS.some((p) => url.toLowerCase().includes(p));
}

/**
 * Injects the floating button into the DOM
 */
function injectButton() {
  // Prevent duplicate buttons
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
    background: "#f59e0b", // LinkedIn Green style
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
      console.log("Button clicked!"); // See if the click even registers

      const jobTitle =
        document.querySelector("h1")?.innerText.trim() || document.title;
      const company = detectCompany();
      const url = window.location.href;

      // Check if the data is actually useful
      const isInvalid = !jobTitle || !url || url.includes("about:blank");

      if (isInvalid) {
        alert(
          "⚠️ Could not detect job details. Please ensure you are on a job description page.",
        );
        console.warn("Validation Failed:", { jobTitle, company, url });
        return; // Stop execution here
      }

      const jobData: JobApplication = {
        id: crypto.randomUUID(),
        jobTitle,
        company,
        url,
        date: new Date().toISOString().split("T")[0],
        status: "Applied",
      };

      console.log("🎯 Tracking Job:", jobData);

      chrome.storage.local.get(["applicationList"], async (result) => {
        const list = (result.applicationList as JobApplication[]) || [];
        list.push(jobData);
        chrome.storage.local.set({ applicationList: list }, () => {
          // Visual feedback for success
          // btn.style.background = "#10b981"; // Green
          // btn.innerText = "✅ Saved!";
          btn.style.background = "#057642";
          btn.innerText = "✓ Saved";
          console.log("🎯 Job Saved Successfully:", jobData);
        });
      });
    } catch (error) {
      console.error("❌ Click Handler Crashed:", error);
      alert("An error occurred while saving. Check the console for details.");
    }
  });

  document.body.appendChild(btn);
}

/**
 * Basic company detection based on common site selectors
 */
function detectCompany(): string {
  const selectors = [
    '[class*="companyName"]',
    '[data-automation="advertiser-name"]', // Seek
    "meta[property='og:site_name']",
    // LinkedIn specific
    ".job-details-jobs-unified-top-card__company-name",
    ".jobs-unified-top-card__company-name",
    ".job-details-public-header-v2__company-name",
    ".company-name",
    ".hiring-organization",
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el)
      return (
        el instanceof HTMLMetaElement
          ? el.content
          : (el as HTMLElement).innerText
      ).trim();
  }
  return "";
}

/**
 * Observes URL changes for SPAs (LinkedIn/Seek)
 */
// function observeNavigation() {
//   let lastUrl = location.href;

//   // Use a MutationObserver to catch internal navigation
//   const observer = new MutationObserver(() => {
//     if (location.href !== lastUrl) {
//       lastUrl = location.href;
//       console.log("🔗 Navigation detected:", lastUrl);

//       // Clean up old button if it exists
//       document.getElementById("jobTrackerBtn")?.remove();

//       if (isJobPage(lastUrl)) {
//         setTimeout(injectButton, 1000); // Wait for AJAX content to load
//       }

//       // Check for success page
//       // if (lastUrl.includes("success") || lastUrl.includes("thank")) {
//       //   handleSuccess();
//       // }
//     }
//   });

//   observer.observe(document.querySelector("body")!, {
//     subtree: true,
//     childList: true,
//   });
// }

// function handleSuccess() {
//   chrome.storage.local.get(["currentTracking"], (result) => {
//     if (result.currentTracking) {
//       const data = { ...result.currentTracking, status: "Applied" };
//       console.log("✅ Success! Job saved:", data);

//       // Here you would send data to your actual Database/Backend
//       // chrome.runtime.sendMessage({ type: "SAVE_TO_DB", data });

//       const btn = document.getElementById("jobTrackerBtn");
//       if (btn) {
//         btn.style.background = "#10b981";
//         btn.innerText = "Saved!";
//       }
//     }
//   });
// }

// Start the script
console.log("🚀 Job Tracker Extension Active");
if (isJobPage(window.location.href)) {
  injectButton();
}
// observeNavigation();
