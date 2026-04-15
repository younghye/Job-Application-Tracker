import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  type ChartData,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useApplications } from "../../hooks/useApplications";
import dayjs from "dayjs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);
import MetricCard from "./MetricCard";
import FunnelStep from "./FunnelStep";

const Dashboard = () => {
  const [viewType, setViewType] = useState<"weekly" | "monthly">("weekly");
  const [timeOffset, setTimeOffset] = useState(0);
  const data = useApplications();

  // --- 1. TIME FILTERING LOGIC ---
  const { labels, counts, periodLabel } = useMemo(() => {
    const now = dayjs();
    let labels: string[] = [];
    let counts: number[] = [];
    let periodLabel = "";

    if (viewType === "weekly") {
      // 1. Get the start of the week (Sunday) based on the timeOffset
      const startOfWeek = now.subtract(timeOffset, "week").startOf("week");
      const endOfWeek = startOfWeek.endOf("week");

      // 2. Format the period label (e.g., "Apr 12 - Apr 18")
      periodLabel = `${startOfWeek.format("MMM D")} - ${endOfWeek.format("MMM D")}`;

      labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      counts = new Array(7).fill(0);

      // 3. Fill the counts
      data.forEach((j) => {
        const jobDate = dayjs(j.date);
        if (
          jobDate.isAfter(startOfWeek.subtract(1, "ms")) &&
          jobDate.isBefore(endOfWeek.add(1, "ms"))
        ) {
          const dayIndex = jobDate.day(); // 0 (Sun) to 6 (Sat)
          counts[dayIndex]++;
        }
      });

      return { labels, counts, periodLabel };
    } else {
      // 1. Get the target month based on timeOffset
      const targetMonth = now.subtract(timeOffset, "month").startOf("month");
      const daysInMonth = targetMonth.daysInMonth();

      periodLabel = targetMonth.format("MMMM YYYY");
      labels = Array.from({ length: daysInMonth }, (_, i) =>
        (i + 1).toString(),
      );
      counts = new Array(daysInMonth).fill(0);

      // 2. Fill the counts
      data.forEach((j) => {
        const jobDate = dayjs(j.date);
        // Check if the job's month and year match our target view
        if (jobDate.isSame(targetMonth, "month")) {
          const dayOfMonth = jobDate.date(); // 1 - 31
          counts[dayOfMonth - 1]++;
        }
      });

      return { labels, counts, periodLabel };
    }
  }, [data, viewType, timeOffset]);

  const barData: ChartData<"bar"> = {
    labels,
    datasets: [
      {
        label: "Applications",
        data: counts,
        backgroundColor: "#6366f1",
        borderRadius: 4,
        barThickness: viewType === "weekly" ? 28 : ("flex" as any),
      },
    ],
  };

  const analytics = useMemo(() => {
    const total = data.length;
    const interviews = data.filter((j) => j.status === "Interview").length;
    const rejects = data.filter((j) => j.status === "Rejected").length;
    const offers = data.filter((j) => j.status === "Offer").length;

    const ghosted = data.filter((j) => {
      const jobDate = dayjs(j.date);

      if (!jobDate.isValid() || j.status !== "Applied") return false;

      // 3. Check if the job was applied for more than 21 days ago
      // .startOf('day') ensures we compare from midnight to midnight
      const ghostLimit = dayjs().startOf("day").subtract(21, "day");
      return jobDate.isBefore(ghostLimit);
    }).length;

    return {
      total,
      ghosted,
      interviews,
      rejects,
      offers,
      rejectionRate: total ? Math.round((rejects / total) * 100) : 0,
      resumeStrength: total ? Math.round((interviews / total) * 100) : 0,
    };
  }, [data]);

  if (data.length === 0)
    return (
      <div className="p-10 text-center text-gray-400">
        No application data yet.
      </div>
    );
  const widthValue = (count: number) => {
    return analytics.total > 0 ? `${(count / analytics.total) * 100}%` : "0%";
  };
  return (
    <div className="space-y-6 p-2">
      {/* SECTION 1: METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Ghosting Alert"
          value={analytics.ghosted}
          description="21+ days silent"
          type="warning"
          highlight={analytics.ghosted > 0}
        />
        <MetricCard
          title="Rejection Rate"
          value={`${analytics.rejectionRate}%`}
          description="Direct Rejections"
          type="danger"
        />
        <MetricCard
          title="Resume Strength"
          value={`${analytics.resumeStrength}%`}
          description="Applied → Interview"
          type="info"
        />
        <MetricCard
          title="Period Total"
          value={analytics.total}
          description="Total applications"
          type="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* SECTION 2: VOLUME CHART */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
          {/* Chart Header - h-10 ensures alignment with the right card */}
          <div className="flex items-center justify-between mb-8 h-10">
            <span className="font-black text-gray-500 uppercase tracking-widest">
              Application Volume
            </span>

            {/* CENTERED NAVIGATION */}
            <div className="flex items-center gap-2 bg-gray-50 p-1 px-2 rounded-2xl border border-gray-100">
              <button
                onClick={() => setTimeOffset((p) => p + 1)}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-400 hover:text-indigo-600"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <h3 className="text-sm font-bold text-gray-800 min-w-[130px] text-center">
                {periodLabel}
              </h3>

              <button
                onClick={() => setTimeOffset((p) => Math.max(0, p - 1))}
                disabled={timeOffset === 0}
                className={`p-1.5 rounded-xl transition-all ${timeOffset === 0 ? "opacity-20 grayscale cursor-not-allowed" : "hover:bg-white hover:shadow-sm text-gray-400 hover:text-indigo-600"}`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* TOGGLE GROUP */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => {
                  setViewType("weekly");
                  setTimeOffset(0);
                }}
                className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${viewType === "weekly" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Week
              </button>
              <button
                onClick={() => {
                  setViewType("monthly");
                  setTimeOffset(0);
                }}
                className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${viewType === "monthly" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Month
              </button>
            </div>
          </div>

          <div className="h-64 mt-auto">
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: "#f9fafb" },
                    ticks: {
                      stepSize: 1,
                      color: "#9ca3af",
                      font: { size: 10 },
                    },
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: "#9ca3af", font: { size: 10 } },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* SECTION 3: FUNNEL */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
          {/* Funnel Header - h-10 matches the left header height */}
          <div className="flex items-center mb-7 h-10">
            <h3 className="font-black text-gray-500 uppercase tracking-widest">
              Status Overview
            </h3>
          </div>

          <div className="space-y-5">
            <FunnelStep
              label="Total Applied"
              count={analytics.total}
              color="bg-indigo-500"
              width={widthValue(analytics.total)}
            />
            <FunnelStep
              label="Interviews"
              count={analytics.interviews}
              color="bg-blue-500"
              width={widthValue(analytics.interviews)}
            />
            <FunnelStep
              label="Rejected"
              count={analytics.rejects}
              color="bg-rose-500"
              width={widthValue(analytics.rejects)}
            />
            <FunnelStep
              label="Offers"
              count={analytics.offers}
              color="bg-amber-500"
              width={widthValue(analytics.offers)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
