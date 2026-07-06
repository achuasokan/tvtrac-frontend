import { api } from '@/lib/api';

export const authService = {
  /**
   * Send the Google Access Token to the backend for verification and login.
   * @param accessToken The access token received from Google OAuth implicit flow
   */
  async googleLogin(accessToken: string) {
    const response = await api.post('/auth/google', { accessToken });
    return response.data;
  },

  /**
   * Log the user out
   */
  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Fetch the current authenticated user's profile
   */
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  }
};
