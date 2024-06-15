// src/features/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  validAuthCred: {
    accessKey: "",
    secretKey: "",
    region: "",
  },
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthCred: (state, action) => {
      state.validAuthCred = action.payload;
    },
    clearAuthCred: (state) => {
      state.validAuthCred = {
        accessKey: "",
        secretKey: "",
        region: "",
      };
    },
  },
});

export const { setAuthCred, clearAuthCred } = authSlice.actions;

export default authSlice.reducer;
