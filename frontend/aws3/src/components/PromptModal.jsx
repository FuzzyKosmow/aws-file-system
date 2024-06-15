/* eslint-disable react/prop-types */
import { useState } from "react";

const PromptModal = ({ message, onSubmit, onCancel, isOpen }) => {
  const [inputValue, setInputValue] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(inputValue);
    setInputValue("");
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <p>{message}</p>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button onClick={handleSubmit} style={{ backgroundColor: "green" }}>
          Submit
        </button>
        <button onClick={onCancel} style={{ backgroundColor: "grey" }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PromptModal;
