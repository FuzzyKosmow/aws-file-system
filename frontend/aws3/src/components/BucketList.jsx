/* eslint-disable react/prop-types */
// BucketList.js
import React from "react";
import AWSBackendAPI from "../api";
import { useState } from "react";
function BucketList({ buckets, setSelectedBucket }) {
  return (
    <div className="buckets">
      <h2>Buckets</h2>
      <ul>
        {buckets.map((bucket) => (
          <BucketItem
            key={bucket.name}
            bucket={bucket}
            setSelectedBucket={setSelectedBucket}
          />
        ))}
      </ul>
    </div>
  );
}

function BucketItem({ bucket, setSelectedBucket }) {
  const [isFetching, setIsFetching] = useState(false);
  async function handleClick() {
    if (isFetching) {
      return;
    }
    setIsFetching(true);
    setSelectedBucket(bucket.name);
    await AWSBackendAPI.listObjectsFromBucket(bucket.name);
    setIsFetching(false);
  }
  return (
    <li key={bucket.name} onClick={handleClick}>
      {bucket.name}
      {isFetching && <div className="loading"></div>}
    </li>
  );
}

export default BucketList;
