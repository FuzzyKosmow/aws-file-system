import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { setSelectedObjects } from "../store/displaySlice";
import { setCurrentPath } from "../store/displaySlice";

// eslint-disable-next-line react/prop-types
const ObjectToolsBar = ({ refreshObjects }) => {
  const auth = useSelector((state) => state.auth.validAuthCred);
  const displayInfo = useSelector((state) => state.display.displayInfo);
  const dispatch = useDispatch();
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isDeletingFiles, setIsDeletingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloadingFile, setIsDownloadingFile] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [file, setFile] = useState(null);
  // Delete selected folder
  const deleteFolder = async () => {
    // Popup confirm
    setIsDeletingFolder(true);
    if (
      window.confirm(
        `Are you sure you want to delete folder ${displayInfo.selectedFolder}?`
      )
    ) {
      setIsDeletingFolder(true);
      await axios
        .post("http://localhost:5000/deleteFolder", {
          accessKeyId: auth.accessKey,
          secretAccessKey: auth.secretKey,
          region: auth.region,
          bucketName: displayInfo.selectedBucket,
          folderName: displayInfo.currentPath + displayInfo.selectedFolder,
        })
        .then(async () => {
          await refreshObjects();
        })
        .catch((error) => {
          console.error(error);
        });
    }
    setIsDeletingFolder(false);
  };

  // Delete selected files
  const deleteFiles = async () => {
    setIsDeletingFiles(true);
    try {
      if (
        window.confirm(
          `Are you sure you want to delete ${displayInfo.selectedObjects.length} objects?`
        )
      ) {
        displayInfo.selectedObjects.forEach(async (object) => {
          await axios.post("http://localhost:5000/deleteFile", {
            accessKeyId: auth.accessKey,
            secretAccessKey: auth.secretKey,
            region: auth.region,
            bucketName: displayInfo.selectedBucket,
            fileName: object.Key,
          });
        });
      }

      dispatch(setSelectedObjects([]));
    } catch (error) {
      console.error(error);
    } finally {
      await refreshObjects();
      setIsDeletingFiles(false);
    }
  };

  // Create a folder at the current path
  const createFolder = async () => {
    setIsCreatingFolder(true);
    const folderName = prompt("Enter folder name");
    if (folderName) {
      await axios
        .post("http://localhost:5000/createFolder", {
          accessKeyId: auth.accessKey,
          secretAccessKey: auth.secretKey,
          region: auth.region,
          bucketName: displayInfo.selectedBucket,
          folderName: displayInfo.currentPath + folderName,
        })
        .then(async () => {
          await refreshObjects();
        })
        .catch((error) => {
          console.error(error);
        });
    }
    setIsCreatingFolder(false);
  };

  // Move back one folder in the hierarchy
  const moveBackOneFolder = () => {
    const newPath =
      displayInfo.currentPath.split("/").slice(0, -2).join("/") + "/";
    dispatch(setCurrentPath(newPath));
  };

  // Upload file to selected bucket
  const uploadFile = async () => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      // Remove first /
      let path = displayInfo.currentPath.slice(1);
      // If last char is / , remove
      if (path[path.length - 1] === "/") {
        path = path.slice(0, -1);
      }
      formData.append("file", file);
      formData.append("accessKeyId", auth.accessKey);
      formData.append("secretAccessKey", auth.secretKey);
      formData.append("region", auth.region);
      formData.append("bucketName", displayInfo.selectedBucket);
      formData.append("path", path);
      await axios.post("http://localhost:5000/uploadFile", formData);

      dispatch(setFile(null));
    } catch (error) {
      console.error(error);
    } finally {
      await refreshObjects();
      setIsUploading(false);
    }
  };

  const downloadFile = async () => {
    try {
      setIsDownloadingFile(true);
      setDownloadProgress(0); // Initialize download progress

      // Take the first object of the selected objects.
      // If multiple, return.
      if (displayInfo.selectedObjects.length > 1) {
        return;
      }
      const resDataSize = await axios.post(
        "http://localhost:5000/downloadFileSize",
        {
          accessKeyId: auth.accessKey,
          secretAccessKey: auth.secretKey,
          region: auth.region,
          bucketName: displayInfo.selectedBucket,
          fileName: displayInfo.selectedObjects[0].Key,
        }
      );
      // In bytes
      const totalSize = resDataSize.data;

      const response = await axios.post(
        "http://localhost:5000/downloadFile",
        {
          accessKeyId: auth.accessKey,
          secretAccessKey: auth.secretKey,
          region: auth.region,
          bucketName: displayInfo.selectedBucket,
          fileName: displayInfo.selectedObjects[0].Key,
        },
        {
          responseType: "blob",
          onDownloadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / totalSize
            );
            setDownloadProgress(progress);
          },
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: response.headers["content-type"] })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", displayInfo.selectedObjects[0].Key);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
    }
    setIsDownloadingFile(false);
  };

  return (
    <>
      <div className="object-tools">
        <div className="right">
          <button
            onClick={deleteFolder}
            disabled={displayInfo.selectedFolder === ""}
            style={{
              backgroundColor: displayInfo.selectedFolder ? "red" : "grey",
            }}
          >
            {isDeletingFolder ? (
              <div className="loading"></div>
            ) : (
              "Delete folder"
            )}
          </button>

          <button onClick={createFolder} style={{ backgroundColor: "green" }}>
            {isCreatingFolder ? (
              <div className="loading"></div>
            ) : (
              "Create folder"
            )}
          </button>
          <button
            onClick={() => {
              dispatch(setSelectedObjects([]));
            }}
            disabled={displayInfo.selectedObjects.length === 0}
            style={
              displayInfo.selectedObjects.length > 0
                ? { backgroundColor: "orange" }
                : { backgroundColor: "grey" }
            }
          >
            Clear selection
          </button>
          <button
            disabled={displayInfo.selectedObjects.length === 0}
            onClick={deleteFiles}
            style={
              displayInfo.selectedObjects.length > 0
                ? { backgroundColor: "red" }
                : { backgroundColor: "grey" }
            }
          >
            {isDeletingFiles ? <div className="loading"></div> : "Delete files"}
          </button>
        </div>
        <div className="left">
          {displayInfo.currentPath !== "/" && (
            <button
              onClick={moveBackOneFolder}
              className="back-button"
              style={
                displayInfo.currentPath === "/"
                  ? { backgroundColor: "#ccc" }
                  : { backgroundColor: "#2196f3" }
              }
              disabled={displayInfo.currentPath === "/"}
            >
              <img
                // Change color based on current path
                style={{
                  width: "20px",
                  color: displayInfo.currentPath === "/" ? "grey" : "white",
                }}
                src="src/assets/back.svg"
                alt="back"
              />
            </button>
          )}
          <div className="file-upload">
            <label style={{ textDecoration: "underline" }} htmlFor="file">
              Choose a file{" "}
            </label>
            <input
              type="file"
              id="file"
              onChange={(e) => setFile(e.target.files[0])}
            />

            {file && (
              <label>
                :
                {file.name.length > 20
                  ? file.name.slice(0, 20) + "..."
                  : file.name}
              </label>
            )}
          </div>
          <button
            onClick={uploadFile}
            className="upload-button"
            disabled={!file}
            style={
              file ? { backgroundColor: "green" } : { backgroundColor: "grey" }
            }
          >
            {isUploading ? <div className="loading"></div> : "Upload file"}
          </button>
          <button
            className="download-button"
            onClick={downloadFile}
            disabled={displayInfo.selectedObjects.length !== 1}
            style={
              displayInfo.selectedObjects.length === 1
                ? { backgroundColor: "green" }
                : { backgroundColor: "grey" }
            }
          >
            {isDownloadingFile ? (
              <div className="loading"></div>
            ) : (
              <>
                <img
                  style={{ width: "20px" }}
                  src="src/assets/download.svg"
                  alt="download"
                />
              </>
            )}
          </button>
        </div>
      </div>
      {isDownloadingFile && (
        <div className="download-progress">
          <progress
            className="progress-bar"
            value={downloadProgress}
            max="100"
          />
          <span className="progress-text">{downloadProgress}%</span>
        </div>
      )}
    </>
  );
};

export default ObjectToolsBar;
