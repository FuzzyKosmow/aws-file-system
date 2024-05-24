// BucketList.js
import React from "react";

function BucketList({ buckets, listObjects, setSelectedBucket }) {
  return (
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
  );
}

export default BucketList;
