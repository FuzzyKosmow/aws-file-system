/* eslint-disable react/prop-types */
//Single object item
import { useDispatch } from "react-redux";
const ObjectItem = ({ object, toggleSelection, isSelected }) => {
  // Key display: remove folder path
  const dispatch = useDispatch();
  const renderName = () => {
    const parts = object.Key.split("/");
    return shortenName(parts[parts.length - 1]);
  };
  const shortenName = (name) => {
    if (name.length > 40) {
      //Still show file type
      const extension = name.split(".").pop();
      return name.slice(0, 40) + "... ." + extension;
    }
    return name;
  };
  const formatTime = (time) => {
    return new Date(time).toLocaleString();
  };
  // If render name is empty, which means it is a folder passed as root
  return (
    <>
      {renderName() !== "" && (
        <li
          onClick={() => {
            dispatch(toggleSelection(object));
          }}
          className={`object-item ${isSelected ? "selected" : ""}`}
        >
          <span className="object-name">{renderName()}</span>
          <span className="object-details">
            <span className="object-type"> {object.Type}</span>

            <span className="object-size">Size: {object.Size} bytes</span>
            <span className="object-modified">
              Last modified: {formatTime(object.LastModified)}
            </span>
          </span>
        </li>
      )}
    </>
  );
};

export default ObjectItem;
