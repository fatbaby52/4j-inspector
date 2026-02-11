// pages/PropertyInfo.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { Header } from '@/components/layout/Header';
import { useInspectionStore } from '@/stores/inspectionStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useCamera } from '@/hooks/useCamera';
import { photoStore } from '@/db/photoStore';
import { savePhoto } from '@/db/database';
import { addToQueue } from '@/db/syncQueue';
import type { CompressedPhoto } from '@/hooks/usePhotoCompression';
import type { Photo } from '@/types/inspection';

interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export function PropertyInfo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentInspection, loadInspection, updateInspection, isLoading, isSaving } =
    useInspectionStore();

  const [address, setAddress] = useState<PropertyAddress>({
    street: '',
    city: '',
    state: '',
    zip: '',
  });

  const [facadePhotoUrl, setFacadePhotoUrl] = useState<string | null>(null);

  // Handle photo capture
  const handlePhotoCapture = useCallback(
    async (photo: CompressedPhoto) => {
      if (!currentInspection) return;

      // Generate IDs
      const photoId = crypto.randomUUID();
      const localBlobId = crypto.randomUUID();

      // Store blob locally
      await photoStore.saveBlob(localBlobId, photo.fullSize);

      // Create photo record for local DB
      const photoRecord: Photo = {
        id: photoId,
        inspectionId: currentInspection.id,
        observationId: 'facade', // Special marker for facade photos
        localBlobId,
        timestamp: new Date(),
        originalSize: photo.originalSize || photo.fullSize.size,
        compressedSize: photo.fullSize.size,
        syncStatus: 'queued',
      };

      // Save photo record to local DB
      await savePhoto(photoRecord);

      // Add to sync queue for upload
      await addToQueue({
        inspectionId: currentInspection.id,
        action: 'upload-photo',
        payload: {
          photoId,
          inspectionId: currentInspection.id,
          localBlobId,
        },
      });

      // Update inspection with facade photo reference
      await updateInspection({ facadePhotoId: photoId });

      // Store the local blob ID for retrieval (for display)
      localStorage.setItem(`facade-photo-${currentInspection.id}`, localBlobId);

      // Create URL for display
      const url = URL.createObjectURL(photo.fullSize);
      setFacadePhotoUrl(url);
    },
    [currentInspection, updateInspection]
  );

  const { inputRef, openCamera, openGallery, isProcessing, error: photoError } =
    useCamera(handlePhotoCapture);

  // Load inspection if not already loaded
  useEffect(() => {
    if (id && !currentInspection) {
      loadInspection(id);
    }
  }, [id, currentInspection, loadInspection]);

  // Initialize form and load existing photo when inspection loads
  useEffect(() => {
    if (currentInspection) {
      setAddress(currentInspection.propertyAddress);

      // Load existing facade photo if available
      const localBlobId = localStorage.getItem(`facade-photo-${currentInspection.id}`);
      if (localBlobId) {
        photoStore.getBlob(localBlobId).then((blob) => {
          if (blob) {
            setFacadePhotoUrl(URL.createObjectURL(blob));
          }
        });
      }
    }
  }, [currentInspection]);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (facadePhotoUrl) {
        URL.revokeObjectURL(facadePhotoUrl);
      }
    };
  }, [facadePhotoUrl]);

  // Auto-save when address changes
  useAutoSave({
    data: address,
    onSave: async (data) => {
      if (currentInspection) {
        await updateInspection({ propertyAddress: data as PropertyAddress });
      }
    },
    enabled: !!currentInspection,
    debounceMs: 1000,
  });

  const handleChange = (field: keyof PropertyAddress) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAddress((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleNext = async () => {
    if (currentInspection) {
      await updateInspection({ propertyAddress: address });
    }
    navigate(`/inspection/${id}/building`);
  };

  if (isLoading || !currentInspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">🔄</div>
      </div>
    );
  }

  const isComplete = address.street && address.city;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header title="Property Information" showBack backTo={`/inspection/${id}/client`} />

      {/* Hidden file input for camera/gallery */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
      />

      <div className="p-4 space-y-4">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-green-600">✓ Client</span>
          <span>→</span>
          <span className="font-medium text-primary">2. Property</span>
          <span>→</span>
          <span>3. Building</span>
          <span>→</span>
          <span>4. Inspection</span>
        </div>

        {/* Facade Photo */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Front Facade Photo
            </h2>

            {facadePhotoUrl ? (
              <div className="space-y-3">
                <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={facadePhotoUrl}
                    alt="Property facade"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={openCamera} className="flex-1">
                    📷 Retake
                  </Button>
                  <Button variant="outline" size="sm" onClick={openGallery} className="flex-1">
                    🖼️ Choose Different
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center text-gray-500">
                    <span className="text-4xl block mb-2">🏠</span>
                    <p>Capture front facade photo</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={openCamera}
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : '📷 Take Photo'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={openGallery}
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    🖼️ From Gallery
                  </Button>
                </div>
              </div>
            )}

            {photoError && (
              <p className="text-red-500 text-sm mt-2">{photoError}</p>
            )}
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Property Address
            </h2>

            <div className="space-y-4">
              <TextField
                label="Street Address"
                value={address.street}
                onChange={handleChange('street')}
                placeholder="123 Main St"
                required
              />

              <TextField
                label="City"
                value={address.city}
                onChange={handleChange('city')}
                placeholder="City"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="State"
                  value={address.state}
                  onChange={handleChange('state')}
                  placeholder="State"
                />

                <TextField
                  label="ZIP Code"
                  value={address.zip}
                  onChange={handleChange('zip')}
                  placeholder="12345"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auto-save indicator */}
        {isSaving && (
          <div className="text-center text-sm text-gray-500">
            <span className="animate-pulse">Saving...</span>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/inspection/${id}/client`)}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1"
            disabled={!isComplete}
          >
            Next: Building Data
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PropertyInfo;
