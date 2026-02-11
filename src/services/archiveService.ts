// services/archiveService.ts

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { supabase } from './supabaseClient';
import type { Inspection } from '@/types/inspection';

export interface ArchiveResult {
  success: boolean;
  error?: string;
  filename?: string;
}

/**
 * Downloads an inspection as a ZIP file containing:
 * - inspection.json (full data)
 * - report.pdf (if generated)
 * - photos/ folder with all images
 *
 * Then deletes the inspection from the server (keeps local copy).
 */
export async function archiveAndDeleteInspection(inspection: Inspection): Promise<ArchiveResult> {
  try {
    const zip = new JSZip();

    // 1. Add inspection JSON
    const inspectionJson = JSON.stringify(inspection, null, 2);
    zip.file('inspection.json', inspectionJson);

    // 2. Add PDF if it exists
    if (inspection.reportUrl) {
      try {
        const pdfResponse = await fetch(inspection.reportUrl);
        if (pdfResponse.ok) {
          const pdfBlob = await pdfResponse.blob();
          zip.file('report.pdf', pdfBlob);
        }
      } catch (error) {
        console.warn('Failed to fetch PDF:', error);
      }
    }

    // 3. Fetch and add all photos
    const photosFolder = zip.folder('photos');
    if (photosFolder) {
      // Get all photos from Supabase
      const { data: photos, error: photosError } = await supabase!
        .from('photos')
        .select('*')
        .eq('inspection_id', inspection.id);

      if (!photosError && photos && photos.length > 0) {
        let photoIndex = 1;
        for (const photo of photos) {
          if (photo.storage_key) {
            try {
              // Create signed URL to download the photo
              const { data: signedUrlData, error: signError } = await supabase!.storage
                .from('inspection-photos')
                .createSignedUrl(photo.storage_key, 60); // 60 second expiry

              if (!signError && signedUrlData?.signedUrl) {
                const photoResponse = await fetch(signedUrlData.signedUrl);
                if (photoResponse.ok) {
                  const photoBlob = await photoResponse.blob();
                  const filename = `photo_${photoIndex}_${photo.observation_id || 'facade'}.jpg`;
                  photosFolder.file(filename, photoBlob);
                  photoIndex++;
                }
              }
            } catch (error) {
              console.warn(`Failed to fetch photo ${photo.id}:`, error);
            }
          }
        }
      }

      // Also add facade photo if it exists and is different
      if (inspection.facadePhotoId) {
        const { data: facadePhoto } = await supabase!
          .from('photos')
          .select('*')
          .eq('id', inspection.facadePhotoId)
          .single();

        if (facadePhoto?.storage_key) {
          try {
            const { data: signedUrlData } = await supabase!.storage
              .from('inspection-photos')
              .createSignedUrl(facadePhoto.storage_key, 60);

            if (signedUrlData?.signedUrl) {
              const photoResponse = await fetch(signedUrlData.signedUrl);
              if (photoResponse.ok) {
                const photoBlob = await photoResponse.blob();
                photosFolder.file('facade.jpg', photoBlob);
              }
            }
          } catch (error) {
            console.warn('Failed to fetch facade photo:', error);
          }
        }
      }
    }

    // 4. Generate and download the ZIP file
    const address = inspection.propertyAddress;
    const dateStr = new Date().toISOString().split('T')[0];
    const sanitizedStreet = (address.street || 'inspection')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 30);
    const filename = `${sanitizedStreet}_${dateStr}.zip`;

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, filename);

    // 5. Delete from server (photos first, then inspection)
    // Delete photos from storage
    const { data: photosToDelete } = await supabase!
      .from('photos')
      .select('storage_key')
      .eq('inspection_id', inspection.id);

    if (photosToDelete && photosToDelete.length > 0) {
      const storageKeys = photosToDelete
        .map(p => p.storage_key)
        .filter((key): key is string => !!key);

      if (storageKeys.length > 0) {
        await supabase!.storage
          .from('inspection-photos')
          .remove(storageKeys);
      }
    }

    // Delete photo records from database
    await supabase!
      .from('photos')
      .delete()
      .eq('inspection_id', inspection.id);

    // Delete report from storage if exists
    if (inspection.reportStorageKey) {
      await supabase!.storage
        .from('inspection-reports')
        .remove([inspection.reportStorageKey]);
    }

    // Delete inspection record
    await supabase!
      .from('inspections')
      .delete()
      .eq('id', inspection.id);

    return { success: true, filename };
  } catch (error) {
    console.error('Archive failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Archive failed'
    };
  }
}
