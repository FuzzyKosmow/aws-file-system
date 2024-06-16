import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { setSelectedObjects, setCurrentPath } from "../store/displaySlice";
import ConfirmModal from "./ConfirmModal";
import PromptModal from "./PromptModal";

const ObjectToolsBar = ({ file, setFile, refreshObjects }) => {
  const auth = useSelector((state) => state.auth.validAuthCred);
  const displayInfo = useSelector((state) => state.display.displayInfo);
  const dispatch = useDispatch();
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isDeletingFiles, setIsDeletingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloadingFile, setIsDownloadingFile] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [promptMessage, setPromptMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(() => () => {});
  const [promptAction, setPromptAction] = useState(() => () => {});

  const deleteFolder = () => {
    setConfirmMessage(
      `Are you sure you want to delete folder "${displayInfo.selectedFolder}"?`
    );
    setConfirmAction(() => async () => {
      setIsDeletingFolder(true);
      try {
        await axios.post("http://localhost:5000/deleteFolder", {
          accessKeyId: auth.accessKey,
          secretAccessKey: auth.secretKey,
          region: auth.region,
          bucketName: displayInfo.selectedBucket,
          folderName: displayInfo.currentPath + displayInfo.selectedFolder,
        });
        await refreshObjects();
      } catch (error) {
        console.error(error);
      } finally {
        setIsDeletingFolder(false);
      }
    });
    setConfirmOpen(true);
  };

  const deleteFiles = () => {
    setConfirmMessage(
      `Are you sure you want to delete ${displayInfo.selectedObjects.length} objects?`
    );
    setConfirmAction(() => async () => {
      setIsDeletingFiles(true);
      try {
        for (const object of displayInfo.selectedObjects) {
          await axios.post("http://localhost:5000/deleteFile", {
            accessKeyId: auth.accessKey,
            secretAccessKey: auth.secretKey,
            region: auth.region,
            bucketName: displayInfo.selectedBucket,
            fileName: object.Key,
          });
        }
        dispatch(setSelectedObjects([]));
        await refreshObjects();
      } catch (error) {
        console.error(error);
      } finally {
        setIsDeletingFiles(false);
      }
    });
    setConfirmOpen(true);
  };

  const createFolder = () => {
    setPromptMessage("Enter folder name");
    setPromptAction(() => async (folderName) => {
      if (folderName) {
        setIsCreatingFolder(true);
        try {
          await axios.post("http://localhost:5000/createFolder", {
            accessKeyId: auth.accessKey,
            secretAccessKey: auth.secretKey,
            region: auth.region,
            bucketName: displayInfo.selectedBucket,
            folderName: displayInfo.currentPath + folderName,
          });
          await refreshObjects();
        } catch (error) {
          console.error(error);
        } finally {
          setIsCreatingFolder(false);
        }
      }
    });
    setPromptOpen(true);
  };

  const moveBackOneFolder = () => {
    const newPath =
      displayInfo.currentPath.split("/").slice(0, -2).join("/") + "/";
    dispatch(setCurrentPath(newPath));
  };

  const uploadFile = async () => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      let path = displayInfo.currentPath.slice(1);
      if (path[path.length - 1] === "/") path = path.slice(0, -1);
      formData.append("file", file);
      formData.append("accessKeyId", auth.accessKey);
      formData.append("secretAccessKey", auth.secretKey);
      formData.append("region", auth.region);
      formData.append("bucketName", displayInfo.selectedBucket);
      formData.append("path", path);
      await axios.post("http://localhost:5000/uploadFile", formData);
      setFile(null);
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
      setDownloadProgress(0);
      if (displayInfo.selectedObjects.length > 1) return;

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
    } finally {
      setIsDownloadingFile(false);
    }
  };

  return (
    <>
      <div className="object-tools">
        <div className="right">
          <button
            onClick={moveBackOneFolder}
            className="back-button"
            style={
              displayInfo.currentPath === "/" ||
              displayInfo.selectedObjects.length <= 0 ||
              isDeletingFolder ||
              isCreatingFolder ||
              isUploading ||
              isDownloadingFile ||
              isDeletingFiles
                ? { backgroundColor: "#d3d3d3" }
                : { backgroundColor: "#808080" }
            }
            disabled={displayInfo.currentPath === "/"}
          >
            <img
              style={{
                width: "20px",
                color: displayInfo.currentPath === "/" ? "grey" : "white",
              }}
              src="back.svg"
              alt="back"
            />
          </button>
          <button
            onClick={deleteFolder}
            disabled={displayInfo.selectedFolder === ""}
            style={{
              backgroundColor: displayInfo.selectedFolder
                ? "#808080"
                : "#d3d3d3",
              cursor: displayInfo.selectedFolder ? "pointer" : "default",
              border: "none",
              padding: "10px 20px",
              fontSize: "16px",
              color: "#ffffff",
              borderRadius: "5px",
              boxShadow: "0px 2px 3px rgba(0, 0, 0, 0.1)",
              transition: "background-color 0.3s ease",
            }}
          >
            {isDeletingFolder ? (
              <div className="loading"></div>
            ) : (
              "Delete folder"
            )}
          </button>
          <button
            onClick={createFolder}
            //Similar to the above button, but with a different style
            style={{
              backgroundColor: !isCreatingFolder ? "#808080" : "#d3d3d3",
              cursor: isCreatingFolder ? "default" : "pointer",
              border: "none",
              padding: "10px 20px",
              fontSize: "16px",
              color: "#ffffff",
              borderRadius: "5px",
              boxShadow: "0px 2px 3px rgba(0, 0, 0, 0.1)",
              transition: "background-color 0.3s ease",
            }}
          >
            {isCreatingFolder ? (
              <div className="loading"></div>
            ) : (
              "Create folder"
            )}
          </button>
          <button
            onClick={() => dispatch(setSelectedObjects([]))}
            disabled={displayInfo.selectedObjects.length === 0}
            //Similar to the above button, but with a different style
            style={
              displayInfo.selectedObjects.length > 0
                ? {
                    backgroundColor: "#808080",
                    cursor: "pointer",
                    border: "none",
                    padding: "10px 20px",
                    fontSize: "16px",
                    color: "#ffffff",
                    borderRadius: "5px",
                    boxShadow: "0px 2px 3px rgba(0, 0, 0, 0.1)",
                    transition: "background-color 0.3s ease",
                  }
                : {
                    backgroundColor: "#d3d3d3",
                    cursor: "default",
                    border: "none",
                    padding: "10px 20px",
                    fontSize: "16px",
                    color: "#ffffff",
                    borderRadius: "5px",
                    boxShadow: "0px 2px 3px rgba(0, 0, 0, 0.1)",
                    transition: "background-color 0.3s ease",
                  }
            }
          >
            Clear selection
          </button>
          <button
            onClick={deleteFiles}
            disabled={displayInfo.selectedObjects.length === 0}
            style={
              displayInfo.selectedObjects.length > 0
                ? {
                    backgroundColor: "#808080",
                    cursor: "pointer",
                    border: "none",
                    padding: "10px 20px",
                    fontSize: "16px",
                    color: "#ffffff",
                    borderRadius: "5px",
                    boxShadow: "0px 2px 3px rgba(0, 0, 0, 0.1)",
                    transition: "background-color 0.3s ease",
                  }
                : {
                    backgroundColor: "#d3d3d3",
                    cursor: "default",
                    border: "none",
                    padding: "10px 20px",
                    fontSize: "16px",
                    color: "#ffffff",
                    borderRadius: "5px",
                    boxShadow: "0px 2px 3px rgba(0, 0, 0, 0.1)",
                    transition: "background-color 0.3s ease",
                  }
            }
          >
            {isDeletingFiles ? <div className="loading"></div> : "Delete files"}
          </button>
        </div>
        <div className="left">
          <div className="file-upload">
            <label style={{ textDecoration: "underline" }} htmlFor="file">
              {file ? file.name : "Choose a file"}
            </label>
            <input
              type="file"
              id="file"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>
          <button
            onClick={uploadFile}
            className="upload-button"
            disabled={!file}
            style={
              //Similar to the above button, but with a different style
              file
                ? { backgroundColor: "#2196f3" }
                : { backgroundColor: "#ccc" }
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
                ? { backgroundColor: "#2196f3" }
                : { backgroundColor: "#ccc" }
            }
          >
            {isDownloadingFile ? (
              <div className="loading"></div>
            ) : (
              <img
                style={{ width: "20px" }}
                src="download.svg"
                alt="download"
              />
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
      <ConfirmModal
        message={confirmMessage}
        onConfirm={() => {
          confirmAction();
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
        isOpen={confirmOpen}
      />
      <PromptModal
        message={promptMessage}
        onSubmit={(value) => {
          promptAction(value);
          setPromptOpen(false);
        }}
        onCancel={() => setPromptOpen(false)}
        isOpen={promptOpen}
      />
    </>
  );
};

export default ObjectToolsBar;
