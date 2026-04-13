import Modal from "react-modal";
import type { JobApplication } from "../../types/job";
import "../../assets/styles/form.css";

import JobForm from "../common/JobForm";

// Make sure to bind modal to your appElement (usually #root or #app)
Modal.setAppElement("#root");

interface EditModalProps {
  job: JobApplication | null;
  onClose: () => void;
  onEdit: (job: JobApplication) => void;
}

const EditModal = ({ job, onClose, onEdit }: EditModalProps) => {
  return (
    <Modal
      isOpen={job !== null}
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
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Edit Job Application</h2>
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
      <JobForm job={job} onUpsert={onEdit} />
    </Modal>
  );
};

export default EditModal;
