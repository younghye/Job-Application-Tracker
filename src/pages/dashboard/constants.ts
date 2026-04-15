type MetricConfigItem = {
  key: string;
  title: string;
  description: string;
  suffix?: string;
};

export const METRIC_CONFIG: MetricConfigItem[] = [
  {
    key: "ghosted",
    title: "Ghosting Alert",
    description: "21+ days silent",
  },
  {
    key: "rejectionRate",
    title: "Rejection Rate",
    description: "Direct Rejections",
    suffix: "%",
  },
  {
    key: "resumeStrength",
    title: "Resume Strength",
    description: "Applied → Interview",
    suffix: "%",
  },
  {
    key: "total",
    title: "Period Total",
    description: "Total applications",
  },
] as const;

export const FUNNEL_CONFIG = [
  { key: "total", label: "Total Applied", color: "bg-indigo-500" },
  { key: "interviews", label: "Interviews", color: "bg-blue-500" },
  { key: "rejects", label: "Rejected", color: "bg-rose-500" },
  { key: "offers", label: "Offers", color: "bg-amber-500" },
] as const;
