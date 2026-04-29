type MetricConfigItem = {
  key: string;
  title: string;
  description: string;
  value: string;
};

export const getMetricConfig = (analytics: any): MetricConfigItem[] => [
  {
    key: "ghosted",
    title: "Ghosting Alert",
    value: String(analytics.ghosted),
    description: "21+ days silent",
  },
  {
    key: "rejectionRate",
    title: "Rejection Rate",
    value: `${analytics.rejectionRate}%`,
    description: `${analytics.coldRejectRate}% CV Rejections`,
  },
  {
    key: "resumeStrength",
    title: "Resume Strength",
    value: `${analytics.resumeStrength}%`,
    description: "Applied → Interview Invite",
  },
  {
    key: "total",
    title: "Period Total",
    value: String(analytics.total),
    description: "Total applications",
  },
];

export const FUNNEL_CONFIG = [
  { key: "total", label: "Total Applied", color: "bg-indigo-500" },
  { key: "interviews", label: "Interviews", color: "bg-blue-500" },
  { key: "rejects", label: "Rejected", color: "bg-rose-500" },
  { key: "offers", label: "Offers", color: "bg-amber-500" },
] as const;
