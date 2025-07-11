import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Album } from '../types/index';
import { albumsApi } from '../services/api';
import './RotaryViewer.css';

interface RotaryViewerProps {
  album: Album;
}

export const RotaryViewer: React.FC<RotaryViewerProps> = ({ album }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const images = album.metadata.images;
  const totalImages = images.length;

  // 自动播放功能
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % totalImages);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, totalImages]);

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
          break;
        case 'ArrowRight':
          setCurrentImageIndex((prev) => (prev + 1) % totalImages);
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case 'r':
          resetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, totalImages]);

  // 重置缩放和位置
  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // 触摸事件处理
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // 单指触摸
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX, y: touch.clientY });

      if (scale > 1) {
        // 放大状态下允许拖拽
        setIsDragging(true);
      }
    } else if (e.touches.length === 2) {
      // 双指触摸 - 开始缩放
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setLastTouchDistance(distance);
      setIsDragging(false);
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1 && isDragging && scale > 1) {
      // 单指拖拽（仅在放大时）
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;
      setPosition({
        x: position.x + deltaX,
        y: position.y + deltaY
      });
      setDragStart({ x: touch.clientX, y: touch.clientY });
    } else if (e.touches.length === 2) {
      // 双指缩放
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      if (lastTouchDistance > 0) {
        const scaleChange = distance / lastTouchDistance;
        const newScale = Math.max(0.5, Math.min(3, scale * scaleChange));
        setScale(newScale);

        // 如果缩放回到1，重置位置
        if (newScale <= 1) {
          setPosition({ x: 0, y: 0 });
        }
      }
      setLastTouchDistance(distance);
    }
  }, [isDragging, scale, dragStart, lastTouchDistance, position]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      // 检查是否为滑动手势（仅在未放大状态下）
      if (scale <= 1 && !isDragging) {
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - dragStart.x;
        const deltaY = touch.clientY - dragStart.y;

        // 滑动阈值和方向检测
        const threshold = 50;
        const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);

        if (isHorizontalSwipe && Math.abs(deltaX) > threshold) {
          if (deltaX > 0) {
            // 向右滑动 - 上一张图片
            setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
          } else {
            // 向左滑动 - 下一张图片
            setCurrentImageIndex((prev) => (prev + 1) % totalImages);
          }
        }
      }

      setIsDragging(false);
      setLastTouchDistance(0);
    }
  }, [scale, isDragging, dragStart, totalImages]);

  // 鼠标事件处理（桌面端）
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, scale, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(3, scale * delta));
    setScale(newScale);

    if (newScale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  const currentImage = images[currentImageIndex];
  const imageUrl = albumsApi.getImageUrl(album.id, currentImage);

  // 图片加载事件处理
  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  // 当图片索引改变时重置加载状态
  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [currentImageIndex]);

  return (
    <div className="rotary-viewer" ref={containerRef}>
      <div className="viewer-header">
        <h2>{album.metadata.name}</h2>
        <div className="viewer-info">
          {currentImageIndex + 1} / {totalImages}
        </div>
      </div>

      <div
        className="image-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {imageLoading && (
          <div className="image-loading">
            <div className="loading-spinner"></div>
          </div>
        )}

        {imageError ? (
          <div className="image-error">
            <p>图片加载失败</p>
            <button onClick={() => window.location.reload()}>重试</button>
          </div>
        ) : (
          <img
            ref={imageRef}
            src={imageUrl}
            alt={`${album.metadata.name} - ${currentImageIndex + 1}`}
            className="rotary-image"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              opacity: imageLoading ? 0 : 1
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            draggable={false}
          />
        )}
      </div>

      <div className="viewer-controls">
        <button
          onClick={() => setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages)}
          className="control-btn"
        >
          ⬅️
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="control-btn play-btn"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        <button
          onClick={() => setCurrentImageIndex((prev) => (prev + 1) % totalImages)}
          className="control-btn"
        >
          ➡️
        </button>

        <button
          onClick={resetZoom}
          className="control-btn"
          disabled={scale === 1 && position.x === 0 && position.y === 0}
        >
          🔄
        </button>
      </div>

      <div className="viewer-progress">
        <div
          className="progress-bar"
          style={{ width: `${((currentImageIndex + 1) / totalImages) * 100}%` }}
        />
      </div>

      <div className="viewer-help">
        <p>💡 提示：使用 ← → 键切换图片，空格键播放/暂停，R键重置缩放</p>
      </div>
    </div>
  );
};
