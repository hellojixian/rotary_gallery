import express from 'express';
import path from 'path';
import { AlbumService } from '../services/albumService';
import { ApiResponse } from '../types';

const router = express.Router();
const albumService = new AlbumService();

// 获取所有相册
router.get('/', async (req, res) => {
  try {
    const albums = await albumService.getAllAlbums();
    const response: ApiResponse<typeof albums> = {
      success: true,
      data: albums
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching albums:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch albums'
    };
    res.status(500).json(response);
  }
});

// 获取特定相册
router.get('/:albumId', async (req, res) => {
  try {
    const { albumId } = req.params;
    const album = await albumService.getAlbum(albumId);
    
    if (!album) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Album not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof album> = {
      success: true,
      data: album
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching album:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch album'
    };
    res.status(500).json(response);
  }
});

// 获取图片信息
router.get('/:albumId/images/:imageName/info', async (req, res) => {
  try {
    const { albumId, imageName } = req.params;
    const imageInfo = await albumService.getImageInfo(albumId, imageName);
    
    if (!imageInfo) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Image not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof imageInfo> = {
      success: true,
      data: imageInfo
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching image info:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch image info'
    };
    res.status(500).json(response);
  }
});

// 直接提供图片文件
router.get('/:albumId/images/:imageName', async (req, res) => {
  try {
    const { albumId, imageName } = req.params;
    const albumsPath = path.join(process.cwd(), '..', 'albums');
    const imagePath = path.join(albumsPath, albumId, imageName);
    
    // 设置适当的缓存头
    res.set({
      'Cache-Control': 'public, max-age=86400', // 缓存1天
      'Content-Type': 'image/jpeg'
    });
    
    res.sendFile(imagePath, (err) => {
      if (err) {
        console.error('Error serving image:', err);
        const response: ApiResponse<null> = {
          success: false,
          error: 'Image not found'
        };
        res.status(404).json(response);
      }
    });
  } catch (error) {
    console.error('Error serving image:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to serve image'
    };
    res.status(500).json(response);
  }
});

export default router;
