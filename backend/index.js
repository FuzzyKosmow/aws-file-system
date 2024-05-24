const express = require("express");
const AWS = require("aws-sdk");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use((req, res, next) => {
  console.log("API : ", req.url);
  next();
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/listBuckets", (req, res) => {
  const { accessKeyId, secretAccessKey, region } = req.body;

  // Invalidate old credentials
  AWS.config.credentials = null;

  // Update AWS global configuration
  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region,
  });

  const s3 = new AWS.S3();
  s3.listBuckets((err, data) => {
    if (err) {
      console.error("Error : ", err);
      res.status(500).send(err);
    } else {
      res.send(data.Buckets);
    }
  });
});

app.post("/listObjects", (req, res) => {
  const { accessKeyId, secretAccessKey, region, bucketName } = req.body;

  // Update AWS global configuration
  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region,
  });

  const s3 = new AWS.S3();

  const params = { Bucket: bucketName };
  s3.listObjects(params, (err, data) => {
    if (err) {
      console.error("Error : ", err);
      res.status(500).send(err);
    } else {
      res.send(data.Contents);
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
