# 图片预加载功能

## 功能概述

为了解决相册播放时的闪黑问题，我们实现了图片预加载功能。现在当用户进入相册时，系统会先加载所有图片，然后才允许用户进行浏览和播放操作。

## 主要改进

### 1. 预加载机制
- **进入相册时自动预加载**：用户点击进入相册后，系统会立即开始预加载所有图片
- **并行加载**：所有图片同时开始加载，提高加载效率
- **备用URL支持**：如果主要URL加载失败，自动尝试静态URL

### 2. 加载进度显示
- **进度条**：显示实时加载进度百分比
- **加载计数**：显示已加载图片数量和总数量
- **加载动画**：优雅的旋转加载动画
- **覆盖层设计**：半透明背景，不影响用户体验

### 3. 用户体验优化
- **控制按钮禁用**：在图片未完全加载前，禁用所有控制按钮
- **无缝切换**：图片预加载完成后，切换时不再有加载延迟
- **视觉反馈**：清晰的加载状态提示

## 技术实现

### 核心组件更新

#### RotaryViewer.tsx
```typescript
// 新增状态管理
const [preloadedImages, setPreloadedImages] = useState<PreloadedImage[]>([]);
const [loadingProgress, setLoadingProgress] = useState(0);
const [allImagesLoaded, setAllImagesLoaded] = useState(false);

// 预加载逻辑
useEffect(() => {
  const preloadImages = async () => {
    const imagePromises = images.map((imageName, index) => {
      return new Promise<PreloadedImage>((resolve) => {
        const img = new Image();
        const url = albumsApi.getImageUrl(album.id, imageName);
        
        img.onload = () => {
          // 更新加载进度
          setLoadingProgress(prev => prev + (100 / totalImages));
          resolve(preloadedImage);
        };
        
        img.onerror = () => {
          // 尝试备用URL
          const fallbackImg = new Image();
          fallbackImg.src = albumsApi.getStaticImageUrl(album.id, imageName);
        };
        
        img.src = url;
      });
    });

    const loadedImages = await Promise.all(imagePromises);
    setPreloadedImages(loadedImages);
    setAllImagesLoaded(true);
  };

  preloadImages();
}, [album.id, images, totalImages]);
```

#### 样式更新 (RotaryViewer.css)
- 新增预加载覆盖层样式
- 进度条动画效果
- 移动端适配优化
- 禁用状态样式改进

## 用户界面

### 加载界面
- **标题**：正在加载图片...
- **进度条**：绿色渐变进度条，带发光效果
- **百分比**：实时显示加载百分比
- **计数器**：显示 "已加载数量 / 总数量"
- **旋转动画**：流畅的加载指示器

### 加载完成后
- 覆盖层自动消失
- 所有控制按钮变为可用状态
- 图片切换无延迟，无闪黑现象

## 性能优化

1. **内存管理**：预加载的图片对象被妥善管理，避免内存泄漏
2. **错误处理**：加载失败的图片会尝试备用URL，确保最大兼容性
3. **进度计算**：精确的进度计算，提供准确的加载反馈
4. **响应式设计**：在不同设备上都有良好的加载体验

## 移动端优化

- 较小的加载动画尺寸
- 适配的进度条高度
- 优化的文字大小
- 触摸友好的界面设计

## 浏览器兼容性

- 支持所有现代浏览器
- 移动端Safari和Chrome优化
- 渐进式增强设计

## 使用方法

1. 点击任意相册进入
2. 等待图片预加载完成（显示进度）
   - 可以按 ESC 键跳过预加载（用于快速访问）
3. 预加载完成后，享受无缝的图片浏览体验
4. 使用播放、切换等功能，不再有加载延迟

## 快捷键

### 预加载阶段
- **ESC**: 跳过预加载，立即进入浏览模式

### 浏览阶段
- **左箭头**: 上一张图片
- **右箭头**: 下一张图片
- **空格**: 播放/暂停自动播放
- **R**: 重置缩放和位置

## 技术特性

### 内存管理
- 组件卸载时自动清理预加载的图片
- 防止内存泄漏的安全机制
- 智能的状态更新控制

### 错误处理
- 主URL失败时自动尝试备用URL
- 优雅的错误状态显示
- 加载失败时仍能继续使用应用

### 性能优化
- 并行加载所有图片
- 精确的进度计算
- 最小化重渲染次数

这个功能彻底解决了之前播放时的闪黑问题，为用户提供了更流畅的浏览体验。同时保持了良好的用户控制性，允许在需要时跳过预加载过程。
