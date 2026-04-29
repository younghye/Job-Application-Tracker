import type { JobApplication } from "../types/job";
import { extractJobId, normalizeDate } from "./jobUtils";

export const isJobPage = (url: string): boolean => {
  if (!url) return false;
  const urlLower = url.toLowerCase();

  // 1. High-confidence query params — almost certainly a specific job
  const jobIdParams = [
    "currentjobid=",
    "jobid=",
    "job_id=",
    "jobId=",
    "joblistingid=",
    "vjk=",
    "jk=",
    "jl=",
  ];
  if (jobIdParams.some((p) => urlLower.includes(p))) return true;

  // 2. ATS platforms where any path is a specific posting
  const atsHosts = ["apply.workable.com", "jobs.lever.co", "jobs.ashbyhq.com"];
  if (atsHosts.some((h) => urlLower.includes(h))) return true;

  try {
    const path = new URL(urlLower).pathname.replace(/\/$/, "");

    // Generic list/search pages — not a specific job
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
    if (genericPaths.some((p) => path === p)) return false;

    const jobPatterns = [
      "/job/",
      "/jobs/",
      "jobs.",
      "job.",
      "/view/",
      "/posting/",
      "/apply/",
      "/career/",
      "/careers/",
      "careers.",
      "career.",
    ];
    return jobPatterns.some((p) => urlLower.includes(p));
  } catch {
    return false;
  }
};

export const extractCompany = (): string => {
  const selectors = [
    '[data-automation="advertiser-name"]', // Seek
    ".job-details-jobs-unified-top-card__company-name a", // LinkedIn
    ".jobs-unified-top-card__company-name a", // LinkedIn
    ".job-details-jobs-unified-top-card__company-name", // LinkedIn
    ".jobs-unified-top-card__company-name", // LinkedIn
    ".main-header-logo img", // Lever (use alt)
    ".logo img", // Greenhouse (use alt)
    ".logo",
    '[class*="employerNameHeading"]', // Glassdoor
    '.jobsearch-JobInfoHeader [data-testid="inlineHeader-companyName"]', // Indeed (scoped to header)
    '.jobsearch-JobInfoHeader [data-testid="company-name"]',
    '[data-testid="inlineHeader-companyName"]',
    '[data-testid="company-name"]',
    '[class*="companyName"]',
    '[class*="company-name"]',
    '[class*="hiring-organization"]',
    'a[href*="/company/"]',
    'a[aria-label^="Company,"]',
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (!el) continue;

    const text =
      el.tagName === "IMG"
        ? el.getAttribute("alt") || ""
        : el.tagName === "META"
          ? el.getAttribute("content") || ""
          : (el as HTMLElement).innerText || "";

    const isVisible =
      (el as HTMLElement).offsetWidth > 0 || el.tagName === "META";
    const isJunk =
      /top job picks|recommended|suggested|employment|see more/i.test(text);

    if (text.length > 1 && isVisible && !isJunk) return text;
  }
  return "";
};

const extractJobTitle = (): string => {
  const selectors = [
    ".job-details-jobs-unified-top-card__job-title h1 a", // LinkedIn
    ".job-details-jobs-unified-top-card__job-title",
    ".job-details-jobs-unified-top-card__job-title a",
    ".jobs-unified-top-card__job-title",
    ".jobs-unified-top-card__job-title a",
    ".jobs-details-sidebar__title",
    '[data-automation="job-detail-title"]', // SEEK
    ".jobsearch-JobInfoHeader-title", // Indeed
    '[class*="JobDetails_jobTitle"]', // Glassdoor
    "h1",
    ".re-job-title",
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector) as HTMLElement;
    if (!el) continue;

    const text = el.innerText.trim().replace(/\s*[-–]\s*job\s*post\s*$/i, "");
    const isVisible = el.offsetWidth > 0 && el.offsetHeight > 0;
    const isJunk =
      /no\. 1|Employment|Recruitment|Career|Jobs for you|Search|^welcome[\s,]/i.test(
        text,
      );

    if (text.length > 3 && isVisible && !isJunk) return text;
  }
  return "";
};

// Parses JSON-LD structured data — most reliable source when available
const extractFromJsonLd = (): {
  title: string;
  company: string;
  link: string;
} | null => {
  const scripts = document.querySelectorAll(
    'script[type="application/ld+json"]',
  );

  for (const script of scripts) {
    try {
      const json = JSON.parse(script.textContent || "");
      // Handle @graph array, plain array, or single object
      const items: any[] = json["@graph"]
        ? json["@graph"]
        : Array.isArray(json)
          ? json
          : [json];

      for (const item of items) {
        const type = item["@type"];
        const isJobPosting =
          type === "JobPosting" ||
          (Array.isArray(type) && type.includes("JobPosting")) ||
          (typeof type === "string" && type.endsWith("JobPosting"));

        if (!isJobPosting) continue;

        const title = item.title || item.name || "";
        const company =
          item.hiringOrganization?.name ||
          item.hiringOrganization?.legalName ||
          "";
        const link =
          item.url ||
          document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
            ?.href ||
          window.location.href;

        if (title && company) return { title, company, link };
      }
    } catch {}
  }
  return null;
};

export const extractJobLink = (): string => {
  // Returns true if the URL points to a specific job (not a list/search page)
  const isSpecific = (u: string) =>
    ["currentjobid", "jobId", "jobid", "job_id", "/view/"].some((p) =>
      u.toLowerCase().includes(p),
    );
  if (isSpecific(window.location.href)) return window.location.href;

  // --- 1. SITE-SPECIFIC "ACTIVE" SELECTORS ---
  const url = window.location.href.toLowerCase();
  // LinkedIn: active job card or detail pane title
  if (url.includes("linkedin")) {
    const el = document.querySelector(
      '.job-card-container--active a, [aria-current="true"] a, .jobs-details-sidebar__title a',
    ) as HTMLAnchorElement;
    if (el?.href && !el.href.includes("/jobs/search")) return el.href;
  }

  // Seek: detail pane title, then active sidebar card
  if (url.includes("seek")) {
    const detailTitle = document.querySelector(
      '[data-automation="job-detail-title"]',
    );
    const detailLink = (detailTitle?.querySelector("a") ||
      detailTitle?.closest("a")) as HTMLAnchorElement;
    if (detailLink?.href) return detailLink.href;

    const cardLink = document.querySelector(
      '[class*="is-selected"] a, [aria-current="true"] a',
    ) as HTMLAnchorElement;
    if (cardLink?.href) return cardLink.href;
  }

  // Glassdoor: selected job card link
  if (url.includes("glassdoor")) {
    const activeItem = document.querySelector(
      'li[class*="selected"], [class*="JobCard_selected"], [data-test="jobListing"].selected, .selected',
    );
    const gdLink = activeItem?.querySelector(
      'a[data-test="job-link"]',
    ) as HTMLAnchorElement;
    // CRITICAL: don't return the generic search page
    if (gdLink?.href && !gdLink.href.includes("index.htm")) return gdLink.href;
  }

  // Indeed: direct job page, or active card in list
  if (url.includes("indeed")) {
    if (url.includes("vjk=")) return window.location.href;
    const activeCard = document.querySelector(
      '.vjs-highlight a[data-jk], [class*="selected"] a[data-jk], .jobsearch-ResultsList .selected a',
    ) as HTMLAnchorElement;
    const jkId =
      activeCard?.getAttribute("data-jk") ||
      activeCard?.closest("[data-jk]")?.getAttribute("data-jk");
    if (jkId) return `https://www.indeed.com/viewjob?jk=${jkId}`;
  }

  // --- 2. UNIVERSAL FALLBACKS (Greenhouse, Lever, Workday, company sites) ---

  // Canonical link — most reliable non-visual source
  const canonical = document.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (canonical?.href && isSpecific(canonical.href)) return canonical.href;

  // High-confidence data attributes used by ATS systems
  const dataLink = document.querySelector(
    '[data-automation*="title"] a, [data-test*="title"] a',
  ) as HTMLAnchorElement;
  if (dataLink?.href && isSpecific(dataLink.href)) return dataLink.href;

  return window.location.href;
};

/**
 * Fallback for standalone pages where DOM elements are hidden or obfuscated.
 * Parses the browser tab title (e.g., "Job Title | Company | LinkedIn").
 */
const extractFromTabTitle = (
  currentTitle: string,
  currentCompany: string,
): { title: string; company: string } => {
  const tabTitle = document.title;
  let title = currentTitle;
  let company = currentCompany;

  // 1. Try splitting by Pipe (|) first - this is standard for LinkedIn
  // It separates "Title - Context" from "Company"
  let parts = tabTitle.split(/\s*\|\s+/).map((p) => p.trim());

  // 2. Fallback: If no pipe, try the dashes
  if (parts.length < 2) {
    parts = tabTitle.split(/\s*[–-]\s+/).map((p) => p.trim());
  }

  if (parts.length >= 2) {
    // Clean up "(1) " notifications
    const potentialTitle = parts[0].replace(/^\(\d+\)\s+/, "");
    const potentialCompany = parts[1];

    if (
      !title &&
      potentialTitle.length > 3 &&
      !/login|jobs|search|welcome/i.test(potentialTitle)
    ) {
      title = potentialTitle;
    }

    // Validation: Ensure potentialCompany isn't just "LinkedIn"
    if (
      !company &&
      potentialCompany &&
      !/linkedin|indeed|seek|glassdoor|career/i.test(potentialCompany)
    ) {
      company = potentialCompany;
    }
  }

  return { title, company };
};

export const extractJobData = (url: string | null): JobApplication | null => {
  try {
    const link = url || extractJobLink();
    const ld = extractFromJsonLd();
    const resolvedLink = ld?.link || link;

    let jobTitle = ld?.title || extractJobTitle();
    let company = ld?.company || extractCompany();

    if (!jobTitle || !company) {
      const fallback = extractFromTabTitle(jobTitle, company);
      jobTitle = fallback.title;
      company = fallback.company;
    }

    return {
      id: crypto.randomUUID(),
      jobId: extractJobId(resolvedLink),
      jobTitle,
      company,
      link: resolvedLink,
      date: normalizeDate(new Date()),
      status: "Applied",
    };
  } catch (error) {
    console.error("❌ Extract Job Data Crashed:", error);
    return null;
  }
};
