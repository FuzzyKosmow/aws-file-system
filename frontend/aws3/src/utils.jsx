// const createFolder = async (folderName) => {
//   try {
//     await axios.post("http://localhost:5000/createFolder", {
//       accessKeyId,
//       secretAccessKey,
//       region,
//       bucketName: selectedBucket,
//       folderName,
//     });
//     // Refresh the list of objects after creating the folder
//     listObjectsFromBucket(selectedBucket);
//   } catch (error) {
//     console.error(error);
//   }
// };

// const editFile = async (oldFileName, newFileName) => {
//   try {
//     await axios.post("http://localhost:5000/editFile", {
//       accessKeyId,
//       secretAccessKey,
//       region,
//       bucketName: selectedBucket,
//       oldFileName,
//       newFileName,
//     });
//     // Refresh the list of objects after editing the file
//     listObjectsFromBucket(selectedBucket);
//   } catch (error) {
//     console.error(error);
//   }
// };

// const deleteFile = async (fileName) => {
//   try {
//     await axios.post("http://localhost:5000/deleteFile", {
//       accessKeyId,
//       secretAccessKey,
//       region,
//       bucketName: selectedBucket,
//       fileName,
//     });
//     // Refresh the list of objects after deleting the file
//     listObjectsFromBucket(selectedBucket);
//   } catch (error) {
//     console.error(error);
//   }
// };

// const moveFile = async (oldFilePath, newFilePath) => {
//   try {
//     await axios.post("http://localhost:5000/moveFile", {
//       accessKeyId,
//       secretAccessKey,
//       region,
//       bucketName: selectedBucket,
//       oldFilePath,
//       newFilePath,
//     });
//     // Refresh the list of objects after moving the file
//     listObjectsFromBucket(selectedBucket);
//   } catch (error) {
//     console.error(error);
//   }
// };

// const editFolder = async (oldFolderName, newFolderName) => {
//   try {
//     await axios.post("http://localhost:5000/editFolder", {
//       accessKeyId,
//       secretAccessKey,
//       region,
//       bucketName: selectedBucket,
//       oldFolderName,
//       newFolderName,
//     });
//     // Refresh the list of objects after editing the folder
//     listObjectsFromBucket(selectedBucket);
//   } catch (error) {
//     console.error(error);
//   }
// };

// const deleteFolder = async (folderName) => {
//   try {
//     await axios.post("http://localhost:5000/deleteFolder", {
//       accessKeyId,
//       secretAccessKey,
//       region,
//       bucketName: selectedBucket,
//       folderName,
//     });
//     // Refresh the list of objects after deleting the folder
//     listObjectsFromBucket(selectedBucket);
//   } catch (error) {
//     console.error(error);
//   }
// };
