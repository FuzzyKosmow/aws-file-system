/* eslint-disable react/prop-types */

const ConfirmModal = ({ message, onConfirm, onCancel, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-confirm">
      <div className="modal-content">
        <p>{message}</p>
        <button onClick={onConfirm} style={{ backgroundColor: "red" }}>
          Confirm
        </button>
        <button onClick={onCancel} style={{ backgroundColor: "grey" }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ConfirmModal;
