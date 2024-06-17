/* eslint-disable react/prop-types */
import { useDispatch } from "react-redux";

const FolderItem = ({
  folderName,
  openFolder,
  toggleSelection,
  isSelected,
  fullpath,
}) => {
  const dispatch = useDispatch();
  return (
    <li
      onDoubleClick={() => {
        openFolder(fullpath);
      }}
      onClick={() => {
        dispatch(toggleSelection(folderName));
      }}
      className={`folder-item ${isSelected ? "selected" : ""}`}
    >
      <div className="folder-content">
        <img src="folder.svg" alt="folder" className="folder-icon" />
        <p className="folder-name">{folderName}</p>
      </div>
    </li>
  );
};

export default FolderItem;
