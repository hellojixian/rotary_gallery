export interface AlbumMetadata {
  name: string;
  description: string;
  images: string[];
  shootingInfo?: {
    camera?: string;
    lens?: string;
    date?: string;
    location?: string;
    settings?: {
      iso?: number;
      aperture?: string;
      shutterSpeed?: string;
      focalLength?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface Album {
  id: string;
  path: string;
  metadata: AlbumMetadata;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
