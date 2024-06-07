const express = require("express");
const AWS = require("aws-sdk");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const validateCredentials = require("./utils/validateCaller");
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
//create bucket
app.post("/createBucket", (req, res) => {
  const { accessKeyId, secretAccessKey, region, bucketName } = req.body;

  // Update AWS global configuration
  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region,
  });

  const s3 = new AWS.S3();
  const params = { Bucket: bucketName };
  s3.createBucket(params, (err, data) => {
    if (err) {
      console.error("Error : ", err);
      //If error is bucket already exists, return 409 status code
      if (err.code === "BucketAlreadyOwnedByYou") {
        res.status(409).send(err);
      }
      if (err.code === "BucketAlreadyExists") {
        res.status(409).send(err);
      }
    } else {
      res.status(201).send(data);
    }
  });
});

app.post("/deleteBucket", (req, res) => {
  const { accessKeyId, secretAccessKey, region, bucketName } = req.body;

  // Update AWS global configuration
  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region,
  });

  const s3 = new AWS.S3();
  const params = { Bucket: bucketName };
  s3.deleteBucket(params, (err, data) => {
    if (err) {
      console.error("Error : ", err);
      res.status(500).send(err);
    } else {
      res.send(data);
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

//list objects from folder
app.post("/listObjectsFromFolder", (req, res) => {
  const { accessKeyId, secretAccessKey, region, bucketName, folderPath } =
    req.body;
  console.log("body", req.body);
  // Update AWS global configuration
  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region,
  });

  const s3 = new AWS.S3();

  const params = { Bucket: bucketName, Prefix: folderPath };
  s3.listObjects(params, (err, data) => {
    if (err) {
      console.error("Error : ", err);
      res.status(500).send(err);
    } else {
      console.log("data", data);
      res.send(data.Contents);
    }
  });
});

app.post("/uploadFile", upload.single("file"), (req, res) => {
  const { accessKeyId, secretAccessKey, region, bucketName, path } = req.body;
  const file = req.file;

  // Update AWS global configuration
  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region,
  });

  const s3 = new AWS.S3();
  //If path is / or empty, keyPath will be filename.txt
  const keyPath =
    path === "/" || path === ""
      ? file.originalname
      : `${path}/${file.originalname}`;
  const params = {
    Bucket: bucketName,
    Key: `${keyPath}`,
    Body: file.buffer,
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error("Error : ", err);
      res.status(500).send(err);
    } else {
      res.send(data);
    }
  });
});

app.post("/createFolder", (req, res) => {
  const { accessKeyId, secretAccessKey, region, bucketName, folderName } =
    req.body;

  // Update AWS global configuration
  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region,
  });

  const s3 = new AWS.S3();

  const params = {
    Bucket: bucketName,
    Key: `${folderName}/`,
    Body: "",
  };

  s3.putObject(params, (err, data) => {
    if (err) {
      console.error("Error : ", err);
      res.status(500).send(err);
    } else {
      res.send(data);
    }
  });
});

app.post("/editFile", (req, res) => {
  const {
    accessKeyId,
    secretAccessKey,
    region,
    bucketName,
    oldFileName,
    newFileName,
  } = req.body;

  // Update AWS global configuration
  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region,
  });

  const s3 = new AWS.S3();

  // Copy the file to new name
  const copyParams = {
    Bucket: bucketName,
    CopySource: `${bucketName}/${oldFileName}`,
    Key: newFileName,
  };

  s3.copyObject(copyParams, (err, data) => {
    if (err) {
      console.error("Error : ", err);
      res.status(500).send(err);
    } else {
      // Delete the old file
      const deleteParams = {
        Bucket: bucketName,
        Key: oldFileName,
      };

      s3.deleteObject(deleteParams, (err, data) => {
        if (err) {
          console.error("Error : ", err);
          res.status(500).send(err);
        } else {
          res.send(data);
        }
      });
    }
  });
});

app.post("/deleteFile", (req, res) => {
  const { accessKeyId, secretAccessKey, region, bucketName, fileName } =
    req.body;

  // Update AWS global configuration
  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region,
  });

  const s3 = new AWS.S3();

  const params = {
    Bucket: bucketName,
    Key: fileName,
  };

  s3.deleteObject(params, (err, data) => {
    if (err) {
      console.error("Error : ", err);
      res.status(500).send(err);
    } else {
      res.send(data);
    }
  });
});

app.post("/moveFile", (req, res) => {
  const {
    accessKeyId,
    secretAccessKey,
    region,
    bucketName,
    oldFilePath,
    newFilePath,
  } = req.body;

  // Update AWS global configuration
  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region,
  });

  const s3 = new AWS.S3();

  // Copy the file to new path
  const copyParams = {
    Bucket: bucketName,
    CopySource: `${bucketName}/${oldFilePath}`,
    Key: newFilePath,
  };

  s3.copyObject(copyParams, (err, data) => {
    if (err) {
      console.error("Error : ", err);
      res.status(500).send(err);
    } else {
      // Delete the old file
      const deleteParams = {
        Bucket: bucketName,
        Key: oldFilePath,
      };

      s3.deleteObject(deleteParams, (err, data) => {
        if (err) {
          console.error("Error : ", err);
          res.status(500).send(err);
        } else {
          res.send(data);
        }
      });
    }
  });
});

app.post("/editFolder", (req, res) => {
  const {
    accessKeyId,
    secretAccessKey,
    region,
    bucketName,
    oldFolderName,
    newFolderName,
  } = req.body;

  // Update AWS global configuration
  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region,
  });

  const s3 = new AWS.S3();

  // List all objects in the old folder
  const listParams = {
    Bucket: bucketName,
    Prefix: oldFolderName,
  };

  s3.listObjects(listParams, (err, data) => {
    if (err) {
      console.error("Error : ", err);
      res.status(500).send(err);
    } else {
      const objects = data.Contents;
      const copyPromises = objects.map((object) => {
        const newKey = object.Key.replace(oldFolderName, newFolderName);
        const copyParams = {
          Bucket: bucketName,
          CopySource: `${bucketName}/${object.Key}`,
          Key: newKey,
        };
        return s3.copyObject(copyParams).promise();
      });

      Promise.all(copyPromises)
        .then(() => {
          const deletePromises = objects.map((object) => {
            const deleteParams = {
              Bucket: bucketName,
              Key: object.Key,
            };
            return s3.deleteObject(deleteParams).promise();
          });

          return Promise.all(deletePromises);
        })
        .then(() => res.send({ message: "Folder renamed successfully" }))
        .catch((err) => {
          console.error("Error : ", err);
          res.status(500).send(err);
        });
    }
  });
});

app.post("/deleteFolder", (req, res) => {
  const { accessKeyId, secretAccessKey, region, bucketName, folderName } =
    req.body;

  // Update AWS global configuration
  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region,
  });

  const s3 = new AWS.S3();

  // List all objects in the folder
  const listParams = {
    Bucket: bucketName,
    Prefix: folderName,
  };

  s3.listObjects(listParams, (err, data) => {
    if (err) {
      console.error("Error : ", err);
      res.status(500).send(err);
    } else {
      const objects = data.Contents;
      const deletePromises = objects.map((object) => {
        const deleteParams = {
          Bucket: bucketName,
          Key: object.Key,
        };
        return s3.deleteObject(deleteParams).promise();
      });

      Promise.all(deletePromises)
        .then(() => res.send({ message: "Folder deleted successfully" }))
        .catch((err) => {
          console.error("Error : ", err);
          res.status(500).send(err);
        });
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
