import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/api';
import type { Post, PaginatedResponse } from '@/types';

interface PostsState {
  posts: Post[];
  currentPost: Post | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PostsState = {
  posts: [],
  currentPost: null,
  isLoading: false,
  error: null,
};

export const loadPosts = createAsyncThunk<Post[], string | undefined>(
  'posts/loadPosts',
  async (organizationId, thunkAPI) => {
    try {
      const response = await apiClient.getPosts(organizationId ? { organizationId } : undefined);
      if (Array.isArray(response)) return response as Post[];
      const paginated = response as unknown as PaginatedResponse<Post>;
      if (paginated && Array.isArray(paginated.data)) {
        return paginated.data;
      }
      return [];
    } catch (error) {
      return thunkAPI.rejectWithValue((error as Error).message);
    }
  }
);

export const createPost = createAsyncThunk<Post, any>(
  'posts/createPost',
  async (data, thunkAPI) => {
    try {
      const newPost = await apiClient.createPost(data);
      return newPost as Post;
    } catch (error) {
      return thunkAPI.rejectWithValue((error as Error).message);
    }
  }
);

export type UpdatePostArg = { id: string; data: any };

export const updatePost = createAsyncThunk<Post, UpdatePostArg>(
  'posts/updatePost',
  async ({ id, data }, thunkAPI) => {
    try {
      const updatedPost = await apiClient.updatePost(id, data);
      return updatedPost as Post;
    } catch (error) {
      return thunkAPI.rejectWithValue((error as Error).message);
    }
  }
);

export const deletePost = createAsyncThunk<string, string>(
  'posts/deletePost',
  async (id, thunkAPI) => {
    try {
      await apiClient.deletePost(id);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue((error as Error).message);
    }
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    setCurrentPost(state, action: { payload: Post | null }) {
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
        state.error = action.payload as string | null;
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