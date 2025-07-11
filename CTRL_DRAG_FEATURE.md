# ⌨️ Alt+拖拽功能

## ✨ 功能概述

新增了 Alt+拖拽 功能，允许用户在图片放大状态下也能进行图片切换。这解决了放大状态下只能移动图片位置，无法切换图片的限制。

## 🎯 使用场景

### 问题背景
- **放大状态下的限制**: 之前在图片放大时，拖拽只能移动图片位置
- **切换不便**: 需要先重置缩放，再切换图片，然后重新放大
- **工作流中断**: 频繁的缩放重置影响浏览体验

### 解决方案
- **Ctrl+拖拽**: 在任何缩放状态下都能切换图片
- **双重功能**: 保持原有的移动功能，增加切换功能
- **无缝体验**: 不需要重置缩放就能浏览其他图片

## 🎮 操作方法

### 正常状态 (scale = 1)
```
鼠标拖拽 = 图片切换
Alt+拖拽 = 图片切换 (效果相同)
```

### 放大状态 (scale > 1)
```
鼠标拖拽 = 移动图片位置
Alt+拖拽 = 图片切换 (新功能!)
```

## 🔧 技术实现

### 键盘状态检测
```typescript
const [isAltPressed, setIsAltPressed] = useState(false);

// 监听键盘事件
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Alt') {
      setIsAltPressed(true);
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
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
}, []);
```

### 拖拽逻辑判断
```typescript
const handleMouseDown = (e: React.MouseEvent) => {
  const isCtrlDrag = e.ctrlKey || isCtrlPressed;
  
  if (scale > 1 && !isCtrlDrag) {
    // 放大状态下的图片移动
    setIsDragging(true);
    setIsImageSwitchDrag(false);
  } else {
    // 图片切换拖拽
    setIsImageSwitchDrag(true);
    setIsDragging(false);
  }
};
```

### 鼠标移动处理
```typescript
const handleMouseMove = (e: React.MouseEvent) => {
  const isCtrlDrag = e.ctrlKey || isCtrlPressed;
  
  if (isDragging && scale > 1 && !isCtrlDrag) {
    // 移动图片位置
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  } else if (isImageSwitchDrag && (scale <= 1 || isCtrlDrag)) {
    // 切换图片
    updateImageFromDrag(e.clientX);
  }
};
```

## 🎨 视觉反馈

### 光标变化
- **正常状态**: 始终显示 `grab/grabbing` 光标
- **放大状态**:
  - 无Ctrl: `grab/grabbing` (移动图片)
  - 有Ctrl: `grab/grabbing` (切换图片)

### 拖拽提示
- **正常拖拽**: "拖拽浏览图片"
- **Ctrl+拖拽**: "Ctrl+拖拽浏览图片"

### 进度条
- 显示拖拽进度，与正常拖拽相同
- 绿色渐变进度条，实时反映拖拽距离

## 📱 兼容性

### 桌面端
- ✅ 完全支持 Ctrl+拖拽
- ✅ 键盘事件检测正常
- ✅ 鼠标事件处理完善

### 移动端
- ✅ 触摸拖拽保持原有功能
- ⚠️ 无Ctrl键，但不影响正常使用
- ✅ 放大状态下仍可通过触摸滑动切换

## 🎯 使用示例

### 场景1: 查看细节后切换
1. 放大图片查看细节
2. 按住 Ctrl 键
3. 横向拖拽切换到下一张图片
4. 保持放大状态继续查看

### 场景2: 快速对比
1. 放大图片到特定区域
2. 使用 Ctrl+拖拽 快速切换
3. 对比不同图片的相同区域
4. 无需重复缩放操作

### 场景3: 精确浏览
1. 放大图片到感兴趣的区域
2. 使用 Ctrl+拖拽 浏览整个序列
3. 在放大状态下完成整个浏览过程

## 🔄 与其他功能的协调

### 缩放功能
- **滚轮缩放**: 不受影响，正常工作
- **重置缩放**: R键功能保持不变
- **拖拽移动**: 在非Ctrl状态下正常工作

### 自动播放
- **播放控制**: 空格键功能不受影响
- **播放过程**: Ctrl+拖拽可以中断自动播放
- **播放恢复**: 松开拖拽后可继续播放

### 键盘快捷键
- **方向键**: 仍可正常切换图片
- **ESC键**: 跳过预加载功能不受影响
- **组合键**: Ctrl与其他键的组合不冲突

## 🎊 优势总结

### 用户体验
- **无缝切换**: 放大状态下直接切换图片
- **保持上下文**: 不需要重置缩放
- **提高效率**: 减少重复操作

### 技术优势
- **向下兼容**: 不影响现有功能
- **逻辑清晰**: Ctrl键作为功能切换开关
- **实现简洁**: 复用现有的拖拽逻辑

### 交互设计
- **直观操作**: Ctrl+拖拽是常见的交互模式
- **视觉反馈**: 清晰的提示和光标变化
- **一致性**: 与桌面应用的交互习惯一致

---

🎉 **现在你可以在任何缩放状态下自由切换图片了！**
