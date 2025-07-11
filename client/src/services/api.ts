import axios from 'axios';
import type { Album, ApiResponse } from '../types/index';

const API_BASE_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const albumsApi = {
  // 获取所有相册
  getAllAlbums: async (): Promise<Album[]> => {
    const response = await api.get<ApiResponse<Album[]>>('/api/albums');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch albums');
  },

  // 获取特定相册
  getAlbum: async (albumId: string): Promise<Album> => {
    const response = await api.get<ApiResponse<Album>>(`/api/albums/${albumId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch album');
  },

  // 获取图片URL
  getImageUrl: (albumId: string, imageName: string): string => {
    return `${API_BASE_URL}/api/albums/${albumId}/images/${imageName}`;
  },

  // 获取静态图片URL（备用）
  getStaticImageUrl: (albumId: string, imageName: string): string => {
    return `${API_BASE_URL}/static/albums/${albumId}/${imageName}`;
  }
};

export default api;
