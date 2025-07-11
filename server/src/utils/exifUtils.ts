import { exifr } from 'exifr';

export async function extractExifData(imagePath: string): Promise<any> {
  try {
    const exifData = await exifr.parse(imagePath, {
      pick: [
        'Make', 'Model', 'LensModel', 'DateTimeOriginal', 'DateTime',
        'ISO', 'FNumber', 'ExposureTime', 'FocalLength',
        'ImageWidth', 'ImageHeight', 'Orientation',
        'WhiteBalance', 'Flash', 'ExposureMode', 'MeteringMode'
      ]
    });
    
    return exifData;
  } catch (error) {
    console.error('Error extracting EXIF data:', error);
    return null;
  }
}
