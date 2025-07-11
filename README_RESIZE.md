# 图片缩放脚本 / Image Resize Scripts

这个项目包含两个脚本来批量缩放 `albums/` 目录下的图片：

- `resize_images.py` - Python版本（推荐）
- `resize_images.sh` - Shell脚本版本

## 功能特性

- 批量处理 `albums/` 目录及其子目录中的所有图片
- 保持长宽比缩放到指定最大宽度
- 输出为 JPG 格式，默认85%品质
- 支持多种输入格式：JPG, PNG, BMP, TIFF, WebP
- 自动处理 EXIF 旋转信息
- 可选择创建原文件备份
- 支持预览模式（dry-run）

## 使用方法

### Python 版本（推荐）

#### 安装依赖
```bash
pip install Pillow
```

#### 基本用法
```bash
# 缩放到最大宽度1980像素
python resize_images.py 1980

# 指定品质为90%
python resize_images.py 1920 --quality 90

# 创建备份文件
python resize_images.py 1600 --backup

# 预览模式（不实际修改文件）
python resize_images.py 1980 --dry-run

# 指定不同的相册目录
python resize_images.py 1980 --albums-dir ./photos
```

#### 完整参数说明
```
python resize_images.py <max_width> [选项]

参数:
  max_width           最大宽度（像素），例如 1980

选项:
  --quality N         JPEG品质 1-100 (默认: 85)
  --albums-dir DIR    相册目录路径 (默认: albums)
  --backup            创建原文件备份
  --dry-run           预览模式，显示将要处理的文件但不实际修改
  --help              显示帮助信息
```

### Shell 脚本版本

#### 安装依赖
```bash
# macOS
brew install imagemagick

# Ubuntu/Debian
sudo apt-get install imagemagick

# CentOS/RHEL
sudo yum install ImageMagick
```

#### 基本用法
```bash
# 缩放到最大宽度1980像素
./resize_images.sh 1980

# 指定品质为90%
./resize_images.sh 1920 --quality 90

# 创建备份文件
./resize_images.sh 1600 --backup

# 预览模式
./resize_images.sh 1980 --dry-run
```

## 目录结构

脚本会处理以下结构的图片：

```
albums/
├── Camera 1/
│   ├── IMG_8085.JPG
│   ├── IMG_8086.JPG
│   └── ...
├── Camera 2/
│   ├── IMG_8049.JPG
│   └── ...
├── 小熊/
├── 小鹿/
├── 招财猫/
└── ...
```

## 注意事项

1. **备份重要文件**：脚本会直接覆盖原文件，建议使用 `--backup` 选项或手动备份重要图片
2. **磁盘空间**：确保有足够的磁盘空间存储处理后的图片
3. **处理时间**：大量图片的处理可能需要较长时间
4. **文件格式**：所有图片都会转换为 JPG 格式
5. **跳过小图片**：宽度已经小于或等于指定最大宽度的图片会被跳过

## 示例输出

```
2025-01-07 17:58:00 - INFO - Starting image resize process:
2025-01-07 17:58:00 - INFO -   Albums directory: albums
2025-01-07 17:58:00 - INFO -   Max width: 1980px
2025-01-07 17:58:00 - INFO -   JPEG quality: 85%
2025-01-07 17:58:00 - INFO -   Create backups: False
2025-01-07 17:58:01 - INFO - Resized albums/Camera 1/IMG_8085.JPG: 4032x3024 -> 1980x1485
2025-01-07 17:58:02 - INFO - Resized albums/Camera 1/IMG_8086.JPG: 4032x3024 -> 1980x1485
2025-01-07 17:58:03 - INFO - Skipping albums/small_image.JPG - already smaller than 1980px
...
2025-01-07 17:58:30 - INFO - Processing complete:
2025-01-07 17:58:30 - INFO -   Processed: 245 images
2025-01-07 17:58:30 - INFO -   Skipped: 12 images
2025-01-07 17:58:30 - INFO -   Errors: 0 images
```

## 故障排除

### Python 版本
- 如果遇到 `ModuleNotFoundError: No module named 'PIL'`，请安装 Pillow：`pip install Pillow`
- 如果遇到权限错误，确保脚本有执行权限：`chmod +x resize_images.py`

### Shell 脚本版本
- 如果遇到 `ImageMagick is not installed` 错误，请按照上述说明安装 ImageMagick
- 如果遇到权限错误，确保脚本有执行权限：`chmod +x resize_images.sh`

## 性能对比

- **Python 版本**：使用 Pillow 库，处理速度适中，内存使用较少，推荐日常使用
- **Shell 脚本版本**：使用 ImageMagick，功能强大，适合需要更多图像处理选项的场景
