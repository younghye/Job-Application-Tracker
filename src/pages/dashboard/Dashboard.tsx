import { useMemo, useState, useEffect } from "react";
import { useApplications } from "../../hooks/useApplications";
import dayjs from "dayjs";
import MetricCard from "./MetricCard";
import FunnelStep from "./FunnelStep";
import VolumeChart from "./VolumeChart";
import UpcomingSchedule from "./UpcomingSchedule";
import { METRIC_CONFIG, FUNNEL_CONFIG } from "./constants";

const Dashboard = () => {
  const [viewType, setViewType] = useState<"weekly" | "monthly">("weekly");
  const [timeOffset, setTimeOffset] = useState(0);
  const data = useApplications();
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { labels, counts, periodLabel, analytics, upcomingInterviews } =
    useMemo(() => {
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

      // Upcoming Interviews
      const displayLimit = windowHeight > 850 ? 5 : 3;
      const upcomingInterviews = data
        .flatMap((job) =>
          (job.interviews || []).map((int) => ({
            ...int,
            company: job.company,
          })),
        )
        .filter((int) => dayjs(int.date).isAfter(now.subtract(20, "minute")))
        .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
        .slice(0, displayLimit);

      return {
        labels,
        counts,
        periodLabel,
        upcomingInterviews,
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
    }, [data, viewType, timeOffset, windowHeight]);

  return (
    <div className="flex-1 flex flex-col gap-8">
      {/* METRICS ROW */}
      <div className="shrink-0 h-auto lg:h-[17vh] lg:min-h-[120px] lg:max-h-[180px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:flex-1 lg:self-stretch lg:min-h-[400px]">
        {/* VOLUME CHART */}
        <div className="lg:col-span-2 flex flex-col p-6 rounded-3xl border border-gray-100 shadow-sm bg-white overflow-hidden">
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

        {/* STATUS OVERVIEW  */}
        <div className="flex flex-col bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <p className="font-black text-sm text-slate-500 uppercase tracking-widest mb-6 mt-2">
            Status Overview
          </p>
          <div className="flex flex-col gap-4">
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

        {/* UPCOMING SCHEDULE  */}
        <UpcomingSchedule upcomingInterviews={upcomingInterviews} />
      </div>
    </div>
  );
};

export default Dashboard;
