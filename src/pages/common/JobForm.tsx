import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
    control,
    formState: { errors },
  } = useForm<JobApplicationFormData>({
    defaultValues: job || {},
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "interviews",
  });

  const clearForm = () => {
    reset({
      date: new Date().toISOString().split("T")[0],
      jobTitle: "",
      company: "",
      status: "Applied",
      link: "",
      note: "",
      interviews: [],
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

        <div className="flex flex-col md:col-span-2">
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
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center justify-between border-gray-100">
            <label className={labelClass}>Interviews</label>
            <button
              type="button"
              onClick={() =>
                append({ date: "", type: "" })
              }
              className={`${labelClass} text-indigo-600 hover:text-indigo-700`}
            >
              + Add Interview
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-3 bg-gray-50 rounded-md border border-gray-100 flex flex-col sm:flex-row gap-3 relative"
              >
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="absolute top-1 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all z-10"
                  aria-label="Remove interview"
                >
                  <span className="text-sm">✕</span>
                </button>
                <div className="flex-1 w-full">
                  <label className="text-xs font-bold text-gray-400 mb-1 block">
                    Type
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1st Interview"
                    {...register(`interviews.${index}.type` as const, {
                      required: "Required",
                    })}
                    className={inputClass}
                  />
                  {errors.interviews?.[index]?.type && (
                    <span className={errorClass}>
                      {errors.interviews[index].type?.message}
                    </span>
                  )}
                </div>

                <div className="flex-1 w-full">
                  <label className="text-xs font-bold text-gray-400 mb-1 block">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    {...register(`interviews.${index}.date` as const, {
                      required: "Required",
                    })}
                    className={inputClass}
                  />
                  {errors.interviews?.[index]?.date && (
                    <span className={errorClass}>
                      {errors.interviews[index].date?.message}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:col-span-2">
          <label className={labelClass}>Note</label>
          <textarea
            {...register("note")}
            rows={2}
            className={inputClass}
            placeholder="Any additional details..."
          />
        </div>

        <div className="flex justify-end gap-3 md:col-span-2">
          <button
            type="button"
            onClick={() => clearForm()}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-500 border border-gray-200 hover:bg-gray-100 transition-all"
          >
            Clear
          </button>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-10 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-green-100"
          >
            Save Application
          </button>
        </div>
      </div>
    </form>
  );
};
export default JobForm;
