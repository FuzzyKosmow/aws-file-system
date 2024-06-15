import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  displayInfo: {
    selectedBucket: "",
    selectedFolder: "",
    currentPath: "",
    selectedObjects: [],
    objectsFromBucket: [],
    //For upload
    //Tree used to display the folder structure
    tree: {},
  },
};

const displaySlice = createSlice({
  name: "display",
  initialState,
  reducers: {
    setSelectedBucket: (state, action) => {
      state.displayInfo.selectedBucket = action.payload;
    },
    setSelectedFolder: (state, action) => {
      state.displayInfo.selectedFolder = action.payload;
    },
    toggleSelectedFolder: (state, action) => {
      //Similar to toggleSelectedObject, but only one folder can be selected at a time
      state.displayInfo.selectedFolder =
        state.displayInfo.selectedFolder === action.payload
          ? ""
          : action.payload;
    },

    setCurrentPath: (state, action) => {
      state.displayInfo.currentPath = action.payload;
    },
    setSelectedObjects: (state, action) => {
      state.displayInfo.selectedObjects = action.payload;
    },
    toggleSelectedObject: (state, action) => {
      state.displayInfo.selectedObjects =
        state.displayInfo.selectedObjects.some(
          (selected) => selected.Key === action.payload.Key
        )
          ? state.displayInfo.selectedObjects.filter(
              (selected) => selected.Key !== action.payload.Key
            )
          : [...state.displayInfo.selectedObjects, action.payload];
    },

    setObjectsFromBucket: (state, action) => {
      state.displayInfo.objectsFromBucket = action.payload;
    },
    setTree: (state, action) => {
      state.displayInfo.tree = action.payload;
    },

    clearDisplayInfo: (state) => {
      state.displayInfo = {
        selectedBucket: "",
        selectedFolder: "",
        currentPath: "",
        selectedObjects: [],
        displayObjects: [],
        objectsFromBucket: [],
        tree: {},
      };
    },
  },
});

export const {
  setSelectedBucket,
  setSelectedFolder,
  setCurrentPath,
  setSelectedObjects,
  setObjectsFromBucket,
  setTree,
  clearDisplayInfo,
  toggleSelectedFolder,
  toggleSelectedObject,
} = displaySlice.actions;

export default displaySlice.reducer;
