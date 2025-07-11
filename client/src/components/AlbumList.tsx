import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Album } from '../types/index';
import { albumsApi } from '../services/api';
import './AlbumList.css';

export const AlbumList: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setLoading(true);
        const albumsData = await albumsApi.getAllAlbums();
        setAlbums(albumsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching albums:', err);
        setError(err instanceof Error ? err.message : 'Failed to load albums');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, []);

  if (loading) {
    return (
      <div className="album-list-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>加载相册中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="album-list-container">
        <div className="error">
          <h2>加载失败</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-btn"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="album-list-container">
      <header className="album-list-header">
        <h1>360° 图片画廊</h1>
        <p>选择一个相册开始浏览</p>
      </header>

      <div className="album-grid">
        {albums.map((album) => (
          <Link
            key={album.id}
            to={`/album/${encodeURIComponent(album.id)}`}
            className="album-card"
          >
            <div className="album-thumbnail">
              <img
                src={albumsApi.getImageUrl(album.id, album.metadata.images[0])}
                alt={album.metadata.name}
                loading="lazy"
                onError={(e) => {
                  // 如果主要URL失败，尝试静态URL
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('/static/')) {
                    target.src = albumsApi.getStaticImageUrl(album.id, album.metadata.images[0]);
                  }
                }}
              />
              <div className="album-overlay">
                <div className="album-info">
                  <h3>{album.metadata.name}</h3>
                  <p>{album.metadata.images.length} 张图片</p>
                </div>
              </div>
            </div>

            <div className="album-details">
              <h3>{album.metadata.name}</h3>
              <p className="album-description">{album.metadata.description}</p>
              <div className="album-meta">
                <span className="image-count">{album.metadata.images.length} 张图片</span>
                {album.metadata.shootingInfo?.camera && (
                  <span className="camera-info">{album.metadata.shootingInfo.camera}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {albums.length === 0 && (
        <div className="empty-state">
          <h2>暂无相册</h2>
          <p>请在 albums 目录中添加图片文件夹</p>
        </div>
      )}
    </div>
  );
};
