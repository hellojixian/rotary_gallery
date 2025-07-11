#!/usr/bin/env python3
"""
Image resizing script for albums directory
Resizes images to specified max width while maintaining aspect ratio
Saves as JPG with 85% quality
"""

import os
import sys
import argparse
from PIL import Image, ImageOps
from pathlib import Path
import logging

def setup_logging():
    """Setup logging configuration"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

def is_image_file(filename):
    """Check if file is a supported image format"""
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}
    return Path(filename).suffix.lower() in image_extensions

def resize_image(input_path, output_path, max_width, quality=85):
    """
    Resize image to max width while maintaining aspect ratio

    Args:
        input_path: Path to input image
        output_path: Path to save resized image
        max_width: Maximum width in pixels
        quality: JPEG quality (1-100)
    """
    try:
        with Image.open(input_path) as img:
            # Auto-rotate based on EXIF orientation
            img = ImageOps.exif_transpose(img)

            # Get original dimensions
            original_width, original_height = img.size

            # Skip if image is already smaller than max_width
            if original_width <= max_width:
                logging.info(f"Skipping {input_path} - already smaller than {max_width}px")
                return False

            # Calculate new dimensions maintaining aspect ratio
            aspect_ratio = original_height / original_width
            new_width = max_width
            new_height = int(max_width * aspect_ratio)

            # Resize image
            resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

            # Convert to RGB if necessary (for PNG with transparency)
            if resized_img.mode in ('RGBA', 'LA', 'P'):
                # Create white background
                background = Image.new('RGB', resized_img.size, (255, 255, 255))
                if resized_img.mode == 'P':
                    resized_img = resized_img.convert('RGBA')
                background.paste(resized_img, mask=resized_img.split()[-1] if resized_img.mode == 'RGBA' else None)
                resized_img = background

            # Save as JPEG with specified quality
            resized_img.save(output_path, 'JPEG', quality=quality, optimize=True)

            logging.info(f"Resized {input_path}: {original_width}x{original_height} -> {new_width}x{new_height}")
            return True

    except Exception as e:
        logging.error(f"Error processing {input_path}: {str(e)}")
        return False

def process_directory(albums_dir, max_width, quality=85, backup=False):
    """
    Process all images in albums directory and subdirectories

    Args:
        albums_dir: Path to albums directory
        max_width: Maximum width for resized images
        quality: JPEG quality (1-100)
        backup: Whether to create backup of original files
    """
    albums_path = Path(albums_dir)

    if not albums_path.exists():
        logging.error(f"Albums directory not found: {albums_dir}")
        return

    processed_count = 0
    skipped_count = 0
    error_count = 0

    # Walk through all subdirectories
    for root, dirs, files in os.walk(albums_path):
        root_path = Path(root)

        # Skip .DS_Store and other hidden files/directories
        dirs[:] = [d for d in dirs if not d.startswith('.')]

        for filename in files:
            if filename.startswith('.') or filename == 'metadata.json':
                continue

            if is_image_file(filename):
                input_path = root_path / filename

                # Create backup if requested
                if backup:
                    backup_path = root_path / f"{input_path.stem}_original{input_path.suffix}"
                    if not backup_path.exists():
                        try:
                            import shutil
                            shutil.copy2(input_path, backup_path)
                            logging.info(f"Created backup: {backup_path}")
                        except Exception as e:
                            logging.error(f"Failed to create backup for {input_path}: {str(e)}")

                # Process the image (overwrite original)
                success = resize_image(input_path, input_path, max_width, quality)

                if success:
                    processed_count += 1
                elif success is False:
                    error_count += 1
                else:
                    skipped_count += 1

    logging.info(f"Processing complete:")
    logging.info(f"  Processed: {processed_count} images")
    logging.info(f"  Skipped: {skipped_count} images")
    logging.info(f"  Errors: {error_count} images")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description='Resize images in albums directory',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python resize_images.py 1980                    # Resize to max width 1980px
  python resize_images.py 1920 --quality 90       # Resize with 90% quality
  python resize_images.py 1600 --backup           # Create backups before resizing
  python resize_images.py 1980 --albums-dir ./photos  # Use different albums directory
        """
    )

    parser.add_argument('max_width', type=int,
                       help='Maximum width in pixels (e.g., 1980)')

    parser.add_argument('--quality', type=int, default=85,
                       help='JPEG quality 1-100 (default: 85)')

    parser.add_argument('--albums-dir', default='albums',
                       help='Path to albums directory (default: albums)')

    parser.add_argument('--backup', action='store_true',
                       help='Create backup copies of original images')

    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be processed without making changes')

    args = parser.parse_args()

    # Validate arguments
    if args.max_width <= 0:
        print("Error: max_width must be a positive integer")
        sys.exit(1)

    if not (1 <= args.quality <= 100):
        print("Error: quality must be between 1 and 100")
        sys.exit(1)

    setup_logging()

    if args.dry_run:
        logging.info("DRY RUN MODE - No files will be modified")
        albums_path = Path(args.albums_dir)
        if not albums_path.exists():
            logging.error(f"Albums directory not found: {args.albums_dir}")
            return

        count = 0
        for root, dirs, files in os.walk(albums_path):
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            for filename in files:
                if not filename.startswith('.') and filename != 'metadata.json' and is_image_file(filename):
                    count += 1
                    logging.info(f"Would process: {Path(root) / filename}")

        logging.info(f"Would process {count} image files")
        return

    logging.info(f"Starting image resize process:")
    logging.info(f"  Albums directory: {args.albums_dir}")
    logging.info(f"  Max width: {args.max_width}px")
    logging.info(f"  JPEG quality: {args.quality}%")
    logging.info(f"  Create backups: {args.backup}")

    process_directory(args.albums_dir, args.max_width, args.quality, args.backup)

if __name__ == '__main__':
    main()
