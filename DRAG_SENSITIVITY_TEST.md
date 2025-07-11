# 🧪 拖拽灵敏度测试

## 测试场景

### 基本参数
- **屏幕宽度**: 1000px
- **图片数量**: 36张
- **每张图片对应像素**: 1000 ÷ 36 ≈ 27.78px

### 预期行为
- 拖拽距离 < 13.89px (半张图片宽度): 不切换图片
- 拖拽距离 ≥ 13.89px: 切换1张图片
- 拖拽距离 ≥ 41.67px: 切换2张图片
- 以此类推...

## 测试用例

### 测试1: 小幅拖拽
```
初始图片: 第10张
拖拽距离: 10px (向右)
预期结果: 仍显示第10张图片
```

### 测试2: 刚好超过阈值
```
初始图片: 第10张
拖拽距离: 15px (向右)
预期结果: 显示第9张图片
```

### 测试3: 大幅拖拽
```
初始图片: 第10张
拖拽距离: 100px (向右)
预期结果: 显示第6张图片 (切换4张)
```

### 测试4: 向左拖拽
```
初始图片: 第10张
拖拽距离: 50px (向左)
预期结果: 显示第12张图片 (切换2张)
```

### 测试5: 循环边界
```
初始图片: 第1张
拖拽距离: 30px (向右)
预期结果: 显示第36张图片 (循环到末尾)
```

## 计算公式

### 核心算法
```typescript
const pixelsPerImage = containerWidth / totalImages;
const imagesDragged = deltaX / pixelsPerImage;
const imagesToSwitch = Math.round(imagesDragged);
const targetIndex = dragStartImageIndex - imagesToSwitch;
```

### 示例计算 (1000px, 36张图片)
```
pixelsPerImage = 1000 / 36 = 27.78px

拖拽10px:
imagesDragged = 10 / 27.78 = 0.36
imagesToSwitch = Math.round(0.36) = 0
结果: 不切换

拖拽15px:
imagesDragged = 15 / 27.78 = 0.54
imagesToSwitch = Math.round(0.54) = 1
结果: 切换1张

拖拽30px:
imagesDragged = 30 / 27.78 = 1.08
imagesToSwitch = Math.round(1.08) = 1
结果: 切换1张

拖拽40px:
imagesDragged = 40 / 27.78 = 1.44
imagesToSwitch = Math.round(1.44) = 1
结果: 切换1张

拖拽50px:
imagesDragged = 50 / 27.78 = 1.80
imagesToSwitch = Math.round(1.80) = 2
结果: 切换2张
```

## 优化效果

### 之前的问题
- 拖拽1px就可能切换图片
- 用户难以精确控制
- 拖拽体验不稳定

### 现在的改进
- 需要拖拽约14px才切换1张图片
- 用户可以精确控制切换数量
- 拖拽体验更加稳定和可预测

## 不同屏幕尺寸的表现

### 1920px屏幕, 36张图片
- 每张图片: 53.33px
- 切换阈值: 26.67px

### 1366px屏幕, 36张图片
- 每张图片: 37.94px
- 切换阈值: 18.97px

### 768px屏幕 (平板), 36张图片
- 每张图片: 21.33px
- 切换阈值: 10.67px

## 验证方法

### 手动测试
1. 打开开发者工具，查看容器宽度
2. 计算每张图片对应的像素数
3. 进行不同距离的拖拽测试
4. 验证切换行为是否符合预期

### 自动化测试
```typescript
describe('Drag sensitivity', () => {
  test('should not switch image for small drag', () => {
    // 模拟小幅拖拽
    // 验证图片索引不变
  });
  
  test('should switch one image for medium drag', () => {
    // 模拟中等拖拽
    // 验证图片索引变化1
  });
});
```

---

🎯 **现在的拖拽体验更加精确和可控！**
