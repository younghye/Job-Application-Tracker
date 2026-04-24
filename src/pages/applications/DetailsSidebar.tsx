import dayjs from "dayjs";
import type { JobApplication } from "../../types/job";
import { labelClass } from "../../assets/styles/styles";
interface DetailsSidebarProps {
  selectedJob: JobApplication;
  setSelectedJob: (job: JobApplication | null) => void;
  openEditModal: (job: JobApplication) => void;
  handleDelete: (id: string) => void;
}

const DetailsSidebar = ({
  selectedJob,
  setSelectedJob,
  openEditModal,
  handleDelete,
}: DetailsSidebarProps) => {
  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[60] transition-opacity duration-300 opacity-100"
        onClick={() => setSelectedJob(null)}
      />
      <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out border-l border-gray-100 translate-x-0">
        <div className="h-full bg-slate-50/30 overflow-y-auto">
          {/* HEADER */}
          <div className="p-6 bg-white border-b border-gray-100 shadow-sm relative">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-400"
              aria-label="Close"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-slate-900 leading-tight mb-1 pr-8">
              {selectedJob.company}
            </h2>
            <p className="text-lg text-slate-600 font-medium mb-1">
              {selectedJob.jobTitle}
            </p>
            <a
              href={selectedJob.link}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              Open Link <span className="text-xs">↗</span>
            </a>
          </div>

          {/* CONTENT SECTION */}
          <div>
            <div className="grid grid-cols-2 gap-px bg-gray-100 border-b border-gray-100">
              <div className="bg-white px-6 py-4">
                <p className={labelClass}>Current status</p>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-sm  ${
                    selectedJob.status === "Rejected"
                      ? "bg-red-50 text-red-600"
                      : "bg-indigo-50 text-indigo-600"
                  }`}
                >
                  {selectedJob.status}
                </span>
              </div>
              <div className="bg-white px-6 py-4">
                <p className={labelClass}>Date applied</p>
                <p className="text-sm text-slate-600 ">
                  {dayjs(selectedJob.date).format("MMM DD, YYYY")}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <section>
                <p className={`${labelClass} mb-2`}>Application notes</p>

                <div className="p-5 min-h-[70px] rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedJob.note}
                  </p>
                </div>
              </section>

              <section>
                <p className={`${labelClass} mb-2`}>Interview timeline</p>

                {(selectedJob.interviews ?? []).length > 0 ? (
                  [...(selectedJob.interviews || [])]
                    .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
                    .map((int, idx) => {
                      const isSingle = selectedJob.interviews?.length === 1;

                      return (
                        /* If single, remove the 'ml-2' and 'space-y-5' to keep it flush with the left */
                        <div
                          key={idx}
                          className={`${isSingle ? "" : "ml-2 space-y-5"}`}
                        >
                          <div className="flex gap-4 relative">
                            {/* 1. Only show the connecting line if NOT single AND NOT the last item */}
                            {!isSingle &&
                              idx !==
                                (selectedJob.interviews?.length || 0) - 1 && (
                                <div className="absolute left-[7px] top-5 w-[2px] h-full bg-gray-100" />
                              )}

                            {/* 2. Only show the Timeline Dot if NOT a single interview */}
                            {!isSingle && (
                              <div
                                className={`w-4 h-4 rounded-full border-2 border-white ring-1 z-10 mt-1 shrink-0 ${
                                  dayjs(int.date).isAfter(dayjs())
                                    ? "bg-amber-500 ring-amber-200"
                                    : "bg-slate-300 ring-slate-100"
                                }`}
                              />
                            )}

                            {/* 3. The Content Card */}
                            <div className="flex-1 bg-white p-3 rounded-xl border border-gray-100 shadow-sm mb-2">
                              <p className="text-sm text-slate-600 font-semibold">
                                {int.type}
                              </p>
                              <p className="text-sm text-slate-600 ">
                                {dayjs(int.date).format("MMM D, h:mm A")}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
                    <p className="text-sm text-slate-300">
                      No interviews scheduled.
                    </p>
                  </div>
                )}
              </section>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure?"))
                      handleDelete?.(selectedJob.id);
                    setSelectedJob(null);
                  }}
                  className="flex-1 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-2xl transition-all"
                >
                  Delete
                </button>

                <button
                  type="button"
                  onClick={() => {
                    openEditModal(selectedJob);
                    setSelectedJob(null);
                  }}
                  className="flex-1 py-2.5 text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-2xl transition-all shadow-sm"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DetailsSidebar;
