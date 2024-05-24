import React, { useState } from "react";
import axios from "axios";
import "./App.css";
import regions from "./regions";

function App() {
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [region, setRegion] = useState("");
  const [buckets, setBuckets] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState("");
  const [objects, setObjects] = useState([]);
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [file, setFile] = useState(null);

  const isFormValid = () => {
    return accessKeyId && secretAccessKey && region;
  };

  const listBuckets = async () => {
    try {
      const response = await axios.post("http://localhost:5000/listBuckets", {
        accessKeyId,
        secretAccessKey,
        region,
      });
      setBuckets(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const listObjects = async (bucketName) => {
    try {
      const response = await axios.post("http://localhost:5000/listObjects", {
        accessKeyId,
        secretAccessKey,
        region,
        bucketName,
      });
      setObjects(response.data);
      setSelectedBucket(bucketName);
      setSelectedObjects([]);
    } catch (error) {
      console.error(error);
    }
  };

  const uploadFile = async () => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("accessKeyId", accessKeyId);
      formData.append("secretAccessKey", secretAccessKey);
      formData.append("region", region);
      formData.append("bucketName", selectedBucket);

      await axios.post("http://localhost:5000/uploadFile", formData);
      // Refresh the list of objects after upload
      listObjects(selectedBucket);
    } catch (error) {
      console.error(error);
    }
  };

  const createFolder = async (folderName) => {
    try {
      await axios.post("http://localhost:5000/createFolder", {
        accessKeyId,
        secretAccessKey,
        region,
        bucketName: selectedBucket,
        folderName,
      });
      // Refresh the list of objects after creating the folder
      listObjects(selectedBucket);
    } catch (error) {
      console.error(error);
    }
  };

  const editFile = async (oldFileName, newFileName) => {
    try {
      await axios.post("http://localhost:5000/editFile", {
        accessKeyId,
        secretAccessKey,
        region,
        bucketName: selectedBucket,
        oldFileName,
        newFileName,
      });
      // Refresh the list of objects after editing the file
      listObjects(selectedBucket);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteFile = async (fileName) => {
    try {
      await axios.post("http://localhost:5000/deleteFile", {
        accessKeyId,
        secretAccessKey,
        region,
        bucketName: selectedBucket,
        fileName,
      });
      // Refresh the list of objects after deleting the file
      listObjects(selectedBucket);
    } catch (error) {
      console.error(error);
    }
  };

  const moveFile = async (oldFilePath, newFilePath) => {
    try {
      await axios.post("http://localhost:5000/moveFile", {
        accessKeyId,
        secretAccessKey,
        region,
        bucketName: selectedBucket,
        oldFilePath,
        newFilePath,
      });
      // Refresh the list of objects after moving the file
      listObjects(selectedBucket);
    } catch (error) {
      console.error(error);
    }
  };

  const editFolder = async (oldFolderName, newFolderName) => {
    try {
      await axios.post("http://localhost:5000/editFolder", {
        accessKeyId,
        secretAccessKey,
        region,
        bucketName: selectedBucket,
        oldFolderName,
        newFolderName,
      });
      // Refresh the list of objects after editing the folder
      listObjects(selectedBucket);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteFolder = async (folderName) => {
    try {
      await axios.post("http://localhost:5000/deleteFolder", {
        accessKeyId,
        secretAccessKey,
        region,
        bucketName: selectedBucket,
        folderName,
      });
      // Refresh the list of objects after deleting the folder
      listObjects(selectedBucket);
    } catch (error) {
      console.error(error);
    }
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

  return (
    <div className="app">
      <h1>AWS S3 Manager</h1>
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

        <button
          onClick={listBuckets}
          style={{ backgroundColor: isFormValid() ? "green" : "grey" }}
        >
          List Buckets
        </button>
      </div>
      <div className="buckets">
        <h2>Buckets</h2>
        <ul>
          {buckets.map((bucket) => (
            <li key={bucket.Name} onClick={() => listObjects(bucket.Name)}>
              {bucket.Name}
            </li>
          ))}
        </ul>
      </div>
      {selectedBucket && (
        <div className="objects">
          <h2>Objects in {selectedBucket}</h2>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={uploadFile}>Upload File</button>
          <ul>
            {objects.map((object) => (
              <li
                key={object.Key}
                onClick={() => toggleSelection(object)}
                className={
                  selectedObjects.some(
                    (selected) => selected.Key === object.Key
                  )
                    ? "selected"
                    : ""
                }
              >
                {object.Key}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
