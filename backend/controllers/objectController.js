const AWS = require("aws-sdk");

//list objects
exports.listObjects = (req, res) => {
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
};

//upload file
exports.uploadFile = (req, res) => {
  const { accessKeyId, secretAccessKey, region, bucketName } = req.body;
  const file = req.file;

  // Update AWS global configuration
  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region,
  });

  const s3 = new AWS.S3();

  const params = {
    Bucket: bucketName,
    Key: file.originalname,
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
};

//edit file
exports.editFile = (req, res) => {
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
};

//delete file
exports.deleteFile = (req, res) => {
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
};

//move file
exports.moveFile = (req, res) => {
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
};
