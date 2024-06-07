/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import regions from "./regions";

//For dev:
const accessKeyIdSample = "AB";
const secretAccess = "0z3ehf7+AB";

function App() {
  const [accessKeyId, setAccessKeyId] = useState(accessKeyIdSample);
  const [secretAccessKey, setSecretAccessKey] = useState(secretAccess);
  const [region, setRegion] = useState("");
  const [buckets, setBuckets] = useState([]);

  const [loadingBucketObjects, setLoadingBucketObjects] = useState(false);
  const [bucketObjects, setBucketObjects] = useState([]);
  const [displayObjects, setDisplayObjects] = useState([]);
  //For upload/ file management
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [tree, setTree] = useState({});
  const [currentPath, setCurrentPath] = useState("/");
  const [isDeletingFiles, setIsDeletingFiles] = useState(false);
  //Bucket interaction
  const [selectedBucket, setSelectedBucket] = useState("");
  const [loadedObjectMessage, setLoadedObjectMessage] = useState("");
  const [bucketError, setBucketError] = useState(false);
  const [bucketErrorMessage, setBucketErrorMessage] = useState("");
  const [isDeletingBucket, setIsDeletingBucket] = useState(false);
  const [isCreatingBucket, setIsCreatingBucket] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  // Auth
  const [authError, setAuthError] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authed, setAuthed] = useState(false);
  const isFormValid = () => {
    return accessKeyId && secretAccessKey && region;
  };

  const buildTree = (objects) => {
    const root = {};

    objects.forEach((object) => {
      const parts = object.Key.split("/");
      let current = root;
      //This will result in empty folder will have the last part being empty
      //For example, if the object key is "folder1/folder2/file.txt", the parts will be ["folder1", "folder2", "file.txt"]
      //If the object key is "folder1/folder2/", the parts will be ["folder1", "folder2", ""]
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = object;
        } else {
          current[part] = current[part] || {};
          current = current[part];
        }
      });
    });

    return root;
  };

  const listBuckets = async () => {
    try {
      setAuthError(false);
      setBucketError(false);
      setBucketErrorMessage("");
      setSelectedBucket("");
      setBucketObjects([]);
      if (!isFormValid()) {
        setAuthError(true);
        setAuthed(false);
        return;
      }
      setIsAuthenticating(true);
      const response = await axios.post("http://localhost:5000/listBuckets", {
        accessKeyId,
        secretAccessKey,
        region,
      });
      setBuckets(response.data);
      setAuthed(true);
      setIsAuthenticating(false);
    } catch (error) {
      console.error(error);
    }
  };

  const disconnect = () => {
    setRegion("");
    setBuckets([]);
    setSelectedBucket("");
    setBucketObjects([]);
    setTree({});
    setCurrentPath([]);
    setAuthed(false);
    setAuthError(false);
    setSelectedObjects([]);
    setDisplayObjects([]);
  };

  const listObjectsFromBucket = async (bucketName) => {
    try {
      setLoadedObjectMessage("");
      setLoadingBucketObjects(true);
      const response = await axios.post("http://localhost:5000/listObjects", {
        accessKeyId,
        secretAccessKey,
        region,
        bucketName,
      });
      const objects = response.data;
      const tree = buildTree(objects);
      setBucketObjects(objects);
      setTree(tree);
      setSelectedBucket(bucketName);
      setLoadedObjectMessage("Objects loaded for " + bucketName);
      setCurrentPath("/");
    } catch (error) {
      console.error(error);
    }
    setLoadingBucketObjects(false);
  };

  const moveBackOneFolder = () => {
    const newPath = currentPath.split("/").slice(0, -2).join("/") + "/";
    setCurrentPath(newPath);
  };

  const openFolder = (folderName) => {
    setCurrentPath((prevPath) => {
      return prevPath + folderName + "/";
    });
  };
  const getObjectsWithPath = (node, path = "") => {
    let keys = Object.keys(node);

    return keys.map((key) => {
      if (node[key].Key) {
        return { ...node[key], Key: path + key };
      } else {
        return getObjectsWithPath(node[key], path + key + "/");
      }
    });
  };
  useEffect(() => {
    if (!authed) {
      return;
    }
    //Clear selected objects when changing the current path
    setSelectedObjects([]);
    setSelectedFolder("");
    //Refresh the list of objects when changing the current path
    const objects = getObjectsWithPath(tree, currentPath);
    setDisplayObjects(objects.flat());
  }, [currentPath]);

  const uploadFile = async () => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      //Remove first /
      let path = currentPath.slice(1);
      //If last char is / , remove
      if (path[path.length - 1] === "/") {
        path = path.slice(0, -1);
      }
      formData.append("file", file);
      formData.append("accessKeyId", accessKeyId);
      formData.append("secretAccessKey", secretAccessKey);
      formData.append("region", region);
      formData.append("bucketName", selectedBucket);
      formData.append("path", path);
      await axios.post("http://localhost:5000/uploadFile", formData);
      await listObjectsFromBucket(selectedBucket);
      setFile(null);
    } catch (error) {
      console.error(error);
    }
    setIsUploading(false);
  };
  const deleteFiles = async () => {
    try {
      setIsDeletingFiles(true);
      if (
        window.confirm(
          `Are you sure you want to delete ${selectedObjects.length} objects?`
        )
      ) {
        selectedObjects.forEach(async (object) => {
          await axios.post("http://localhost:5000/deleteFile", {
            accessKeyId,
            secretAccessKey,
            region,
            bucketName: selectedBucket,
            fileName: object.Key,
          });
        });
      }
      setIsDeletingFiles(false);
      setSelectedObjects([]);
      await listObjectsFromBucket(selectedBucket);
    } catch (error) {
      console.error(error);
    }
  };
  const deleteFolder = async () => {
    //Popup confirm
    setIsDeletingFolder(true);
    if (
      window.confirm(
        `Are you sure you want to delete folder ${selectedFolder}?`
      )
    ) {
      setIsDeletingFolder(true);
      await axios
        .post("http://localhost:5000/deleteFolder", {
          accessKeyId,
          secretAccessKey,
          region,
          bucketName: selectedBucket,
          folderName: currentPath + selectedFolder,
        })
        .then(() => listObjectsFromBucket(selectedBucket))
        .catch((error) => {
          console.error(error);
        });
    }
    await listObjectsFromBucket(selectedBucket);
    setIsDeletingFolder(false);
  };
  const toggleSelection = (object) => {
    setSelectedObjects((prevSelectedObjects) => {
      const isSelected = prevSelectedObjects.some(
        (selected) => selected.Key === object.Key
      );

      if (isSelected) {
        return prevSelectedObjects.filter(
          (selected) => selected.Key !== object.Key
        );
      } else {
        return [...prevSelectedObjects, object];
      }
    });
  };
  const toggleSelectionFolder = (folderName) => {
    //Only one folder can be selected at a time
    setSelectedFolder((prevSelectedFolder) => {
      if (prevSelectedFolder === folderName) {
        return "";
      } else {
        return folderName;
      }
    });
  };

  const renderTree = (node) => {
    //Render only in current path, filter out other paths. Still render smaller folder

    //1. Get sub tree to match the current path
    const parts = currentPath.split("/");
    let current = node;
    parts.forEach((part) => {
      if (part) {
        current = current[part];
      }
    });
    //2. Render the sub tree
    return Object.keys(current).map((key) => {
      if (current[key].Key) {
        return (
          <ObjectItem
            key={current[key].Key}
            object={current[key]}
            toggleSelection={toggleSelection}
            isSelected={selectedObjects.some(
              (selected) => selected.Key === current[key].Key
            )}
          />
        );
      } else {
        return (
          <FolderItem
            key={key}
            folderName={key}
            openFolder={openFolder}
            toggleSelection={toggleSelectionFolder}
            isSelected={selectedFolder === key}
          />
        );
      }
    });
  };

  return (
    <div className="app">
      <h1>AWS S3 Explorer</h1>
      {authError && (
        <div className="error-container">
          <p>Access Key ID, Secret Access Key, and Region are required.</p>
        </div>
      )}
      <div className="form">
        <input
          type="text"
          placeholder="Access Key ID"
          value={accessKeyId}
          onChange={(e) => setAccessKeyId(e.target.value)}
        />
        <input
          type="text"
          placeholder="Secret Access Key"
          value={secretAccessKey}
          onChange={(e) => setSecretAccessKey(e.target.value)}
        />
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">Select Region</option>
          {regions.map((region) => (
            <option key={region.code} value={region.code}>
              {region.code} - {region.name}
            </option>
          ))}
        </select>
        {isAuthenticating ? (
          <div className="loading"></div>
        ) : (
          <button
            onClick={listBuckets}
            style={{ backgroundColor: isFormValid() ? "green" : "grey" }}
          >
            List Buckets
          </button>
        )}

        {buckets.length > 0 && (
          <button onClick={disconnect} style={{ backgroundColor: "red" }}>
            Disconnect
          </button>
        )}
      </div>
      <div className="buckets">
        <h2>Buckets</h2>
        {/* Show the list of buckets only if the user is authenticated */}
        {authed && (
          <>
            <div className="buckets-tools">
              <div className="tools">
                <button
                  className="create-bucket"
                  onClick={async () => {
                    setIsCreatingBucket(true);
                    setBucketError(false);
                    const bucketName = prompt("Enter bucket name");
                    if (bucketName) {
                      await axios
                        .post("http://localhost:5000/createBucket", {
                          accessKeyId,
                          secretAccessKey,
                          region,
                          bucketName,
                        })
                        .then(() => listBuckets())
                        .catch((error) => {
                          if (error.response.status === 409) {
                            setBucketError(true);
                            setBucketErrorMessage(error.response.data.message);
                          } else {
                            console.error(error);
                          }
                        });
                    }
                    setIsCreatingBucket(false);
                  }}
                >
                  {isCreatingBucket ? (
                    <div className="loading"></div>
                  ) : (
                    "Create Bucket"
                  )}
                </button>
                <button
                  className="delete-bucket"
                  disabled={selectedBucket === ""}
                  style={
                    selectedBucket === ""
                      ? { backgroundColor: "grey" }
                      : { backgroundColor: "red" }
                  }
                  onClick={async () => {
                    setBucketError(false);
                    setIsDeletingBucket(true);
                    //Dialog yes no to confirm
                    if (
                      window.confirm(
                        `Are you sure you want to delete bucket ${selectedBucket}?`
                      )
                    ) {
                      await axios
                        .post("http://localhost:5000/deleteBucket", {
                          accessKeyId,
                          secretAccessKey,
                          region,
                          bucketName: selectedBucket,
                        })
                        .then(() => listBuckets())
                        .catch((error) => {
                          setBucketError(true);
                          setBucketErrorMessage(error.response.data.message);
                        });
                    }
                    setIsDeletingBucket(false);
                  }}
                >
                  {isDeletingBucket ? (
                    <div className="loading"></div>
                  ) : (
                    "Delete Bucket"
                  )}
                </button>

                <button
                  className="list-objects"
                  onClick={() => listObjectsFromBucket(selectedBucket)}
                  disabled={selectedBucket === ""}
                  style={
                    selectedBucket === ""
                      ? { backgroundColor: "grey" }
                      : { backgroundColor: "#2196f3" }
                  }
                >
                  {loadingBucketObjects ? (
                    <div className="loading"></div>
                  ) : (
                    "List Objects"
                  )}
                </button>
              </div>
              {bucketError && (
                <div className="error-container">
                  <p>{bucketErrorMessage}</p>
                </div>
              )}
            </div>
          </>
        )}
        <ul>
          {buckets.map((bucket) => (
            <li
              key={bucket.Name}
              onClick={() => {
                if (selectedBucket === bucket.Name) {
                  setSelectedBucket("");
                } else {
                  setSelectedBucket(bucket.Name);
                }
              }}
              style={
                bucket.Name === selectedBucket
                  ? { backgroundColor: "#2196f3" }
                  : {}
              }
            >
              {bucket.Name}
            </li>
          ))}
        </ul>
      </div>
      {selectedBucket && (
        <div className="objects">
          <h2>{loadedObjectMessage}</h2>
          <h2>Current Path: {currentPath}</h2>
          <div className="object-tools">
            <div className="left">
              {currentPath.length > 0 && (
                <button
                  onClick={moveBackOneFolder}
                  className="back-button"
                  style={
                    currentPath === "/"
                      ? { backgroundColor: "#ccc" }
                      : { backgroundColor: "#2196f3" }
                  }
                  disabled={currentPath === "/"}
                >
                  <img
                    //Change color based on current path
                    style={{
                      width: "20px",
                      color: currentPath === "/" ? "grey" : "white",
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
                  file
                    ? { backgroundColor: "green" }
                    : { backgroundColor: "grey" }
                }
              >
                {isUploading ? "Uploading ..." : "Upload here"}
              </button>
            </div>
            <div className="right">
              <button
                onClick={deleteFolder}
                disabled={selectedFolder === ""}
                style={{ backgroundColor: selectedFolder ? "red" : "grey" }}
              >
                {isDeletingFolder ? "Deleting ..." : "Delete folder"}
              </button>

              <button
                onClick={() => {
                  setIsCreatingFolder(true);
                  const folderName = prompt("Enter folder name");
                  if (folderName) {
                    axios

                      .post("http://localhost:5000/createFolder", {
                        accessKeyId,
                        secretAccessKey,
                        region,
                        bucketName: selectedBucket,
                        folderName: currentPath + folderName,
                      })
                      .then(() => listObjectsFromBucket(selectedBucket))
                      .catch((error) => {
                        console.error(error);
                      });
                  }
                  setIsCreatingFolder(false);
                }}
                style={{ backgroundColor: "green" }}
              >
                {isCreatingFolder ? "Creating ..." : "Create folder"}
              </button>
              <button
                onClick={() => {
                  setSelectedObjects([]);
                  setDisplayObjects([]);
                }}
                disabled={selectedObjects.length === 0}
                style={
                  selectedObjects.length > 0
                    ? { backgroundColor: "orange" }
                    : { backgroundColor: "grey" }
                }
              >
                Clear selection
              </button>
              <button
                disabled={selectedObjects.length === 0}
                onClick={deleteFiles}
                style={
                  selectedObjects.length > 0
                    ? { backgroundColor: "red" }
                    : { backgroundColor: "grey" }
                }
              >
                {isDeletingFiles ? "Deleting ..." : "Delete selected"}
              </button>
            </div>
          </div>
          <ul>{renderTree(tree)}</ul>
        </div>
      )}
    </div>
  );
}

//Single object item
const ObjectItem = ({ object, toggleSelection, isSelected }) => {
  //Key display: remove folder path

  const renderName = () => {
    const parts = object.Key.split("/");
    return parts[parts.length - 1];
  };
  //If render name is empty, which means it is a folder passed as root
  return (
    <>
      {renderName() !== "" && (
        <li
          onClick={() => toggleSelection(object)}
          className={isSelected ? "selected" : ""}
        >
          {renderName()}
        </li>
      )}
    </>
  );
};

//Folder : On double click , change folder path
const FolderItem = ({
  folderName,
  openFolder,
  toggleSelection,
  isSelected,
}) => {
  return (
    <li
      onDoubleClick={() => openFolder(folderName)}
      onClick={() => toggleSelection(folderName)}
      className={isSelected ? "selected" : ""}
    >
      <div style={{ display: "flex", gap: "10px" }}>
        <img
          src="src/assets/folder.svg"
          alt="folder"
          style={{ width: "20px" }}
        />
        <p>{folderName}</p>
      </div>
    </li>
  );
};

export default App;
