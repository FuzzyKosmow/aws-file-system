//create folder
exports.createFolder = (req, res) => {
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
};

//delete folder
exports.deleteFolder = (req, res) => {
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
};
