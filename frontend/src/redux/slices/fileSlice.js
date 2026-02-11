import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  files: [],
  uploadProgress: {},
  loading: false,
  error: null,
};

const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    setFiles: (state, action) => {
      state.files = action.payload;
    },
    addFile: (state, action) => {
      state.files.unshift(action.payload);
    },
    removeFile: (state, action) => {
      state.files = state.files.filter(file => file._id !== action.payload);
    },
    setUploadProgress: (state, action) => {
      const { fileId, progress } = action.payload;
      state.uploadProgress[fileId] = progress;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setFiles, addFile, removeFile, setUploadProgress, setLoading, setError, clearError } = fileSlice.actions;
export default fileSlice.reducer;