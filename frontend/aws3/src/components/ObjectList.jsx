// ObjectList.js
import React from "react";

function ObjectList({
  selectedBucket,
  objects,
  setObjects,
  uploadFile,
  setFile,
}) {
  return (
    <>
      {selectedBucket && (
        <div className="objects">
          <h2>Objects in {selectedBucket}</h2>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={uploadFile}>Upload File</button>
          <ul>
            {objects.map((object) => (
              <li key={object.Key}>{object.Key}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export default ObjectList;
