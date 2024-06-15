/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
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

//For dev:
const accessKeyIdSample = "A";
const secretAccess = "0z3ehf7+A";

function App() {
  const dispatch = useDispatch();
  const displayInfo = useSelector((state) => state.display.displayInfo);
  //Auth info tracking
  const [accessKeyId, setAccessKeyId] = useState(accessKeyIdSample);
  const [secretAccessKey, setSecretAccessKey] = useState(secretAccess);
  const [region, setRegion] = useState("");
  const [buckets, setBuckets] = useState([]);
  const [loadingBucketObjects, setLoadingBucketObjects] = useState(false);

  //For upload/ file management

  //Bucket interaction
  const [loadedObjectMessage, setLoadedObjectMessage] = useState("");
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
  //Used for clearing stuffs before pulling in new buckets
  const clearBucketData = () => {
    setAuthMessage("");
    setAuthError(false);
    setBucketError(false);
    setBucketErrorMessage("");
    setLoadedObjectMessage("");

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
      dispatch(setTree(tree));
      setSelectedBucket(bucketName);
      setLoadedObjectMessage("Objects loaded for bucket: " + bucketName);
    } catch (error) {
      console.error(error);
    } finally {
      dispatch(setCurrentPath("/"));
    }
    setLoadingBucketObjects(false);
  };

  const openFolder = (folderName) => {
    const newPath = displayInfo.currentPath + folderName + "/";
    dispatch(setCurrentPath(newPath));
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

    dispatch(setSelectedObjects([]));
    dispatch(setSelectedFolder(""));
  }, [displayInfo.currentPath]);

  const renderTree = (node) => {
    //Render only in current path, filter out other paths. Still render smaller folder

    //1. Get sub tree to match the current path
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
        folders.push(key);
      }
    });

    //3. Render folders at the top, files at the bottom
    return [
      ...folders.map((folderName) => (
        <FolderItem
          key={folderName}
          folderName={folderName}
          openFolder={openFolder}
          toggleSelection={toggleSelectedFolder}
          isSelected={displayInfo.selectedFolder === folderName}
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
                              setBucketErrorMessage(
                                error.response.data.message
                              );
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
                    disabled={displayInfo.selectedBucket === ""}
                    onClick={async () => {
                      setBucketError(false);
                      setIsDeletingBucket(true);
                      //Dialog yes no to confirm
                      if (
                        window.confirm(
                          `Are you sure you want to delete bucket ${displayInfo.selectedBucket}?`
                        )
                      ) {
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
                      }
                      setIsDeletingBucket(false);
                    }}
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
                    src="src/assets/bucket.svg"
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
        {displayInfo.selectedBucket && (
          <div className="objects">
            <h2>{loadedObjectMessage}</h2>
            <h2>Current Path: {displayInfo.currentPath}</h2>
            <ObjectToolsBar
              refreshObjects={async () =>
                await listObjectsFromBucket(displayInfo.selectedBucket)
              }
            />
            <ul>{renderTree(displayInfo.tree)}</ul>
          </div>
        )}
      </div>
    </div>
  );
}

//Folder : On double click , change folder path

export default App;
