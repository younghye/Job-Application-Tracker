import { useMemo, useEffect, useState } from "react";
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
import type { JobApplication } from "../../types/job";

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
  const [data, setData] = useState<JobApplication[]>([]);
  const [viewType, setViewType] = useState<"weekly" | "monthly">("weekly");
  const [timeOffset, setTimeOffset] = useState(0);

  useEffect(() => {
    chrome.storage.local.get("applicationList", (result) => {
      const list = result.applicationList as JobApplication[];
      if (list) setData(list);
    });
  }, []);

  // --- 1. TIME FILTERING LOGIC (Fixed for Dates without Hours) ---
  const { labels, counts, periodLabel } = useMemo(() => {
    const parseCustomDate = (dateStr: string) => {
      if (!dateStr || typeof dateStr !== "string") return null;
      const parts = dateStr.split("-");
      if (parts.length !== 3) return null;

      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months are 0-11
      const year = parseInt(parts[2], 10);

      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    };

    // 2. HELPER: Consistently gets "YYYY-MM-DD" for comparison
    const getDS = (dateObj: Date | null) => {
      if (!dateObj) return null;
      // Manually build string to avoid timezone shifting from toISOString
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, "0");
      const d = String(dateObj.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
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

      const filtered = data.filter((j) => {
        const jobDateObj = parseCustomDate(j.date);
        const jobDateStr = getDS(jobDateObj);
        return jobDateStr && weekDaysStr.includes(jobDateStr);
      });

      filtered.forEach((j) => {
        const jobDateObj = parseCustomDate(j.date);
        const jobDateStr = getDS(jobDateObj);
        const dayIndex = jobDateStr ? weekDaysStr.indexOf(jobDateStr) : -1;
        if (dayIndex !== -1) counts[dayIndex]++;
      });

      return { currentPeriodData: filtered, labels, counts, periodLabel };
    } else {
      // --- MONTHLY LOGIC ---
      const targetMonthDate = new Date(
        now.getFullYear(),
        now.getMonth() - timeOffset,
        1,
      );
      const monthNum = targetMonthDate.getMonth();
      const yearNum = targetMonthDate.getFullYear();

      const monthName = targetMonthDate.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      const daysInMonth = new Date(yearNum, monthNum + 1, 0).getDate();

      periodLabel = monthName;
      labels = Array.from({ length: daysInMonth }, (_, i) =>
        (i + 1).toString(),
      );
      counts = new Array(daysInMonth).fill(0);

      const filtered = data.filter((j) => {
        const d = parseCustomDate(j.date);
        if (!d) return false;
        return d.getMonth() === monthNum && d.getFullYear() === yearNum;
      });

      filtered.forEach((j) => {
        const d = parseCustomDate(j.date);
        if (d) {
          counts[d.getDate() - 1]++;
        }
      });

      return { currentPeriodData: filtered, labels, counts, periodLabel };
    }
  }, [data, viewType, timeOffset]);

  const barData: ChartData<"bar"> = {
    labels,
    datasets: [
      {
        label: "Applications",
        data: counts,
        backgroundColor: "#6366f1",
        borderRadius: 6,
        barThickness: viewType === "weekly" ? 24 : ("flex" as any), // 'flex' makes monthly bars auto-adjust
      },
    ],
  };

  const analytics = useMemo(() => {
    const total = data.length;
    const interviews = data.filter((j) => j.status === "Interview").length;
    const rejects = data.filter((j) => j.status === "Rejected").length;
    const offers = data.filter((j) => j.status === "Offer").length;

    const ghostLimit = new Date();
    ghostLimit.setDate(ghostLimit.getDate() - 14);

    const ghosted = data.filter(
      (j) => j.status === "Applied" && new Date(j.date) < ghostLimit,
    ).length;

    return {
      total,
      interviews,
      rejects,
      offers,
      ghosted,
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
          description="14+ days silent"
          type="warning"
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
          description="Apps in this range"
          type="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION 2: VOLUME BAR CHART (NOW INCLUDES HEADER CONTROLS) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                {viewType} Application Activity
              </span>
              <h3 className="text-lg font-black text-gray-800">
                {periodLabel}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => {
                    setViewType("weekly");
                    setTimeOffset(0);
                  }}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${viewType === "weekly" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                >
                  Week
                </button>
                <button
                  onClick={() => {
                    setViewType("monthly");
                    setTimeOffset(0);
                  }}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${viewType === "monthly" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                >
                  Month
                </button>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setTimeOffset((p) => p + 1)}
                  className="p-2 hover:bg-gray-100 rounded-full text-xs"
                >
                  ⬅️
                </button>
                <button
                  onClick={() => setTimeOffset((p) => Math.max(0, p - 1))}
                  disabled={timeOffset === 0}
                  className={`p-2 rounded-full text-xs ${timeOffset === 0 ? "opacity-20 cursor-default" : "hover:bg-gray-100"}`}
                >
                  ➡️
                </button>
              </div>
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
                    grid: { display: false },
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
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-[10px] font-black text-gray-400 uppercase mb-6 tracking-widest">
            Status Overview
          </h3>
          <div className="space-y-4">
            <FunnelStep
              label="Total Applied"
              count={analytics.total}
              color="bg-emerald-500"
              // color="bg-indigo-500"
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
              color="bg-red-500"
              width="w-1/2"
            />
            <FunnelStep
              label="Offers"
              count={analytics.offers}
              color="bg-yellow-500"
              width="w-1/4"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const MetricCard = ({ title, value, description, type }: any) => {
  const styles: any = {
    danger: "bg-red-50 border-red-100 text-red-600",
    warning: "bg-orange-50 border-orange-100 text-orange-600",
    info: "bg-indigo-50 border-indigo-100 text-indigo-600",
    success: "bg-emerald-50 border-emerald-100 text-emerald-600",
  };
  return (
    <div className={`${styles[type]} p-5 rounded-3xl border`}>
      <h4 className="text-[10px] uppercase tracking-wider font-black opacity-70">
        {title}
      </h4>
      <p className="text-3xl font-black my-1">{value}</p>
      <p className="text-[11px] font-medium opacity-80">{description}</p>
    </div>
  );
};

const FunnelStep = ({ label, count, color, width }: any) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between text-xs font-bold text-gray-600 px-1">
      <span>{label}</span>
      <span>{count}</span>
    </div>
    <div className="h-6 w-full bg-gray-50 rounded-lg overflow-hidden">
      <div
        className={`h-full ${color} ${width} transition-all duration-1000 rounded-lg`}
      />
    </div>
  </div>
);

export default Dashboard;
