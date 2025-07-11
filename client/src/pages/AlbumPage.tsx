import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Album } from '../types/index';
import { albumsApi } from '../services/api';
import { RotaryViewer } from '../components/RotaryViewer';
import './AlbumPage.css';

export const AlbumPage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!albumId) {
        setError('相册ID不存在');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const decodedAlbumId = decodeURIComponent(albumId);
        const albumData = await albumsApi.getAlbum(decodedAlbumId);
        setAlbum(albumData);
        setError(null);
      } catch (err) {
        console.error('Error fetching album:', err);
        setError(err instanceof Error ? err.message : 'Failed to load album');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [albumId]);

  if (loading) {
    return (
      <div className="album-page-loading">
        <div className="loading-spinner"></div>
        <p>加载相册中...</p>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="album-page-error">
        <h2>加载失败</h2>
        <p>{error || '相册不存在'}</p>
        <div className="error-actions">
          <button onClick={() => navigate('/')} className="back-btn">
            返回首页
          </button>
          <button onClick={() => window.location.reload()} className="retry-btn">
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="album-page">
      <button
        onClick={() => navigate('/')}
        className="back-button"
        title="返回相册列表"
      >
        ← 返回
      </button>
      <RotaryViewer album={album} />
    </div>
  );
};
