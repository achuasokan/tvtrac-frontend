import { api } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants/api-routes';
import { User } from '@/store/slices/authSlice';
import { UpdateProfileDTO, ToggleFavoriteDTO, WatchHistoryItem, ApiResponse } from '../types';

export const profileService = {
    // 1. Update text profile details (name, username)
    async updateProfileDetails(data: UpdateProfileDTO): Promise<User> {
        const response = await api.patch<ApiResponse<User>>(API_ROUTES.USERS.PROFILE, data);
        return response.data.data;
    },

    // 2. Upload Avatar Image
    async uploadAvatar(file: File): Promise<User> {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await api.patch<ApiResponse<User>>(API_ROUTES.USERS.AVATAR, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data.data;
    },

    // 3. Upload Cover Photo Image
    async uploadCoverPhoto(file: File): Promise<User> {
        const formData = new FormData();
        formData.append('coverPhoto', file);

        const response = await api.patch<ApiResponse<User>>(API_ROUTES.USERS.COVER_PHOTO, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data.data;
    },

    // 4. Delete Avatar Image
    async deleteAvatar(): Promise<User> {
        const response = await api.delete<ApiResponse<User>>(API_ROUTES.USERS.AVATAR);
        return response.data.data;
    },

    // 5. Delete Cover Photo Image
    async deleteCoverPhoto(): Promise<User> {
        const response = await api.delete<ApiResponse<User>>(API_ROUTES.USERS.COVER_PHOTO);
        return response.data.data;
    },

    // 6. Toggle Favorite (Add/Remove)
    async toggleFavorite(data: ToggleFavoriteDTO, isAdding: boolean): Promise<User> {
        // Based on the backend route setup:
        // userRouter.post("/favorites", userController.toggleFavorite); // add
        // userRouter.delete("/favorites", userController.toggleFavorite); // remove
        const method = isAdding ? 'post' : 'delete';
        const response = await api.request<ApiResponse<User>>({
            url: API_ROUTES.USERS.FAVORITES,
            method: method,
            data: data
        });
        return response.data.data;
    },

    // 7. Get Watch History
    async getWatchHistory(): Promise<WatchHistoryItem[]> {
        const response = await api.get<ApiResponse<WatchHistoryItem[]>>(API_ROUTES.TRACKING.HISTORY);
        return response.data.data;
    },
};
