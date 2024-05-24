/* eslint-disable react/prop-types */
// Form.js
import React from "react";

function Form({
  accessKeyId,
  setAccessKeyId,
  secretAccessKey,
  setSecretAccessKey,
  region,
  setRegion,
  isFormValid,
  listBuckets,
  regions,
}) {
  return (
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
  );
}

export default Form;
