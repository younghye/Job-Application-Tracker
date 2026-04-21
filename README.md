# Job Application Tracker

A Chrome extension that helps you track your job search — automatically captures job listings as you browse and gives you a dashboard to analyze your progress.

---

## Features

### Auto-Capture from Job Sites

The extension runs silently in the background on supported job boards. When you view a job listing, it automatically extracts the job title, company, and link — no copy-pasting needed. Supported sites include LinkedIn, Indeed, Glassdoor, Seek (AU/NZ), and most ATS platforms (Workday, Greenhouse, Lever, etc.).

### Side Panel

Click the extension icon to open a side panel. It pre-fills a form with the job data extracted from the current page. Review and submit with one click, or edit any field before saving.

### Applications Table

A full-featured table of all tracked applications with:

- Global search across all columns
- Filter by status (Applied, Interviewing, Rejected, Offer)
- Inline status updates via dropdown
- Edit modal for modifying any field
- Delete individual entries or clear all
- CSV export (Excel-compatible UTF-8) and import with duplicate detection

### Dashboard Analytics

Visual overview of your job search health:

- **Ghosting Alert** — applications with "Applied" status that are 21+ days old
- **Rejection Rate** — percentage of rejected applications
- **Resume Strength** — interview-to-application conversion rate
- **Volume Chart** — bar chart of daily application counts (weekly/monthly view with navigation)
- **Status Funnel** — visual pipeline from Total Applied → Interviews → Rejected → Offers

---

## How It Works

```
Job Listing Page
      │
      ▼
Content Script (content.ts)
  - Observes DOM & URL changes
  - Extracts job title, company, link, date
  - Uses CSS selectors + JSON-LD structured data
      │
      ▼
Background Service Worker (background.ts)
  - Receives JOB_UPDATED message
  - Deduplicates by jobId (hash of URL)
  - Relays data to side panel
  - Persists saves to chrome.storage.local
      │
      ▼
Side Panel / Dashboard (React UI)
  - Displays extracted data for review
  - Manages form submission
  - Reads stored applications for table & charts
```

All data is stored locally in your browser via `chrome.storage.local`. There is no backend, no account, and no data sent anywhere.

---

## Tech Stack

| Layer         | Technology                 |
| ------------- | -------------------------- |
| UI Framework  | React 19 + TypeScript      |
| Build Tool    | Vite 8                     |
| Styling       | Tailwind CSS 4             |
| Table         | TanStack Table v8          |
| Charts        | Chart.js + react-chartjs-2 |
| Forms         | react-hook-form            |
| CSV           | PapaParse                  |
| Dates         | Day.js                     |
| Notifications | react-hot-toast            |
| Extension API | Chrome Manifest V3         |

---

## Project Structure

```
src/
├── background.ts          # Service worker — storage, message relay, deduplication
├── content.ts             # Content script — DOM extraction, URL change detection
├── pages/
│   ├── sidepanel/         # Side panel entry point and UI
│   ├── applications/      # Applications table, columns, CSV service, edit modal
│   ├── dashboard/         # Dashboard metrics, funnel, volume chart
│   └── common/            # Shared Header and JobForm components
├── hooks/
│   └── useApplications.ts # Custom hook for reading from Chrome storage
├── utils/
│   ├── extractors.ts      # CSS selector strategies for job title/company
│   └── jobUtils.ts        # Date normalization, job ID extraction, sorting
└── types/
    └── job.ts             # JobApplication interface and STATUS_OPTIONS
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Google Chrome

### Install & Build

```bash
npm install
npm run build
```

This produces a `dist/` folder containing the built extension.

### Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

### Development

```bash
npm run dev
```

For extension changes, rebuild and reload the extension in `chrome://extensions` after each change.

---

## Data Model

```typescript
interface JobApplication {
  id: string; // UUID, internal primary key
  jobId: string; // Extracted from URL for deduplication
  jobTitle: string;
  company: string;
  link: string;
  date: string; // ISO format: YYYY-MM-DD
  status: string; // "Applied" | "Interviewing" | "Rejected" | "Offer"
  note?: string;
}
```

---

## CSV Import/Export

- **Export** generates a UTF-8 BOM CSV file (compatible with Excel) named `jobs_applications_export_YYYY-MM-DD.csv`
- **Import** maps CSV headers back to fields and skips entries whose `jobId` already exists in storage

---

## Supported Job Sites

The content script includes selector strategies for:

- LinkedIn Jobs
- Indeed
- Glassdoor
- Seek (AU/NZ)
- Workday ATS
- Greenhouse
- Lever
- Generic job listing pages (JSON-LD structured data fallback)
