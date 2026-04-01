import type { JobApplication } from "./types/job";
import { detectCompany, isJobPage } from "./utils/jobUtils";

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
        updateButtonState(response.existed);
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
