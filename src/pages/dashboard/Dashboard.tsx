import { useMemo, useState } from "react";
import { useApplications } from "../../hooks/useApplications";
import dayjs from "dayjs";
import MetricCard from "./MetricCard";
import FunnelStep from "./FunnelStep";
import VolumeChart from "./VolumeChart";
import { METRIC_CONFIG, FUNNEL_CONFIG } from "./constants";

const Dashboard = () => {
  const [viewType, setViewType] = useState<"weekly" | "monthly">("weekly");
  const [timeOffset, setTimeOffset] = useState(0);
  const data = useApplications();

  const { labels, counts, periodLabel, analytics } = useMemo(() => {
    const now = dayjs();
    const isWeekly = viewType === "weekly";
    const unit = isWeekly ? "week" : "month";

    const targetDate = now.subtract(timeOffset, unit);
    const start = targetDate.startOf(unit);
    const end = targetDate.endOf(unit);

    // Period Label Logic
    const periodLabel = isWeekly
      ? `${start.format("MMM D")} - ${end.format("MMM D")}`
      : start.format("MMMM YYYY");

    // Chart Labels & Counts
    const labels = isWeekly
      ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      : Array.from({ length: start.daysInMonth() }, (_, i) =>
          (i + 1).toString(),
        );

    const counts = new Array(labels.length).fill(0);

    data.forEach((j) => {
      const jobDate = dayjs(j.date);
      if (!jobDate.isValid()) return;

      if (isWeekly) {
        if (
          jobDate.isAfter(start.subtract(1, "ms")) &&
          jobDate.isBefore(end.add(1, "ms"))
        ) {
          counts[jobDate.day()]++;
        }
      } else if (jobDate.isSame(start, "month")) {
        counts[jobDate.date() - 1]++;
      }
    });

    // Analytics Calculation
    const total = data.length;

    // Status counts
    const getCount = (status: string) =>
      data.filter((j) => j.status === status).length;
    const interviews = getCount("Interviewing");
    const rejects = getCount("Rejected");
    const offers = getCount("Offer");

    // Ghosted: Applied > 21 days ago with no update
    const ghosted = data.filter((j) => {
      const jd = dayjs(j.date);
      return (
        jd.isValid() &&
        j.status === "Applied" &&
        jd.isBefore(now.subtract(21, "day"))
      );
    }).length;

    return {
      labels,
      counts,
      periodLabel,
      analytics: {
        total,
        ghosted,
        interviews,
        rejects,
        offers,
        rejectionRate: total ? Math.round((rejects / total) * 100) : 0,
        resumeStrength: total ? Math.round((interviews / total) * 100) : 0,
      },
    };
  }, [data, viewType, timeOffset]);

  return (
    <div className="flex flex-col gap-8 h-full min-h-0 overflow-y-auto pr-2">
      {/* SECTION 1: METRICS */}
      <div className="flex-none mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {METRIC_CONFIG.map((conf) => (
            <MetricCard
              key={conf.key}
              title={conf.title}
              value={`${analytics[conf.key as keyof typeof analytics]}${conf.suffix || ""}`}
              description={conf.description}
              type={conf.key}
            />
          ))}
        </div>
      </div>

      {/* SECTION 2 & 3: THE BALANCED ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[400px] mt-6">
        {/* CHART: Spans 2 columns, fills height */}
        <div className="lg:col-span-2 h-full">
          <VolumeChart
            labels={labels}
            counts={counts}
            periodLabel={periodLabel}
            viewType={viewType}
            timeOffset={timeOffset}
            setTimeOffset={setTimeOffset}
            setViewType={setViewType}
          />
        </div>

        {/* FUNNEL: Spans 1 column, fills height */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
          <h4 className="font-black text-gray-400 uppercase tracking-widest mb-6 shrink-0">
            Status Overview
          </h4>

          <div className="flex-1 flex flex-col justify-center space-y-6">
            {FUNNEL_CONFIG.map((step) => {
              const count = analytics[step.key as keyof typeof analytics];
              const percentage =
                analytics.total > 0 ? (count / analytics.total) * 100 : 0;

              return (
                <FunnelStep
                  key={step.key}
                  label={step.label}
                  count={count}
                  color={step.color}
                  width={`${percentage}%`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
