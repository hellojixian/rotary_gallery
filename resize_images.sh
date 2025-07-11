#!/bin/bash

# Image resizing script for albums directory
# Resizes images to specified max width while maintaining aspect ratio
# Saves as JPG with 85% quality

set -e  # Exit on any error

# Default values
ALBUMS_DIR="albums"
QUALITY=85
BACKUP=false
DRY_RUN=false

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 <max_width> [options]

Resize images in albums directory to specified maximum width while maintaining aspect ratio.

Arguments:
    max_width       Maximum width in pixels (e.g., 1980)

Options:
    --quality N     JPEG quality 1-100 (default: 85)
    --albums-dir DIR Path to albums directory (default: albums)
    --backup        Create backup copies of original images
    --dry-run       Show what would be processed without making changes
    --help          Show this help message

Examples:
    $0 1980
    $0 1920 --quality 90
    $0 1600 --backup
    $0 1980 --albums-dir ./photos

Requirements:
    - ImageMagick must be installed (brew install imagemagick on macOS)
EOF
}

# Function to check if ImageMagick is installed
check_imagemagick() {
    if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
        echo "Error: ImageMagick is not installed."
        echo "Please install it first:"
        echo "  macOS: brew install imagemagick"
        echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
        echo "  CentOS/RHEL: sudo yum install ImageMagick"
        exit 1
    fi
}

# Function to get image dimensions
get_image_width() {
    local file="$1"
    if command -v magick &> /dev/null; then
        magick identify -format "%w" "$file" 2>/dev/null || echo "0"
    else
        identify -format "%w" "$file" 2>/dev/null || echo "0"
    fi
}

# Function to resize a single image
resize_image() {
    local input_file="$1"
    local max_width="$2"
    local quality="$3"
    local backup="$4"

    # Get current width
    local current_width
    current_width=$(get_image_width "$input_file")

    if [[ "$current_width" -eq 0 ]]; then
        echo "Warning: Could not determine width of $input_file, skipping"
        return 1
    fi

    if [[ "$current_width" -le "$max_width" ]]; then
        echo "Skipping $input_file - already smaller than ${max_width}px (${current_width}px)"
        return 0
    fi

    # Create backup if requested
    if [[ "$backup" == "true" ]]; then
        local backup_file="${input_file%.*}_original.${input_file##*.}"
        if [[ ! -f "$backup_file" ]]; then
            cp "$input_file" "$backup_file"
            echo "Created backup: $backup_file"
        fi
    fi

    # Create temporary file for processing
    local temp_file="${input_file}.tmp"

    # Resize image
    if command -v magick &> /dev/null; then
        magick "$input_file" \
            -auto-orient \
            -resize "${max_width}x>" \
            -quality "$quality" \
            -format jpeg \
            "$temp_file"
    else
        convert "$input_file" \
            -auto-orient \
            -resize "${max_width}x>" \
            -quality "$quality" \
            -format jpeg \
            "$temp_file"
    fi

    # Replace original with resized version
    if [[ -f "$temp_file" ]]; then
        # Change extension to .jpg if it wasn't already
        local output_file="${input_file%.*}.JPG"
        mv "$temp_file" "$output_file"

        # Remove original if it had a different extension
        if [[ "$input_file" != "$output_file" ]]; then
            rm "$input_file"
        fi

        # Get new dimensions for logging
        local new_width
        new_width=$(get_image_width "$output_file")
        echo "Resized $input_file: ${current_width}px -> ${new_width}px"
        return 0
    else
        echo "Error: Failed to resize $input_file"
        return 1
    fi
}

# Function to process directory
process_directory() {
    local albums_dir="$1"
    local max_width="$2"
    local quality="$3"
    local backup="$4"
    local dry_run="$5"

    if [[ ! -d "$albums_dir" ]]; then
        echo "Error: Albums directory not found: $albums_dir"
        exit 1
    fi

    local processed=0
    local skipped=0
    local errors=0

    echo "Processing images in: $albums_dir"
    echo "Max width: ${max_width}px"
    echo "JPEG quality: ${quality}%"
    echo "Create backups: $backup"
    echo "Dry run: $dry_run"
    echo ""

    # Find all image files
    while IFS= read -r -d '' file; do
        # Skip hidden files and metadata.json
        local basename
        basename=$(basename "$file")
        if [[ "$basename" == .* ]] || [[ "$basename" == "metadata.json" ]]; then
            continue
        fi

        # Check if it's an image file
        local extension="${file##*.}"
        # Convert to lowercase for comparison
        extension=$(echo "$extension" | tr '[:upper:]' '[:lower:]')
        case "$extension" in
            jpg|jpeg|png|bmp|tiff|tif|webp)
                if [[ "$dry_run" == "true" ]]; then
                    echo "Would process: $file"
                    ((processed++))
                else
                    if resize_image "$file" "$max_width" "$quality" "$backup"; then
                        if [[ $? -eq 0 ]]; then
                            ((processed++))
                        else
                            ((skipped++))
                        fi
                    else
                        ((errors++))
                    fi
                fi
                ;;
        esac
    done < <(find "$albums_dir" -type f -print0)

    echo ""
    echo "Processing complete:"
    echo "  Processed: $processed images"
    echo "  Skipped: $skipped images"
    echo "  Errors: $errors images"
}

# Parse command line arguments
if [[ $# -eq 0 ]]; then
    show_usage
    exit 1
fi

MAX_WIDTH=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_usage
            exit 0
            ;;
        --quality)
            QUALITY="$2"
            shift 2
            ;;
        --albums-dir)
            ALBUMS_DIR="$2"
            shift 2
            ;;
        --backup)
            BACKUP=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -*)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            if [[ -z "$MAX_WIDTH" ]]; then
                MAX_WIDTH="$1"
            else
                echo "Error: Multiple width arguments provided"
                show_usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate arguments
if [[ -z "$MAX_WIDTH" ]]; then
    echo "Error: max_width is required"
    show_usage
    exit 1
fi

if ! [[ "$MAX_WIDTH" =~ ^[0-9]+$ ]] || [[ "$MAX_WIDTH" -le 0 ]]; then
    echo "Error: max_width must be a positive integer"
    exit 1
fi

if ! [[ "$QUALITY" =~ ^[0-9]+$ ]] || [[ "$QUALITY" -lt 1 ]] || [[ "$QUALITY" -gt 100 ]]; then
    echo "Error: quality must be between 1 and 100"
    exit 1
fi

# Check dependencies
check_imagemagick

# Process images
process_directory "$ALBUMS_DIR" "$MAX_WIDTH" "$QUALITY" "$BACKUP" "$DRY_RUN"
