import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { Album, AlbumMetadata, ImageInfo } from '../types';
import { extractExifData } from '../utils/exifUtils';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

export class AlbumService {
  private albumsPath: string;

  constructor(albumsPath: string = path.join(process.cwd(), '..', 'albums')) {
    this.albumsPath = albumsPath;
  }

  async getAllAlbums(): Promise<Album[]> {
    try {
      const albumDirs = await this.getAlbumDirectories();
      const albums: Album[] = [];

      for (const albumDir of albumDirs) {
        const albumPath = path.join(this.albumsPath, albumDir);
        const metadata = await this.getOrCreateMetadata(albumPath, albumDir);
        
        albums.push({
          id: albumDir,
          path: albumPath,
          metadata
        });
      }

      return albums;
    } catch (error) {
      console.error('Error getting albums:', error);
      throw error;
    }
  }

  async getAlbum(albumId: string): Promise<Album | null> {
    try {
      const albumPath = path.join(this.albumsPath, albumId);
      const albumStat = await stat(albumPath);
      
      if (!albumStat.isDirectory()) {
        return null;
      }

      const metadata = await this.getOrCreateMetadata(albumPath, albumId);
      
      return {
        id: albumId,
        path: albumPath,
        metadata
      };
    } catch (error) {
      console.error(`Error getting album ${albumId}:`, error);
      return null;
    }
  }

  private async getAlbumDirectories(): Promise<string[]> {
    const items = await readdir(this.albumsPath);
    const directories: string[] = [];

    for (const item of items) {
      const itemPath = path.join(this.albumsPath, item);
      const itemStat = await stat(itemPath);
      
      if (itemStat.isDirectory()) {
        directories.push(item);
      }
    }

    return directories.sort();
  }

  private async getOrCreateMetadata(albumPath: string, albumName: string): Promise<AlbumMetadata> {
    const metadataPath = path.join(albumPath, 'metadata.json');
    
    try {
      // 尝试读取现有的metadata.json
      const metadataContent = await readFile(metadataPath, 'utf-8');
      const metadata: AlbumMetadata = JSON.parse(metadataContent);
      
      // 验证并更新图片列表
      const currentImages = await this.getImageFiles(albumPath);
      if (JSON.stringify(metadata.images) !== JSON.stringify(currentImages)) {
        metadata.images = currentImages;
        metadata.updatedAt = new Date().toISOString();
        await this.saveMetadata(metadataPath, metadata);
      }
      
      return metadata;
    } catch (error) {
      // 如果文件不存在或无法解析，创建新的metadata
      console.log(`Creating new metadata for album: ${albumName}`);
      return await this.createNewMetadata(albumPath, albumName, metadataPath);
    }
  }

  private async createNewMetadata(albumPath: string, albumName: string, metadataPath: string): Promise<AlbumMetadata> {
    const images = await this.getImageFiles(albumPath);
    const shootingInfo = await this.extractShootingInfo(albumPath, images);
    
    const metadata: AlbumMetadata = {
      name: albumName,
      description: `360度图片集：${albumName}`,
      images,
      shootingInfo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.saveMetadata(metadataPath, metadata);
    return metadata;
  }

  private async getImageFiles(albumPath: string): Promise<string[]> {
    const files = await readdir(albumPath);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    
    const imageFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      })
      .sort(); // 按文件名升序排列

    return imageFiles;
  }

  private async extractShootingInfo(albumPath: string, images: string[]): Promise<AlbumMetadata['shootingInfo']> {
    if (images.length === 0) return undefined;

    try {
      // 从第一张图片提取EXIF信息
      const firstImagePath = path.join(albumPath, images[0]);
      const exifData = await extractExifData(firstImagePath);
      
      return {
        camera: exifData?.Make && exifData?.Model ? `${exifData.Make} ${exifData.Model}` : undefined,
        lens: exifData?.LensModel || undefined,
        date: exifData?.DateTimeOriginal || exifData?.DateTime || undefined,
        settings: {
          iso: exifData?.ISO || undefined,
          aperture: exifData?.FNumber ? `f/${exifData.FNumber}` : undefined,
          shutterSpeed: exifData?.ExposureTime || undefined,
          focalLength: exifData?.FocalLength ? `${exifData.FocalLength}mm` : undefined
        }
      };
    } catch (error) {
      console.error('Error extracting shooting info:', error);
      return undefined;
    }
  }

  private async saveMetadata(metadataPath: string, metadata: AlbumMetadata): Promise<void> {
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }

  async getImageInfo(albumId: string, imageName: string): Promise<ImageInfo | null> {
    try {
      const albumPath = path.join(this.albumsPath, albumId);
      const imagePath = path.join(albumPath, imageName);
      
      const imageStat = await stat(imagePath);
      if (!imageStat.isFile()) {
        return null;
      }

      const exifData = await extractExifData(imagePath);
      
      return {
        filename: imageName,
        path: imagePath,
        size: imageStat.size,
        dimensions: exifData?.ImageWidth && exifData?.ImageHeight ? {
          width: exifData.ImageWidth,
          height: exifData.ImageHeight
        } : undefined,
        exif: exifData
      };
    } catch (error) {
      console.error(`Error getting image info for ${albumId}/${imageName}:`, error);
      return null;
    }
  }
}
