import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { listService } from '../api/list.service';
import { IList, CreateListDTO, AddListItemDTO, RemoveListItemDTO } from '../types';

interface ListState {
  lists: IList[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ListState = {
  lists: [],
  isLoading: false,
  error: null,
};

export const fetchLists = createAsyncThunk(
  'lists/fetchLists',
  async (_, { rejectWithValue }) => {
    try {
      return await listService.getLists();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch lists');
    }
  }
);

export const createNewList = createAsyncThunk(
  'lists/createNewList',
  async (data: CreateListDTO, { rejectWithValue }) => {
    try {
      return await listService.createList(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create list');
    }
  }
);

export const updateListDetails = createAsyncThunk(
  'lists/updateListDetails',
  async ({ listId, data }: { listId: string; data: Partial<CreateListDTO> }, { rejectWithValue }) => {
    try {
      return await listService.updateList(listId, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update list');
    }
  }
);

export const addMovieToList = createAsyncThunk(
  'lists/addMovieToList',
  async ({ listId, data }: { listId: string; data: AddListItemDTO }, { rejectWithValue }) => {
    try {
      return await listService.addToList(listId, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add item to list');
    }
  }
);

export const removeMovieFromList = createAsyncThunk(
  'lists/removeMovieFromList',
  async ({ listId, data }: { listId: string; data: RemoveListItemDTO }, { rejectWithValue }) => {
    try {
      return await listService.removeFromList(listId, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove item from list');
    }
  }
);

export const deleteList = createAsyncThunk(
  'lists/deleteList',
  async (listId: string, { rejectWithValue }) => {
    try {
      await listService.deleteList(listId);
      return listId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete list');
    }
  }
);

const listSlice = createSlice({
  name: 'lists',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchLists
    builder.addCase(fetchLists.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchLists.fulfilled, (state, action) => {
      state.isLoading = false;
      state.lists = action.payload;
    });
    builder.addCase(fetchLists.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // createNewList
    builder.addCase(createNewList.fulfilled, (state, action) => {
      state.lists.unshift(action.payload); // Add new list to the top
    });

    // updateListDetails, addMovieToList, removeMovieFromList
    const updateListInState = (state: ListState, action: any) => {
      const index = state.lists.findIndex(l => l.id === action.payload.id);
      if (index !== -1) {
        state.lists[index] = action.payload;
      }
    };
    builder.addCase(updateListDetails.fulfilled, updateListInState);
    builder.addCase(addMovieToList.fulfilled, updateListInState);
    builder.addCase(removeMovieFromList.fulfilled, updateListInState);

    // deleteList
    builder.addCase(deleteList.fulfilled, (state, action) => {
      state.lists = state.lists.filter(l => l.id !== action.payload);
    });
  },
});

export default listSlice.reducer;
