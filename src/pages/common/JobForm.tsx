import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import type { JobApplication, JobApplicationFormData } from "../../types/job";
import { STATUS_OPTIONS } from "../../types/job";
import {
  inputClass,
  labelClass,
  errorClass,
  selectArrow,
} from "../../assets/styles/styles";
import { extractJobId } from "../../utils/jobUtils";

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

  const clearForm = () => {
    reset({
      date: new Date().toISOString().split("T")[0],
      jobTitle: "",
      company: "",
      status: "Applied",
      link: "",
      note: "",
    });
  };

  useEffect(() => {
    if (job) {
      reset(job);
    } else {
      clearForm();
    }
  }, [job, reset]);

  const onSubmit: SubmitHandler<JobApplicationFormData> = (data) => {
    const jobToSave = job
      ? { ...job, ...data }
      : { ...data, id: crypto.randomUUID(), jobId: extractJobId(data.link) };
    onUpsert(jobToSave);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className={labelClass}>Date</label>
          <input
            type="date"
            {...register("date", { required: "Required" })}
            className={inputClass}
          />
          {errors.date && (
            <span className={errorClass}>{errors.date.message}</span>
          )}
        </div>

        <div className="flex flex-col">
          <label className={labelClass}>Status</label>
          <select
            {...register("status")}
            className={`${inputClass} ${selectArrow}`}
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
        <label className={labelClass}>Job Title</label>
        <input
          type="text"
          placeholder="e.g. Senior Frontend Engineer"
          {...register("jobTitle", { required: "Required" })}
          className={inputClass}
        />
        {errors.jobTitle && (
          <span className={errorClass}>{errors.jobTitle.message}</span>
        )}
      </div>

      <div className="flex flex-col">
        <label className={labelClass}>Company</label>
        <input
          type="text"
          placeholder="e.g. Google"
          {...register("company", { required: "Required" })}
          className={inputClass}
        />
        {errors.company && (
          <span className={errorClass}>{errors.company.message}</span>
        )}
      </div>

      <div className="flex flex-col">
        <label className={labelClass}>Job Link</label>
        <input
          type="url"
          placeholder="https://linkedin.com/jobs/..."
          {...register("link", { required: "Required" })}
          className={inputClass}
        />
        {errors.link && (
          <span className={errorClass}>{errors.link.message}</span>
        )}
      </div>

      <div className="flex flex-col">
        <label className={labelClass}>Note</label>
        <textarea
          {...register("note")}
          rows={3}
          className={inputClass}
          placeholder="Any additional details..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => clearForm()}
          className="px-8 py-2 rounded-lg font-bold text-sm border border-gray-300 text-gray-600 hover:bg-gray-100 transition-all active:scale-95"
        >
          Clear
        </button>
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
