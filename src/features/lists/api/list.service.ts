import { api } from '@/lib/api';
import { IList, CreateListDTO, AddListItemDTO, RemoveListItemDTO } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error: string | null;
}

export const listService = {
  async getLists(): Promise<IList[]> {
    const response = await api.get<ApiResponse<IList[]>>('/lists');
    return response.data.data;
  },

  async createList(data: CreateListDTO): Promise<IList> {
    const response = await api.post<ApiResponse<IList>>('/lists', data);
    return response.data.data;
  },

  async updateList(listId: string, data: Partial<CreateListDTO>): Promise<IList> {
    const response = await api.put<ApiResponse<IList>>(`/lists/${listId}`, data);
    return response.data.data;
  },

  async deleteList(listId: string): Promise<void> {
    await api.delete<ApiResponse<null>>(`/lists/${listId}`);
  },

  async addToList(listId: string, data: AddListItemDTO): Promise<IList> {
    const response = await api.post<ApiResponse<IList>>(`/lists/${listId}/items`, data);
    return response.data.data;
  },

  async removeFromList(listId: string, data: RemoveListItemDTO): Promise<IList> {
    const response = await api.delete<ApiResponse<IList>>(`/lists/${listId}/items`, { data });
    return response.data.data;
  }
};
