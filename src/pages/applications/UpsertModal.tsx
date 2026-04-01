import Modal from "react-modal";
import type { JobApplication, JobApplicationFormData } from "../../types/job";
import "../../assets/styles/modal.css";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { STATUS_OPTIONS } from "../../types/job";

// Make sure to bind modal to your appElement (usually #root or #app)
Modal.setAppElement("#root");

interface UpsertModalProps {
  job: JobApplication | null;
  onClose: () => void;
  onUpsert: (job: JobApplication) => void;
}

const UpsertModal = ({ job, onClose, onUpsert }: UpsertModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobApplicationFormData>();

  const onSubmit: SubmitHandler<JobApplicationFormData> = (data) => {
    if (job) {
      // Update existing
      onUpsert({ ...job, ...data });
    } else {
      // Insert new
      const newJob: JobApplication = {
        id: crypto.randomUUID(),
        ...data,
      };
      onUpsert(newJob);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onRequestClose={onClose}
      overlayClassName="modal-overlay"
      className="modal-content"
    >
      <div
        className="modal-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
          {job ? "Edit Job Application" : "Add Job Application"}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "20px",
          }}
        >
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            defaultValue={job?.date}
            {...register("date", { required: "This field is required" })}
            className="modal-input"
          />
          {errors.date && (
            <span className="error-message">{errors.date.message}</span>
          )}
        </div>

        <div className="form-group">
          <label>Job Title</label>
          <input
            type="text"
            defaultValue={job?.jobTitle}
            {...register("jobTitle", { required: "This field is required" })}
            className="modal-input"
          />
          {errors.jobTitle && (
            <span className="error-message">{errors.jobTitle.message}</span>
          )}
        </div>

        <div className="form-group">
          <label>Company</label>
          <input
            type="text"
            defaultValue={job?.company}
            {...register("company", { required: "This field is required" })}
            className="modal-input"
          />
          {errors.company && (
            <span className="error-message">{errors.company.message}</span>
          )}
        </div>
        <div className="form-group">
          <label>Status</label>
          <select
            defaultValue={job?.status}
            className="modal-input"
            {...register("status")}
          >
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
            defaultValue={job?.link}
            {...register("link", { required: "This field is required" })}
            className="modal-input"
          />
          {errors.link && (
            <span className="error-message">{errors.link.message}</span>
          )}
        </div>

        <div className="form-group">
          <label>Note</label>
          <textarea
            defaultValue={job?.note}
            {...register("note")}
            className="modal-input"
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UpsertModal;
