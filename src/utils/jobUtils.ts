import type { JobApplication } from "../types/job";

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

export const isJobPage = (url: string): boolean => {
  return JOB_PATTERNS.some((p) => url.toLowerCase().includes(p));
};

export const isExistJobByUrl = (
  url: string,
  list: JobApplication[],
): boolean => {
  if (!url) return false;

  // Removes query params, hashes, and trailing slashes for a fair comparison
  const clean = (u: string) => u.split("?")[0].split("#")[0].replace(/\/$/, "");
  const targetUrl = clean(url);

  return list.some((job) => clean(job.link) === targetUrl);
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

export const sortJobsByDate = (jobs: JobApplication[]) => {
  const sortedList = [...jobs].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Descending order
  });
  return sortedList;
};
