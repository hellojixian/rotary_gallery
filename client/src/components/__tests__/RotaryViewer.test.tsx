import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { RotaryViewer } from '../RotaryViewer';
import type { Album } from '../../types/index';

// Mock the API
jest.mock('../../services/api', () => ({
  albumsApi: {
    getImageUrl: (albumId: string, imageName: string) => 
      `http://localhost:3001/api/albums/${albumId}/images/${imageName}`,
    getStaticImageUrl: (albumId: string, imageName: string) => 
      `http://localhost:3001/static/albums/${albumId}/${imageName}`,
  }
}));

const mockAlbum: Album = {
  id: 'test-album',
  metadata: {
    name: 'Test Album',
    description: 'A test album',
    images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
    shootingInfo: {
      camera: 'Test Camera',
      date: '2024-01-01',
      location: 'Test Location'
    }
  }
};

describe('RotaryViewer', () => {
  beforeEach(() => {
    // Mock Image constructor
    global.Image = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src: string = '';
      
      constructor() {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 100);
      }
    } as any;
  });

  test('shows preload overlay initially', () => {
    render(<RotaryViewer album={mockAlbum} />);
    
    expect(screen.getByText('正在加载图片...')).toBeInTheDocument();
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });

  test('shows progress during preloading', async () => {
    render(<RotaryViewer album={mockAlbum} />);
    
    // Should show loading progress
    expect(screen.getByText('正在加载图片...')).toBeInTheDocument();
    
    // Wait for images to load
    await waitFor(() => {
      expect(screen.queryByText('正在加载图片...')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('enables controls after preloading', async () => {
    render(<RotaryViewer album={mockAlbum} />);
    
    // Controls should be disabled initially
    const playButton = screen.getByRole('button', { name: /▶️/ });
    expect(playButton).toBeDisabled();
    
    // Wait for preloading to complete
    await waitFor(() => {
      expect(playButton).not.toBeDisabled();
    }, { timeout: 2000 });
  });

  test('displays album name and image count', () => {
    render(<RotaryViewer album={mockAlbum} />);
    
    expect(screen.getByText('Test Album')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });
});
