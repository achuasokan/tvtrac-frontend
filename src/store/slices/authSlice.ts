import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '@/services/auth.service';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  username: string;
  role: string;
  coverPhoto?: string;
  favoriteShows?: string[];
  favoriteMovies?: string[];
  watchlistShows?: string[];
  watchlistMovies?: string[];
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: true, // true by default since we check on load
  error: null,
};

// Async thunk to fetch the current user
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getCurrentUser();
      return response.user as User;
    } catch (error: any) {
      // 401s are normal if not logged in
      return rejectWithValue(error.response?.data?.message || 'Failed to authenticate');
    }
  }
);

// Async thunk to log out
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      // Redirect happens in the component or we could do it here
      return null;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to logout');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isLoading = false;
    },
    clearUser: (state) => {
      state.user = null;
      state.isLoading = false;
    }
  },
  extraReducers: (builder) => {
    // fetchCurrentUser
    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
    });
    builder.addCase(fetchCurrentUser.rejected, (state, action) => {
      state.isLoading = false;
      state.user = null;
      state.error = action.payload as string;
    });

    // logoutUser
    builder.addCase(logoutUser.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.isLoading = false;
      state.user = null;
    });
    builder.addCase(logoutUser.rejected, (state) => {
      state.isLoading = false;
      // even if logout fails, we can clear the user state locally
      state.user = null;
    });
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
