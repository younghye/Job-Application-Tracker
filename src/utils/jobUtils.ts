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

// export const extractJobId = (url: string): string => {
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
const hashString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString();
};
export const extractJobId = (url: string): string => {
  if (!url) return "";

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const searchParams = urlObj.search.toLowerCase();
    const hashParams = urlObj.hash.toLowerCase(); // Added for Slalom-style URLs

    // 1. STRICT QUERY/HASH PARAMS (Indeed, Slalom, Greenhouse)
    // We look for IDs in the ?query or the #hash part
    const combinedParams = searchParams + hashParams;
    const queryMatch = combinedParams.match(
      /(?:currentjobid|jk|jl|gh_jid|jobid|job_id|postingid|joblistingid|post|src)=([a-z0-9]{10,})/,
    );
    if (queryMatch) return queryMatch[1];

    // 2. STRICT NUMERIC PATHS (Seek, LinkedIn, Jobspace)
    // We only take it if the segment is PURELY numbers and 6+ digits
    const pathParts = pathname.split("/").filter(Boolean);
    const lastSegment = pathParts[pathParts.length - 1];

    if (/^\d{6,}$/.test(lastSegment)) {
      return lastSegment;
    }

    // 3. STRICT UUID/REFERENCE PATTERNS (Workday, UUIDs)
    const patternMatch = pathname.match(
      /(jr\d{4,}|r\d{4,}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/,
    );
    if (patternMatch) return patternMatch[0];

    // 4. FALLBACK: HASH THE URL
    // If it's "1068083-frontend-developer" or any other messy string,
    // we don't save that as the ID. We hash the URL instead.
    const cleanUrl = (urlObj.origin + urlObj.pathname).replace(/\/$/, "");
    return "h-" + hashString(cleanUrl);
  } catch (e) {
    return "h-" + hashString(url.trim().toLowerCase());
  }
};

export const parseCustomDate = (dateStr: string) => {
  if (!dateStr || typeof dateStr !== "string") return null;

  // 1. Break the string "20-04-2026" into an array: ["20", "04", "2026"]
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;

  // 2. Create a real Date object using (Year, MonthIndex, Day)
  // Note: Months in JS start at 0 (January is 0, so we do Month - 1)
  const d = new Date(
    parseInt(parts[2]), // Year: 2026
    parseInt(parts[1]) - 1, // Month: 03 (which is April)
    parseInt(parts[0]), // Day: 20
  );

  // 3. Check if the date is valid before returning it
  return isNaN(d.getTime()) ? null : d;
};
