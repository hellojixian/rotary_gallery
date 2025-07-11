import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Album } from '../types/index';
import { albumsApi } from '../services/api';
import './RotaryViewer.css';

interface RotaryViewerProps {
  album: Album;
}

interface PreloadedImage {
  url: string;
  element: HTMLImageElement;
  loaded: boolean;
  error: boolean;
}

export const RotaryViewer: React.FC<RotaryViewerProps> = ({ album }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [isImageSwitchDrag, setIsImageSwitchDrag] = useState(false);
  const [dragProgress, setDragProgress] = useState(0); // 拖拽进度 0-1
  const [isDragActive, setIsDragActive] = useState(false);
  const [dragStartImageIndex, setDragStartImageIndex] = useState(0); // 拖拽开始时的图片索引
  const [isAltPressed, setIsAltPressed] = useState(false); // Alt键是否按下

  // 预加载相关状态
  const [preloadedImages, setPreloadedImages] = useState<PreloadedImage[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const images = album.metadata.images;
  const totalImages = images.length;

  // 预加载所有图片
  useEffect(() => {
    let isMounted = true; // 防止组件卸载后的状态更新

    const preloadImages = async () => {
      const imagePromises = images.map((imageName) => {
        return new Promise<PreloadedImage>((resolve) => {
          const img = new Image();
          const url = albumsApi.getImageUrl(album.id, imageName);

          const preloadedImage: PreloadedImage = {
            url,
            element: img,
            loaded: false,
            error: false
          };

          img.onload = () => {
            if (!isMounted) return;
            preloadedImage.loaded = true;
            setLoadingProgress(prev => {
              const newProgress = prev + (100 / totalImages);
              return Math.min(newProgress, 100);
            });
            resolve(preloadedImage);
          };

          img.onerror = () => {
            if (!isMounted) return;
            preloadedImage.error = true;
            // 尝试备用URL
            const staticUrl = albumsApi.getStaticImageUrl(album.id, imageName);
            const fallbackImg = new Image();
            fallbackImg.onload = () => {
              if (!isMounted) return;
              preloadedImage.url = staticUrl;
              preloadedImage.element = fallbackImg;
              preloadedImage.loaded = true;
              preloadedImage.error = false;
              setLoadingProgress(prev => {
                const newProgress = prev + (100 / totalImages);
                return Math.min(newProgress, 100);
              });
              resolve(preloadedImage);
            };
            fallbackImg.onerror = () => {
              if (!isMounted) return;
              setLoadingProgress(prev => {
                const newProgress = prev + (100 / totalImages);
                return Math.min(newProgress, 100);
              });
              resolve(preloadedImage);
            };
            fallbackImg.src = staticUrl;
          };

          img.src = url;
        });
      });

      const loadedImages = await Promise.all(imagePromises);
      if (isMounted) {
        setPreloadedImages(loadedImages);
        setAllImagesLoaded(true);
      }
    };

    // 重置状态
    setLoadingProgress(0);
    setAllImagesLoaded(false);
    setPreloadedImages([]);

    preloadImages();

    // 清理函数
    return () => {
      isMounted = false;
    };
  }, [album.id, images, totalImages]);

  // 自动播放功能
  useEffect(() => {
    if (isPlaying && allImagesLoaded) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % totalImages);
      }, 100);
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
  }, [isPlaying, totalImages, allImagesLoaded]);



  // 键盘控制和Ctrl键检测
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检测Alt键状态
      if (e.key === 'Alt') {
        setIsAltPressed(true);
        return;
      }

      // 如果图片还没有预加载完成，只允许跳过预加载的快捷键
      if (!allImagesLoaded) {
        if (e.key === 'Escape') {
          e.preventDefault();
          // 跳过预加载，直接显示第一张图片
          setAllImagesLoaded(true);
          setLoadingProgress(100);
        }
        return;
      }

      // 处理Ctrl+组合键
      if (e.ctrlKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            // Ctrl+加号：放大
            setScale(prev => Math.min(3, prev * 1.2));
            break;
          case '-':
            e.preventDefault();
            // Ctrl+减号：缩小
            const newScale = Math.max(0.5, scale * 0.8);
            setScale(newScale);
            if (newScale <= 1) {
              setPosition({ x: 0, y: 0 });
            }
            break;
          case '0':
            e.preventDefault();
            // Ctrl+0：重置缩放
            resetZoom();
            break;
        }
        return;
      }

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

    const handleKeyUp = (e: KeyboardEvent) => {
      // 检测Alt键释放
      if (e.key === 'Alt') {
        setIsAltPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, totalImages, allImagesLoaded]);

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
    if (!allImagesLoaded) return;

    // 检查是否按住Alt键进行图片切换拖拽
    const isAltDrag = e.altKey || isAltPressed;

    if (scale > 1 && !isAltDrag) {
      // 放大状态下的拖拽移动（非Alt+拖拽）
      setIsDragging(true);
      setIsImageSwitchDrag(false);
      setIsDragActive(false);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    } else {
      // 正常状态下的图片切换拖拽 或 Alt+拖拽图片切换
      setIsImageSwitchDrag(true);
      setIsDragging(false);
      setIsDragActive(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setDragProgress(0);
      setDragStartImageIndex(currentImageIndex); // 记录拖拽开始时的图片索引
    }
  }, [scale, position, allImagesLoaded, currentImageIndex, isAltPressed]);

  // 根据拖拽位置计算应该显示的图片索引
  const calculateImageIndexFromDrag = useCallback((clientX: number, containerWidth: number) => {
    if (!containerRef.current) return dragStartImageIndex;

    const dragStartX = dragStart.x;
    const deltaX = clientX - dragStartX;

    // 计算每张图片对应的像素宽度
    const pixelsPerImage = containerWidth / totalImages;

    // 计算拖拽了多少张图片的距离
    const imagesDragged = deltaX / pixelsPerImage;

    // 使用Math.round来确保只有拖拽超过半张图片宽度才切换
    const imagesToSwitch = Math.round(imagesDragged);

    // 计算目标图片索引（基于拖拽开始时的索引）
    let targetIndex = dragStartImageIndex - imagesToSwitch;

    // 确保索引在有效范围内，支持循环
    while (targetIndex < 0) targetIndex += totalImages;
    while (targetIndex >= totalImages) targetIndex -= totalImages;

    return targetIndex;
  }, [dragStartImageIndex, totalImages, dragStart.x]);

  // 根据拖拽位置实时更新显示的图片
  const updateImageFromDrag = useCallback((clientX: number) => {
    if (!containerRef.current || !isDragActive) return;

    const containerWidth = containerRef.current.offsetWidth;
    const newIndex = calculateImageIndexFromDrag(clientX, containerWidth);

    // 计算拖拽进度（用于视觉反馈）
    const deltaX = clientX - dragStart.x;
    const pixelsPerImage = containerWidth / totalImages;
    const imagesDragged = Math.abs(deltaX) / pixelsPerImage;
    setDragProgress(Math.min(imagesDragged / totalImages, 0.5)); // 最大显示50%进度

    // 实时更新图片索引
    if (newIndex !== currentImageIndex) {
      setCurrentImageIndex(newIndex);
    }
  }, [isDragActive, calculateImageIndexFromDrag, dragStart.x, currentImageIndex, totalImages]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const isAltDrag = e.altKey || isAltPressed;

    if (isDragging && scale > 1 && !isAltDrag) {
      // 放大状态下的图片移动（非Alt+拖拽）
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (isImageSwitchDrag && (scale <= 1 || isAltDrag)) {
      // 图片切换拖拽时实时更新图片（正常状态或Alt+拖拽）
      updateImageFromDrag(e.clientX);
    }
  }, [isDragging, scale, dragStart, isImageSwitchDrag, updateImageFromDrag, isAltPressed]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsImageSwitchDrag(false);
    setIsDragActive(false);
    setDragProgress(0);
    setDragStartImageIndex(0);
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

  // 获取当前图片信息
  const getCurrentImageInfo = useCallback(() => {
    if (!allImagesLoaded || preloadedImages.length === 0) {
      return {
        url: albumsApi.getImageUrl(album.id, images[currentImageIndex]),
        loaded: false,
        error: false,
        element: null
      };
    }

    const preloadedImage = preloadedImages[currentImageIndex];
    return {
      url: preloadedImage.url,
      loaded: preloadedImage.loaded,
      error: preloadedImage.error,
      element: preloadedImage.element
    };
  }, [allImagesLoaded, preloadedImages, currentImageIndex, album.id, images]);

  const currentImageInfo = getCurrentImageInfo();

  return (
    <div className="rotary-viewer" ref={containerRef}>
      <div className="viewer-header">
        <h2>{album.metadata.name}</h2>
        <div className="viewer-info">
          {currentImageIndex + 1} / {totalImages}
        </div>
      </div>

      {/* 图片预加载进度条 */}
      {!allImagesLoaded && (
        <div className="preload-overlay">
          <div className="preload-content">
            <div className="preload-spinner"></div>
            <h3>正在加载图片...</h3>
            <div className="preload-progress-container">
              <div
                className="preload-progress-bar"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p>{Math.round(loadingProgress)}% ({Math.round(loadingProgress * totalImages / 100)} / {totalImages})</p>
            <div className="preload-skip-hint">
              <p>按 ESC 键跳过预加载</p>
            </div>
          </div>
        </div>
      )}

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
        {/* 拖拽进度提示 */}
        {isDragActive && (
          <div className="drag-progress-hint">
            <div className="drag-progress-bar">
              <div
                className="drag-progress-fill"
                style={{ width: `${dragProgress * 100}%` }}
              />
            </div>
            <span className="drag-text">
              {isAltPressed && scale > 1 ? 'Alt+拖拽浏览图片' : '拖拽浏览图片'}
            </span>
          </div>
        )}

        {currentImageInfo.error ? (
          <div className="image-error">
            <p>图片加载失败</p>
            <button onClick={() => window.location.reload()}>重试</button>
          </div>
        ) : (
          <img
            ref={imageRef}
            src={currentImageInfo.url}
            alt={`${album.metadata.name} - ${currentImageIndex + 1}`}
            className="rotary-image"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              cursor: (() => {
                if (scale > 1) {
                  if (isAltPressed) {
                    // 放大状态下按住Alt：显示图片切换光标
                    return isImageSwitchDrag ? 'grabbing' : 'grab';
                  } else {
                    // 放大状态下正常：显示移动光标
                    return isDragging ? 'grabbing' : 'grab';
                  }
                } else {
                  // 正常状态：显示图片切换光标
                  return isImageSwitchDrag ? 'grabbing' : 'grab';
                }
              })(),
              opacity: allImagesLoaded && currentImageInfo.loaded ? 1 : 0.5
            }}
            draggable={false}
          />
        )}
      </div>

      <div className="viewer-controls">
        <button
          onClick={() => setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages)}
          className="control-btn"
          disabled={!allImagesLoaded}
        >
          ⬅️
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="control-btn play-btn"
          disabled={!allImagesLoaded}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        <button
          onClick={() => setCurrentImageIndex((prev) => (prev + 1) % totalImages)}
          className="control-btn"
          disabled={!allImagesLoaded}
        >
          ➡️
        </button>

        <button
          onClick={resetZoom}
          className="control-btn"
          disabled={!allImagesLoaded || (scale === 1 && position.x === 0 && position.y === 0)}
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
        <p>💡 提示：使用 ← → 键切换图片，鼠标横向拖拽实时浏览，Alt+拖拽在放大时切换图片，Ctrl+/- 缩放，空格键播放/暂停，R键重置缩放</p>
      </div>
    </div>
  );
};
