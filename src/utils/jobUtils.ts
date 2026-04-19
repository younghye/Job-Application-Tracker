import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import type { JobApplication } from "../types/job";

dayjs.extend(customParseFormat);

export const sortJobsByDate = (list: JobApplication[]): JobApplication[] => {
  return [...list].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
};

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
    const hashParams = urlObj.hash.toLowerCase();

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

// for saving  date in a consistent format regardless of user input
export const normalizeDate = (dateInput: string | Date): string => {
  if (!dateInput) return "";

  if (dateInput instanceof Date) {
    return dayjs(dateInput).format("YYYY-MM-DD");
  }

  // 2. If it's a string, use the strict format matching
  const formats = [
    "YYYY-MM-DD",
    "DD-MM-YYYY",
    "DD/MM/YYYY",
    "MM-DD-YYYY",
    "MM/DD/YYYY",
    "YYYY/MM/DD",
    "D MMM YYYY",
    "MMM D, YYYY",
  ];

  const d = dayjs(dateInput, formats);

  return d.isValid() ? d.format("YYYY-MM-DD") : "";
};
