export interface JobApplication {
  id: string;
  jobTitle: string;
  company: string;
  link: string;
  date: string;
  status: string;
  note?: string;
}

export const STATUS_OPTIONS = [
  "Applied",
  "Interviewing",
  "Rejected",
  "Ghosted",
  "Offer",
];
