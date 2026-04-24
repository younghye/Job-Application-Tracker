import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { ChevronIcon } from "../../assets/Icons";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface VolumeChartProps {
  labels: string[];
  counts: number[];
  periodLabel: string;
  viewType: "weekly" | "monthly";
  timeOffset: number;
  setTimeOffset: React.Dispatch<React.SetStateAction<number>>;
  setViewType: React.Dispatch<React.SetStateAction<"weekly" | "monthly">>;
}

const VolumeChart = ({
  labels,
  counts,
  periodLabel,
  viewType,
  timeOffset,
  setTimeOffset,
  setViewType,
}: VolumeChartProps) => {
  const barData: ChartData<"bar"> = {
    labels,
    datasets: [
      {
        label: "Applications",
        data: counts,
        backgroundColor: "#6366f1",
        borderRadius: 6,
        barThickness: viewType === "weekly" ? 28 : ("flex" as any),
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e1b4b",
        padding: 12,
        titleFont: { size: 14, weight: "bold" },
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "#f9fafb" },
        ticks: {
          stepSize: 1,
          color: "#9ca3af",
          font: { size: 12, weight: 500 },
        },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#9ca3af", font: { size: 12, weight: 500 } },
      },
    },
  };

  return (
    <div className="flex flex-col h-full w-full min-h-0">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 shrink-0">
        <h4 className="font-black text-gray-400 uppercase tracking-widest">
          Application Volume
        </h4>

        {/* PERIOD NAVIGATION */}
        <div className="flex items-center gap-2 bg-gray-50 p-1 px-2 rounded-2xl border border-gray-100">
          <button
            onClick={() => setTimeOffset((p) => p + 1)}
            className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-400 hover:text-indigo-600"
          >
            <ChevronIcon direction="left" />
          </button>

          <h3 className="text-sm font-bold text-gray-800 min-w-[140px] text-center">
            {periodLabel}
          </h3>

          <button
            onClick={() => setTimeOffset((p) => Math.max(0, p - 1))}
            disabled={timeOffset === 0}
            className={`p-1.5 rounded-xl transition-all ${
              timeOffset === 0
                ? "opacity-20 grayscale cursor-not-allowed"
                : "hover:bg-white hover:shadow-sm text-gray-400 hover:text-indigo-600"
            }`}
          >
            <ChevronIcon direction="right" />
          </button>
        </div>

        {/* VIEW TOGGLE */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {(["weekly", "monthly"] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setViewType(type);
                setTimeOffset(0);
              }}
              className={`px-4 py-1.5 text-[12px] font-bold rounded-lg transition-all ${
                viewType === type
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {type === "weekly" ? "Week" : "Month"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Bar data={barData} options={options} />
      </div>
    </div>
  );
};

export default VolumeChart;
