import type { Interview } from "../../types/job";
import dayjs from "dayjs";

const UpcomingSchedule = ({
  upcomingInterviews,
}: {
  upcomingInterviews: (Interview & { company: string })[];
}) => {
  return (
    <div className="flex flex-col bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-6 mt-2">
        <p className="font-black text-sm text-slate-500 uppercase tracking-widest">
          Upcoming Interviews
        </p>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto pr-1">
        {upcomingInterviews.length > 0 ? (
          upcomingInterviews.map((int, i) => (
            <div key={i} className="relative pb-4 last:pb-0">
              <div className="flex flex-col p-3 rounded-2xl bg-slate-50 border border-slate-100/50 hover:bg-white hover:border-blue-100 hover:shadow-sm transition-all group">
                <p className="text-sm font-semibold text-slate-800 truncate mb-1">
                  {int.company}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
                  <span className="truncate shrink-0">{int.type}</span>
                  <span className="text-blue-600">
                    {dayjs(int.date).format("MMM D, h:mm A")}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex flex-col justify-center py-4 opacity-40">
            <p className="text-sm font-semibold text-slate-400">
              No interviews scheduled.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
export default UpcomingSchedule;
