// components/inspection/PhotoGallery.tsx

import { useState } from 'react';
import type { Photo } from '@/types/inspection';

interface PhotoGalleryProps {
  photos: Photo[];
  onDelete?: (photoId: string) => void;
  maxDisplay?: number;
  showActions?: boolean;
}

export function PhotoGallery({
  photos,
  onDelete,
  maxDisplay = 6,
  showActions = true,
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showAll, setShowAll] = useState(false);

  const displayPhotos = showAll ? photos : photos.slice(0, maxDisplay);
  const hasMore = photos.length > maxDisplay && !showAll;

  // Get display URL from photo (storageUrl or placeholder)
  const getPhotoUrl = (photo: Photo): string => {
    return photo.storageUrl || `/api/photos/${photo.localBlobId}`;
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <svg
          className="w-12 h-12 mx-auto text-gray-300 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-gray-500 text-sm">No photos yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {displayPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer group"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={getPhotoUrl(photo)}
              alt={photo.caption || `Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
        ))}
        {hasMore && (
          <button
            onClick={() => setShowAll(true)}
            className="aspect-square rounded-lg bg-gray-100 flex flex-col items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <span className="text-2xl font-semibold">+{photos.length - maxDisplay}</span>
            <span className="text-xs">more</span>
          </button>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/80">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="p-2 text-white hover:bg-white/10 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {showActions && onDelete && (
              <button
                onClick={() => {
                  onDelete(selectedPhoto.id);
                  setSelectedPhoto(null);
                }}
                className="px-3 py-1.5 bg-red-500/80 text-white rounded-lg text-sm hover:bg-red-500"
              >
                Delete
              </button>
            )}
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={getPhotoUrl(selectedPhoto)}
              alt={selectedPhoto.caption || 'Photo'}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Caption */}
          {selectedPhoto.caption && (
            <div className="p-4 bg-black/80">
              <p className="text-white text-center">{selectedPhoto.caption}</p>
            </div>
          )}

          {/* Navigation */}
          {photos.length > 1 && (
            <>
              <button
                onClick={() => {
                  const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
                  setSelectedPhoto(photos[prevIndex]);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
                  const nextIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
                  setSelectedPhoto(photos[nextIndex]);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default PhotoGallery;
