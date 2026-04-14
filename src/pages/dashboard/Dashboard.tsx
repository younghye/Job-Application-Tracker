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
// import type { JobApplication } from "../../types/job";
import { useApplications } from "../../hooks/useApplications";
import { parseCustomDate } from "../../utils/jobUtils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

const Dashboard = () => {
  // const [data, setData] = useState<JobApplication[]>([]);
  const [viewType, setViewType] = useState<"weekly" | "monthly">("weekly");
  const [timeOffset, setTimeOffset] = useState(0);
  const data = useApplications(); // That's it! It handles fetching and listening.
  // useEffect(() => {
  //   chrome.storage.local.get("applicationList", (result) => {
  //     const list = result.applicationList as JobApplication[];
  //     if (list) setData(list);
  //   });
  // }, []);

  // --- 1. TIME FILTERING LOGIC ---
  const { labels, counts, periodLabel } = useMemo(() => {
    const getDS = (dateObj: Date | null) => {
      if (!dateObj) return null;
      return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
    };

    const now = new Date();
    let labels: string[] = [];
    let counts: number[] = [];
    let periodLabel = "";

    if (viewType === "weekly") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() - timeOffset * 7);
      startOfWeek.setHours(0, 0, 0, 0);

      const weekDaysStr: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const ds = getDS(d);
        if (ds) weekDaysStr.push(ds);
      }

      const endDate = new Date(startOfWeek);
      endDate.setDate(startOfWeek.getDate() + 6);

      periodLabel = `${startOfWeek.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
      labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      counts = new Array(7).fill(0);

      data.forEach((j) => {
        const jobDateStr = getDS(parseCustomDate(j.date));
        const dayIndex = jobDateStr ? weekDaysStr.indexOf(jobDateStr) : -1;
        if (dayIndex !== -1) counts[dayIndex]++;
      });

      return { labels, counts, periodLabel };
    } else {
      const targetMonthDate = new Date(
        now.getFullYear(),
        now.getMonth() - timeOffset,
        1,
      );
      const monthNum = targetMonthDate.getMonth();
      const yearNum = targetMonthDate.getFullYear();
      const daysInMonth = new Date(yearNum, monthNum + 1, 0).getDate();

      periodLabel = targetMonthDate.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      labels = Array.from({ length: daysInMonth }, (_, i) =>
        (i + 1).toString(),
      );
      counts = new Array(daysInMonth).fill(0);

      data.forEach((j) => {
        const d = parseCustomDate(j.date);
        if (d && d.getMonth() === monthNum && d.getFullYear() === yearNum) {
          counts[d.getDate() - 1]++;
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

    // const ghostLimit = new Date();
    // ghostLimit.setDate(ghostLimit.getDate() - 21);

    // const ghosted = data.filter(
    //   (j) => j.status === "Applied" && new Date(j.date) < ghostLimit,
    // ).length;
    const ghosted = data.filter((j) => {
      const jobDate = parseCustomDate(j.date);
      if (!jobDate || j.status !== "Applied") return false;

      // Create a new date object for the "Expiration Date"
      const ghostDay = new Date(jobDate);
      ghostDay.setDate(jobDate.getDate() + 21); // Add exactly 21 days

      // If the "Ghost Day" is earlier than Today, they've ghosted you
      return ghostDay < new Date();
    }).length;

    //     const ghosted = data.filter((j) => {
    //   const jobDate = parseCustomDate(j.date);
    //   if (!jobDate || j.status !== "Applied") return false;

    //   // 1. Get "Right Now" and set it to the very start of today
    //   const today = new Date();
    //   today.setHours(0, 0, 0, 0);

    //   // 2. Get the "Ghost Threshold" (21 days ago)
    //   const ghostLimit = new Date(today);
    //   ghostLimit.setDate(today.getDate() - 21);

    //   // 3. Normalize jobDate to midnight (just in case)
    //   const normalizedJobDate = new Date(jobDate);
    //   normalizedJobDate.setHours(0, 0, 0, 0);

    //   // A job is ghosted if it was applied for BEFORE the ghost limit
    //   // (e.g., Today is 22nd, limit is 1st. If job was 30th of last month, it's ghosted)
    //   return normalizedJobDate < ghostLimit;
    // }).length;

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
              width="w-full"
            />
            <FunnelStep
              label="Interviews"
              count={analytics.interviews}
              color="bg-blue-500"
              width="w-3/4"
            />
            <FunnelStep
              label="Rejected"
              count={analytics.rejects}
              color="bg-rose-500"
              width="w-1/2"
            />
            <FunnelStep
              label="Offers"
              count={analytics.offers}
              color="bg-amber-500"
              width="w-1/4"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const MetricCard = ({ title, value, description, type, highlight }: any) => {
  const styles: any = {
    danger: "bg-red-50 border-red-100 text-red-600",
    warning: "bg-orange-50 border-orange-100 text-orange-600",
    info: "bg-indigo-50 border-indigo-100 text-indigo-600",
    success: "bg-emerald-50 border-emerald-100 text-emerald-600",
  };
  return (
    <div
      className={`${styles[type]} p-5 rounded-3xl border transition-all hover:shadow-md cursor-default`}
    >
      <h4 className="uppercase tracking-wider font-black opacity-60">
        {title}
      </h4>
      <p
        className={`text-3xl font-black my-1 ${highlight && type === "warning" ? "animate-pulse" : ""}`}
      >
        {value}
      </p>
      <p className="text-[11px] font-medium opacity-80">{description}</p>
    </div>
  );
};

const FunnelStep = ({ label, count, color, width }: any) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex justify-between text-[11px] font-bold text-gray-500 px-1">
      <span>{label}</span>
      <span className="text-gray-900">{count}</span>
    </div>
    <div className="h-7 w-full bg-gray-50 rounded-xl overflow-hidden p-0.5 border border-gray-100/50">
      <div
        className={`h-full ${color} ${width} transition-all duration-1000 rounded-[9px] shadow-sm`}
      />
    </div>
  </div>
);

export default Dashboard;
