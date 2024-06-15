import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./authSlice";
import displayReducer from "./displaySlice";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    display: displayReducer,
  },
});
