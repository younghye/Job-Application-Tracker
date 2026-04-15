import { useForm } from "react-hook-form";
import type { JobApplication, JobApplicationFormData } from "../../types/job";
import type { SubmitHandler } from "react-hook-form";
import { STATUS_OPTIONS } from "../../types/job";
import { useEffect } from "react";
import "../../assets/styles/form.css";

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
      ? { ...job, ...data } // Updating existing
      : { ...data, id: crypto.randomUUID() }; // Creating new
    onUpsert(jobToSave);
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="form-group">
        <label>Date</label>
        <input
          type="date"
          {...register("date", { required: "This field is required" })}
          className="input"
        />
        {errors.date && (
          <span className="error-message">{errors.date.message}</span>
        )}
      </div>

      <div className="form-group">
        <label>Job Title</label>
        <input
          type="text"
          {...register("jobTitle", { required: "This field is required" })}
          className="input"
        />
        {errors.jobTitle && (
          <span className="error-message">{errors.jobTitle.message}</span>
        )}
      </div>

      <div className="form-group">
        <label>Company</label>
        <input
          type="text"
          {...register("company", { required: "This field is required" })}
          className="input"
        />
        {errors.company && (
          <span className="error-message">{errors.company.message}</span>
        )}
      </div>

      <div className="form-group">
        <label>Status</label>
        <select {...register("status")} className="input">
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Link</label>
        <input
          type="text"
          {...register("link", { required: "This field is required" })}
          className="input"
        />
        {errors.link && (
          <span className="error-message">{errors.link.message}</span>
        )}
      </div>

      <div className="form-group">
        <label>Note</label>
        <textarea {...register("note")} className="input" />
      </div>

      <div className="actions">
        <button type="submit" className="btn-primary ">
          Save
        </button>
      </div>
    </form>
  );
};

export default JobForm;
