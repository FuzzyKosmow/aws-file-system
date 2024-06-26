import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAuthCred, clearAuthCred } from "./store/authSlice";
import axios from "axios";
import "./App.css";
import regions from "./regions";
import FolderItem from "./components/FolderItem";
import ObjectItem from "./components/ObjectItem";
import {
  setTree,
  toggleSelectedFolder,
  toggleSelectedObject,
} from "./store/displaySlice";
import ObjectToolsBar from "./components/ObjectTools";
import { setSelectedBucket } from "./store/displaySlice";
import { clearDisplayInfo } from "./store/displaySlice";
import { setCurrentPath } from "./store/displaySlice";
import { setSelectedFolder } from "./store/displaySlice";
import { setSelectedObjects } from "./store/displaySlice";
import PromptModal from "./components/PromptModal"; // Import PromptModal
import ConfirmModal from "./components/ConfirmModal"; // Import ConfirmModal

//For dev:

const accessKeyIdSample = "";
const secretAccess = "";
function App() {
  const dispatch = useDispatch();
  const displayInfo = useSelector((state) => state.display.displayInfo);
  //Auth info tracking
  const [accessKeyId, setAccessKeyId] = useState(accessKeyIdSample);
  const [secretAccessKey, setSecretAccessKey] = useState(secretAccess);
  const [region, setRegion] = useState("");
  const [buckets, setBuckets] = useState([]);
  const [loadingBucketObjects, setLoadingBucketObjects] = useState(false);

  //For searching
  const [searchTerm, setSearchTerm] = useState("");

  //For upload/ file management
  const [dragFile, setDragFile] = useState(null);
  const [dragging, setDragging] = useState(false);

  //Bucket interaction
  const [bucketError, setBucketError] = useState(false);
  const [bucketErrorMessage, setBucketErrorMessage] = useState("");
  const [isDeletingBucket, setIsDeletingBucket] = useState(false);
  const [isCreatingBucket, setIsCreatingBucket] = useState(false);

  // Auth
  const [authError, setAuthError] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const isFormValid = () => {
    return accessKeyId && secretAccessKey && region;
  };
  const onNewFile = (file) => {
    setDragFile(file);
  };
  //Used when a user drag a file to the object list. Set the dragFile state
  const dropFile = async (e) => {
    e.preventDefault();
    setDragging(false);
    //If its a file , then set the dragFile state
    if (e.dataTransfer.files.length > 0) {
      setDragFile(e.dataTransfer.files[0]);
    }
  };

  const buildTree = (objects) => {
    const root = {};

    objects.forEach((object) => {
      const parts = object.Key.split("/");
      let current = root;
      let path = ""; // To keep track of the full path

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          object.fullPath = object.Key; // Adding the fullPath property
          current[part] = object;
        } else {
          path += (path ? "/" : "") + part; // Update the path
          current[part] = current[part] || {};
          current = current[part];
        }
      });
    });

    return root;
  };

  //Used for clearing stuffs before pulling in new buckets
  const clearBucketData = () => {
    setAuthMessage("");
    setAuthError(false);
    setBucketError(false);
    setBucketErrorMessage("");
    setDragFile(null);
    setDragging(false);
    setBuckets([]);
    dispatch(clearDisplayInfo());
  };

  const listBuckets = async () => {
    try {
      clearBucketData();

      if (!isFormValid()) {
        setAuthError(true);
        setAuthed(false);
        setAuthMessage(
          "Access key ID, secret access key, and region are required."
        );
        return;
      }
      setIsAuthenticating(true);
      const response = await axios.post("http://localhost:5000/listBuckets", {
        accessKeyId,
        secretAccessKey,
        region,
      });
      dispatch(
        setAuthCred({
          accessKey: accessKeyId,
          secretKey: secretAccessKey,
          region,
        })
      );
      setBuckets(response.data);
      setAuthed(true);
    } catch (error) {
      console.error(error);
      setAuthError(true);
      setAuthed(false);
      setAuthMessage("Invalid credentials. Please try again.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const disconnect = () => {
    dispatch(clearAuthCred());
    clearBucketData();
    setAuthed(false);
  };

  const listObjectsFromBucket = async (bucketName) => {
    try {
      setLoadingBucketObjects(true);
      const response = await axios.post("http://localhost:5000/listObjects", {
        accessKeyId,
        secretAccessKey,
        region,
        bucketName,
      });
      const objects = response.data;
      const tree = buildTree(objects);
      dispatch(setTree(tree));
      setSelectedBucket(bucketName);
    } catch (error) {
      console.error(error);
    } finally {
      dispatch(setCurrentPath("/"));
      setDragFile(null);
      setDragging(false);
    }
    setLoadingBucketObjects(false);
  };

  const openFullpath = (fullpath) => {
    const newPath = fullpath;
    console.log("Set current path to: ", newPath);
    dispatch(setCurrentPath(newPath));
  };
  useEffect(() => {
    if (!authed) {
      return;
    }
    //Clear selected objects when changing the current path

    dispatch(setSelectedObjects([]));
    dispatch(setSelectedFolder(""));
  }, [displayInfo.currentPath]);

  const renderTree = (node) => {
    if (searchTerm !== "" && searchTerm.length > 0) {
      return renderTreeWithSearch(node);
    }
    //Render only in current path, filter out other paths. Still render smaller folder

    //1. Get sub tree to match the current path if there is no search term
    const parts = displayInfo.currentPath.split("/");
    let current = node;
    parts.forEach((part) => {
      if (part) {
        current = current[part];
      }
    });

    //2. Separate folders and files
    const folders = [];
    const files = [];

    Object.keys(current).forEach((key) => {
      if (current[key].Key) {
        files.push(current[key]);
      } else {
        folders.push({ folderName: key, fullPath: current[key][""]?.fullPath });
      }
    });
    //3. Render folders at the top, files at the bottom
    return [
      ...folders.map((folder) => (
        <FolderItem
          key={folder.folderName}
          folderName={folder.folderName}
          openFolder={openFullpath}
          toggleSelection={toggleSelectedFolder}
          isSelected={displayInfo.selectedFolder === folder.folderName}
          fullpath={folder.fullPath || ""}
        />
      )),
      ...files.map((file) => (
        <ObjectItem
          key={file.Key}
          object={file}
          toggleSelection={toggleSelectedObject}
          isSelected={displayInfo.selectedObjects.some(
            (selected) => selected.Key === file.Key
          )}
        />
      )),
    ];
  };
  //Same thing, except it search for all nodes not just current path
  const renderTreeWithSearch = (node) => {
    console.log("IN SEARCH");
    const searchResult = [];
    //Go through all nodes and search for the searchTerm. If found, add to searchResult
    const search = (node) => {
      let keys = Object.keys(node);
      keys.forEach((key) => {
        //File
        if (node[key].Key) {
          //To lower case
          if (node[key].Key.toLowerCase().includes(searchTerm.toLowerCase())) {
            searchResult.push(node[key]);
          }
        } else {
          search(node[key]);
        }
      });
    };
    search(node);
    //Separate folders and files
    const folders = [];
    const files = [];
    searchResult.forEach((item) => {
      if (item.Key) {
        files.push(item);
      } else {
        folders.push({
          folderName: Object.keys(item)[0],
          fullPath: item[""].fullPath,
        });
      }
    });
    //Render folders at the top, files at the bottom
    return [
      ...folders.map((folder) => (
        <FolderItem
          key={folder.folderName}
          folderName={folder.folderName}
          openFolder={openFullpath}
          toggleSelection={toggleSelectedFolder}
          isSelected={displayInfo.selectedFolder === folder.folderName}
          fullpath={folder.fullPath}
        />
      )),
      ...files.map((file) => (
        <ObjectItem
          key={file.Key}
          object={file}
          toggleSelection={toggleSelectedObject}
          isSelected={displayInfo.selectedObjects.some(
            (selected) => selected.Key === file.Key
          )}
        />
      )),
    ];
  };

  // State for modals
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [promptMessage, setPromptMessage] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [bucketName, setBucketName] = useState("");

  const handleCreateBucket = async () => {
    setPromptMessage("Enter bucket name");
    setIsPromptOpen(true);
  };

  const handleDeleteBucket = async () => {
    setConfirmMessage(
      `Are you sure you want to delete bucket ${displayInfo.selectedBucket}?`
    );
    setIsConfirmOpen(true);
  };

  const handlePromptSubmit = async (bucketName) => {
    setIsCreatingBucket(true);
    setBucketError(false);
    setIsPromptOpen(false);
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
  };

  const handleConfirmSubmit = async () => {
    setBucketError(false);
    setIsDeletingBucket(true);
    setIsConfirmOpen(false);
    await axios
      .post("http://localhost:5000/deleteBucket", {
        accessKeyId,
        secretAccessKey,
        region,
        bucketName: displayInfo.selectedBucket,
      })
      .then(() => listBuckets())
      .catch((error) => {
        setBucketError(true);
        setBucketErrorMessage(error.response.data.message);
      });
    setIsDeletingBucket(false);
  };

  return (
    <div className="app">
      <div className="left-side">
        <h1>AWS S3 Explorer</h1>

        <div className="form">
          <div className="form-header">
            <p>Enter your AWS credentials to authenticate</p>
          </div>
          <div className="form-body">
            <div className="form-inputs">
              <label htmlFor="access-key-id">Access key ID</label>
              <input
                type="text"
                placeholder="Access Key ID"
                value={accessKeyId}
                onChange={(e) => setAccessKeyId(e.target.value)}
              />
              <label htmlFor="secret-access-key">Secret Access Key</label>
              <input
                type="text"
                placeholder="Secret Access Key"
                value={secretAccessKey}
                onChange={(e) => setSecretAccessKey(e.target.value)}
              />
              <label htmlFor="region">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="">Select Region</option>
                {regions.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.code} - {region.name}
                  </option>
                ))}
              </select>
              {authError && (
                <div className="error-container">
                  <p>{authMessage}</p>
                </div>
              )}
            </div>
            <div className="form-actions">
              <button
                className={
                  isFormValid() ? "auth-button valid" : "auth-button invalid"
                }
                onClick={listBuckets}
                disabled={!isFormValid()}
              >
                {isAuthenticating ? (
                  <div className="loading"></div>
                ) : (
                  "Get buckets"
                )}
              </button>

              {buckets.length > 0 && (
                <button
                  className="disconnect-button"
                  onClick={disconnect}
                  style={{ backgroundColor: "red" }}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="buckets-container">
          <h2>Buckets</h2>
          {/* Show the list of buckets only if the user is authenticated */}
          {authed && (
            <>
              <div className="buckets-tools">
                <div className="tools">
                  <button
                    className="create-bucket"
                    style={{
                      backgroundColor: "#808080",
                      boxShadow: "0px 2px 3px rgba(0, 0, 0, 0.1)",
                    }}
                    onClick={handleCreateBucket}
                  >
                    {isCreatingBucket ? (
                      <div className="loading"></div>
                    ) : (
                      "Create bucket"
                    )}
                  </button>
                  <button
                    //Add class selected if has selected bucket
                    className={
                      displayInfo.selectedBucket !== ""
                        ? "delete-bucket selected"
                        : "delete-bucket disabled"
                    }
                    style={{
                      backgroundColor:
                        displayInfo.selectedBucket !== ""
                          ? "#808080"
                          : "#d3d3d3",
                      boxShadow:
                        displayInfo.selectedBucket !== ""
                          ? "0px 2px 3px rgba(0, 0, 0, 0.1)"
                          : "none",
                    }}
                    disabled={displayInfo.selectedBucket === ""}
                    onClick={handleDeleteBucket}
                  >
                    {isDeletingBucket ? (
                      <div className="loading"></div>
                    ) : (
                      "Delete bucket"
                    )}
                  </button>

                  <button
                    className={
                      displayInfo.selectedBucket === ""
                        ? "list-objects disabled"
                        : "list-objects selected"
                    }
                    style={{
                      backgroundColor:
                        displayInfo.selectedBucket === ""
                          ? "#d3d3d3"
                          : "#808080",
                      boxShadow:
                        displayInfo.selectedBucket === ""
                          ? "none"
                          : "0px 2px 3px rgba(0, 0, 0, 0.1)",
                    }}
                    onClick={() =>
                      listObjectsFromBucket(displayInfo.selectedBucket)
                    }
                    disabled={displayInfo.selectedBucket === ""}
                  >
                    {loadingBucketObjects ? (
                      <div className="loading"></div>
                    ) : (
                      "List objects"
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
          <div className="buckets">
            <ul>
              {buckets.map((bucket) => (
                <li
                  key={bucket.Name}
                  className={
                    displayInfo.selectedBucket === bucket.Name
                      ? "bucket selected"
                      : "bucket"
                  }
                  onClick={() => {
                    if (displayInfo.selectedBucket === bucket.Name) {
                      dispatch(setSelectedBucket(""));
                    } else {
                      dispatch(setSelectedBucket(bucket.Name));
                    }
                  }}
                >
                  <img
                    style={{ width: "20px", marginRight: "10px" }}
                    src={"bucket.svg"}
                    alt="bucket"
                  />
                  {bucket.Name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="divider"></div>
      <div className="right-side">
        {displayInfo.selectedBucket !== "" ? (
          <div className="objects">
            <div className="path-bucket">
              <span className="path-name">Path: {displayInfo.currentPath}</span>
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="bucket-name">
                Bucket: {displayInfo.selectedBucket}
              </span>
            </div>
            <ObjectToolsBar
              refreshObjects={async () =>
                await listObjectsFromBucket(displayInfo.selectedBucket)
              }
              file={dragFile}
              setFile={onNewFile}
            />
            <div
              //On file drag
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragging(false);
              }}
              onDrop={dropFile}
              style={{
                //Transparent border when dragging
                border: dragging ? "2px solid #808080" : "2px dashed #00000000",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
              }}
              className="objects-list"
            >
              <ul>{renderTree(displayInfo.tree)}</ul>
            </div>
          </div>
        ) : (
          <div className="no-bucket">
            <p>No bucket selected</p>
          </div>
        )}
      </div>
      <PromptModal
        message={promptMessage}
        isOpen={isPromptOpen}
        onSubmit={handlePromptSubmit}
        onCancel={() => setIsPromptOpen(false)}
      />
      <ConfirmModal
        message={confirmMessage}
        isOpen={isConfirmOpen}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}

export default App;
