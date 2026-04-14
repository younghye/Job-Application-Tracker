export interface JobApplication {
  id: string;
  jobId: string; // Store extracted job ID from URL for deduplication
  jobTitle: string;
  company: string;
  link: string;
  date: string;
  status: string;
  note?: string;
}

export type JobApplicationFormData = Omit<JobApplication, "id">;

export const STATUS_OPTIONS = ["Applied", "Interviewing", "Rejected", "Offer"];
