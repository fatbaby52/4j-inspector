// pages/PhotoCapture.tsx

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/layout/Header';
import { StorageWarning } from '@/components/common/StorageWarning';
import { useInspectionStore } from '@/stores/inspectionStore';
import { useCamera } from '@/hooks/useCamera';
import { getCategoryById } from '@/data/inspectionCategories';
import { getStorageUsage } from '@/services/photoService';
import { photoStore } from '@/db/photoStore';
import { getPhotosByObservation } from '@/db/database';
import type { CompressedPhoto } from '@/hooks/usePhotoCompression';
import type { Photo } from '@/types/inspection';

interface PhotoWithUrl extends Photo {
  url: string;
}

export function PhotoCapture() {
  const { id, categoryId, itemId } = useParams<{
    id: string;
    categoryId: string;
    itemId: string;
  }>();
  const navigate = useNavigate();
  const {
    currentInspection,
    loadInspection,
    addPhoto,
    deletePhotoFromObservation,
    isLoading,
  } = useInspectionStore();

  const [photos, setPhotos] = useState<PhotoWithUrl[]>([]);
  const [storageUsage, setStorageUsage] = useState({
    photoCount: 0,
    isAtLimit: false,
    isNearLimit: false,
    canAddPhotos: true,
    warningMessage: null as string | null,
  });
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  const category = categoryId ? getCategoryById(categoryId) : undefined;
  const item = category?.items.find((i) => i.id === itemId);

  // Get the observation for this item
  const observation = currentInspection?.observations[itemId || '']?.[0];

  // Handle photo capture
  const handlePhotoCapture = useCallback(
    async (photo: CompressedPhoto) => {
      if (!observation || !currentInspection) return;

      await addPhoto(
        observation.id,
        photo.fullSize,
        photo.thumbnail,
        photo.originalSize,
        photo.compressedSize
      );

      // Refresh photos and storage
      loadPhotos();
      refreshStorage();
    },
    [observation, currentInspection, addPhoto]
  );

  const { inputRef, openCamera, openGallery, isProcessing, error: photoError } =
    useCamera(handlePhotoCapture);

  // Load inspection if not already loaded
  useEffect(() => {
    if (id && !currentInspection) {
      loadInspection(id);
    }
  }, [id, currentInspection, loadInspection]);

  // Load photos for this observation
  const loadPhotos = useCallback(async () => {
    if (!observation) return;

    setLoadingPhotos(true);
    try {
      const dbPhotos = await getPhotosByObservation(observation.id);
      const photosWithUrls: PhotoWithUrl[] = [];

      for (const photo of dbPhotos) {
        let url = '';
        if (photo.localBlobId) {
          const blob = await photoStore.getBlob(photo.localBlobId);
          if (blob) {
            url = URL.createObjectURL(blob);
          }
        } else if (photo.storageUrl) {
          url = photo.storageUrl;
        }

        if (url) {
          photosWithUrls.push({ ...photo, url });
        }
      }

      setPhotos(photosWithUrls);
    } finally {
      setLoadingPhotos(false);
    }
  }, [observation]);

  // Refresh storage usage
  const refreshStorage = useCallback(async () => {
    if (!currentInspection) return;
    const usage = await getStorageUsage(currentInspection.id);
    setStorageUsage(usage);
  }, [currentInspection]);

  useEffect(() => {
    if (observation) {
      loadPhotos();
      refreshStorage();
    }
  }, [observation, loadPhotos, refreshStorage]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        if (photo.url.startsWith('blob:')) {
          URL.revokeObjectURL(photo.url);
        }
      });
    };
  }, [photos]);

  const handleDeletePhoto = async (photoId: string) => {
    if (!itemId || !observation) return;

    const confirmed = window.confirm('Delete this photo?');
    if (!confirmed) return;

    await deletePhotoFromObservation(itemId, observation.id, photoId);
    loadPhotos();
    refreshStorage();
  };

  if (isLoading || !currentInspection || !category || !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">🔄</div>
      </div>
    );
  }

  if (!observation) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Header
          title="Photos"
          showBack
          backTo={`/inspection/${id}/category/${categoryId}`}
        />
        <Card>
          <CardContent>
            <p className="text-center text-gray-500">
              Please grade this item before adding photos.
            </p>
            <Button
              onClick={() => navigate(`/inspection/${id}/category/${categoryId}`)}
              className="mt-4 w-full"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header
        title={`${item.name} Photos`}
        showBack
        backTo={`/inspection/${id}/category/${categoryId}`}
      />

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
      />

      <div className="p-4 space-y-4">
        {/* Storage Warning */}
        <StorageWarning photoCount={storageUsage.photoCount} />

        {/* Photo count */}
        <div className="text-sm text-gray-500 text-center">
          {photos.length} photo{photos.length !== 1 ? 's' : ''} for this item
          <span className="mx-2">•</span>
          {storageUsage.photoCount}/100 total
        </div>

        {/* Capture buttons */}
        <Card>
          <CardContent>
            <div className="flex gap-3">
              <Button
                onClick={openCamera}
                className="flex-1"
                disabled={isProcessing || !storageUsage.canAddPhotos}
              >
                {isProcessing ? 'Processing...' : '📷 Take Photo'}
              </Button>
              <Button
                variant="outline"
                onClick={openGallery}
                className="flex-1"
                disabled={isProcessing || !storageUsage.canAddPhotos}
              >
                🖼️ From Gallery
              </Button>
            </div>

            {photoError && (
              <p className="text-red-500 text-sm mt-2 text-center">{photoError}</p>
            )}

            {!storageUsage.canAddPhotos && (
              <p className="text-red-500 text-sm mt-2 text-center">
                Photo limit reached. Delete some photos to add more.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Photo Grid */}
        {loadingPhotos ? (
          <div className="text-center py-8">
            <div className="animate-spin text-2xl">🔄</div>
            <p className="text-gray-500 mt-2">Loading photos...</p>
          </div>
        ) : photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden"
              >
                <img
                  src={photo.url}
                  alt="Observation photo"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                >
                  ✕
                </button>

                {/* Sync status indicator */}
                <div
                  className={`
                    absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs
                    ${
                      photo.syncStatus === 'synced'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  `}
                >
                  {photo.syncStatus === 'synced' ? '☁️ Synced' : '📱 Local'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl block mb-2">📷</span>
                <p>No photos yet</p>
                <p className="text-sm">
                  Capture photos to document this observation
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom">
        <Button
          onClick={() => navigate(`/inspection/${id}/category/${categoryId}`)}
          className="w-full"
        >
          Done ({photos.length} photo{photos.length !== 1 ? 's' : ''})
        </Button>
      </div>
    </div>
  );
}

export default PhotoCapture;
