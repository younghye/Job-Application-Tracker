import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import type { JobApplication, JobApplicationFormData } from "../../types/job";
import { STATUS_OPTIONS } from "../../types/job";

const inputClasses =
  "w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all";
const labelClasses = "text-sm font-bold text-gray-700  tracking-wide";
const errorClasses = "text-red-500 text-[11px] mt-1 font-bold";

interface JobFormProps {
  job: JobApplication | null;
  onUpsert: (job: JobApplication) => void;
}

const JobForm = ({ job, onUpsert }: JobFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobApplicationFormData>({
    defaultValues: job || {},
  });

  useEffect(() => {
    if (job) {
      reset(job);
    } else {
      reset({
        date: new Date().toISOString().split("T")[0],
        jobTitle: "",
        company: "",
        status: "Applied",
        link: "",
        note: "",
      });
    }
  }, [job, reset]);

  const onSubmit: SubmitHandler<JobApplicationFormData> = (data) => {
    const jobToSave = job
      ? { ...job, ...data }
      : { ...data, id: crypto.randomUUID() };
    onUpsert(jobToSave);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className={labelClasses}>Date</label>
          <input
            type="date"
            {...register("date", { required: "Required" })}
            className={inputClasses}
          />
          {errors.date && (
            <span className={errorClasses}>{errors.date.message}</span>
          )}
        </div>

        <div className="flex flex-col">
          <label className={labelClasses}>Status</label>
          <select
            {...register("status")}
            className={`${inputClasses} appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22gray%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col">
        <label className={labelClasses}>Job Title</label>
        <input
          type="text"
          placeholder="e.g. Senior Frontend Engineer"
          {...register("jobTitle", { required: "Required" })}
          className={inputClasses}
        />
        {errors.jobTitle && (
          <span className={errorClasses}>{errors.jobTitle.message}</span>
        )}
      </div>

      <div className="flex flex-col">
        <label className={labelClasses}>Company</label>
        <input
          type="text"
          placeholder="e.g. Google"
          {...register("company", { required: "Required" })}
          className={inputClasses}
        />
        {errors.company && (
          <span className={errorClasses}>{errors.company.message}</span>
        )}
      </div>

      <div className="flex flex-col">
        <label className={labelClasses}>Job Link</label>
        <input
          type="url"
          placeholder="https://linkedin.com/jobs/..."
          {...register("link", { required: "Required" })}
          className={inputClasses}
        />
        {errors.link && (
          <span className={errorClasses}>{errors.link.message}</span>
        )}
      </div>

      <div className="flex flex-col">
        <label className={labelClasses}>Note</label>
        <textarea
          {...register("note")}
          rows={3}
          className={inputClasses}
          placeholder="Any additional details..."
        />
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="bg-green-700 hover:bg-green-800 text-white px-8 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 shadow-md shadow-green-200"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default JobForm;
