import Modal from "react-modal";
import type { JobApplication } from "../../types/job";
import JobForm from "../common/JobForm";

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
      overlayClassName="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      className="bg-white w-full max-w-lg rounded-2xl shadow-xl outline-none flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200"
    >
      <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
        <h2 className="text-lg font-bold text-gray-800">
          Edit Job Application
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
        >
          &times;
        </button>
      </div>

      <div className="p-6 overflow-y-auto custom-scrollbar">
        <JobForm job={job} onUpsert={onEdit} />
      </div>
    </Modal>
  );
};

export default EditModal;
