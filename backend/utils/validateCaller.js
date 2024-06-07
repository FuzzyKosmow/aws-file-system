const validateCredentials = (accessKeyId, secretAccessKey, region) => {
  return new Promise((resolve, reject) => {
    // Update AWS global configuration
    AWS.config.update({
      accessKeyId,
      secretAccessKey,
      region,
    });

    const sts = new AWS.STS();
    sts.getCallerIdentity({}, (err, data) => {
      if (err) {
        console.error("Error : ", err);
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

module.exports = validateCredentials;
