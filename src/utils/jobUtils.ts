import type { JobApplication } from "../types/job";

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

export const isExistJobByUrl = (
  url: string,
  list: JobApplication[],
): boolean => {
  if (!url) return false;
  /**
   * Universal ID and Path Extractor
   */
  const getUniversalIdentity = (u: string): string => {
    const lowUrl = u.toLowerCase();

    // 1. Target specific platform keys (captured group 1)
    // We use [a-z0-9_-] because many IDs (Indeed, Greenhouse, Lever) use letters/dashes
    const platformRegex =
      /(?:jl=|currentjobid=|jobid=|jk=|gh_jid=|\/job\/|jobs\/|postingid=)([a-z0-9_-]+)/;
    const platformMatch = lowUrl.match(platformRegex);

    if (platformMatch && platformMatch[1]) {
      return platformMatch[1];
    }

    // 2. Fallback: Extract the last meaningful segment of the path
    // Good for: jobs.lever.co/company/ID or workday sites
    try {
      const urlObj = new URL(u);
      const pathSegments = urlObj.pathname
        .split("/")
        .filter((s) => s.length > 0);

      if (pathSegments.length > 0) {
        const lastSegment = pathSegments[pathSegments.length - 1];

        // If the last segment looks like a slug or ID (contains numbers or is long)
        if (/[0-9]/.test(lastSegment) || lastSegment.length > 5) {
          return lastSegment;
        }
      }
    } catch (e) {
      // Fallback if URL constructor fails
    }

    // 3. Last Resort: Your original cleanup logic
    return lowUrl
      .replace(/^https?:\/\/(www\.)?/, "")
      .split(/[?#]/)[0]
      .replace(/\/$/, "");
  };

  const targetIdentity = getUniversalIdentity(url);

  // Security: Ignore generic search pages or roots
  const genericPages = ["/jobs", "/careers", "index.htm", "search.htm"];
  if (
    genericPages.some((p) => targetIdentity.endsWith(p)) ||
    targetIdentity.length < 10
  ) {
    return false;
  }

  return list.some((job) => {
    const existingIdentity = String(getUniversalIdentity(job.link));
    const targetIdentity = String(getUniversalIdentity(url));

    return existingIdentity === targetIdentity;
  });
};
// export const isExistJobByUrl = (url: string, list: any[]): boolean => {
//   if (!url || !list || list.length === 0) return false;

//   return list.some((job) => job.link === url);
// };
// export const detectCompany = (): string => {
//   const selectors = [
//     // --- 1. Site-Specific High Confidence ---
//     ".main-header-logo img", // Lever (Check ALT attribute)
//     ".logo img", // Greenhouse (Check ALT attribute)
//     '[data-automation="advertiser-name"]', // Seek
//     ".job-details-jobs-unified-top-card__company-name", // LinkedIn
//     ".jobs-unified-top-card__company-name", // LinkedIn

//     // --- 2. Common Data Attributes & Classes ---
//     '[class*="companyName"]',
//     '[class*="company-name"]',
//     '[class*="hiring-organization"]',
//     'a[href*="/company/"]',
//     'a[aria-label^="Company,"]',

//     // --- 3. Meta Tags (Hidden in <head>) ---
//     "meta[property='og:site_name']",
//     "meta[name='twitter:title']", // Often contains "Job at Company"
//   ];

//   for (const selector of selectors) {
//     const element = document.querySelector(selector);
//     if (element) {
//       let text = "";

//       // Special handling for Images (Lever/Greenhouse)
//       if (element.tagName === "IMG") {
//         text = element.getAttribute("alt") || "";
//       }
//       // Special handling for Meta tags
//       else if (element.tagName === "META") {
//         text = element.getAttribute("content") || "";
//       }
//       // Standard elements
//       else {
//         text = (element as HTMLElement).innerText || "";
//       }

//       // --- CLEANING LOGIC ---
//       text = text
//         .split("\n")[0] // Get first line only
//         .replace(/Company, |at | - Senior| - Junior/gi, "") // Remove prefixes/suffixes
//         .replace(/Logos?|Logo/gi, "") // Remove common "Logo" text from ALT tags
//         .trim();

//       if (text && text.length > 1) return text;
//     }
//   }

//   // --- 4. ULTIMATE FALLBACK: Document Title ---
//   // Many sites follow "Job Title - Company Name | Site"
//   const titleParts = document.title.split(/[-|]/);
//   if (titleParts.length > 1) {
//     // Usually the company is the first or second part
//     const potentialCompany = titleParts[0].trim();
//     if (potentialCompany && potentialCompany.length > 2)
//       return potentialCompany;
//   }

//   return "";
// };

export const sortJobsByDate = (list: JobApplication[]): JobApplication[] => {
  return [...list].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
};
