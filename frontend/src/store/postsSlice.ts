import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/api';

const initialState = {
  posts: [],
  currentPost: null,
  isLoading: false,
  error: null,
};

export const loadPosts = createAsyncThunk('posts/loadPosts', async (organizationId, thunkAPI) => {
  try {
    const response = await apiClient.getPosts(organizationId ? { organizationId } : undefined);
    return Array.isArray(response) ? response : response.items;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const createPost = createAsyncThunk('posts/createPost', async (data, thunkAPI) => {
  try {
    const newPost = await apiClient.createPost(data);
    return newPost;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const updatePost = createAsyncThunk('posts/updatePost', async ({ id, data }, thunkAPI) => {
  try {
    const updatedPost = await apiClient.updatePost(id, data);
    return updatedPost;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const deletePost = createAsyncThunk('posts/deletePost', async (id, thunkAPI) => {
  try {
    await apiClient.deletePost(id);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    setCurrentPost(state, action) {
      state.currentPost = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts = action.payload;
      })
      .addCase(loadPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.push(action.payload);
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.posts = state.posts.map(post => post.id === action.payload.id ? action.payload : post);
        if (state.currentPost && state.currentPost.id === action.payload.id) {
          state.currentPost = action.payload;
        }
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter(post => post.id !== action.payload);
        if (state.currentPost && state.currentPost.id === action.payload) {
          state.currentPost = null;
        }
      });
  },
});

export const { setCurrentPost } = postsSlice.actions;
export default postsSlice.reducer; 