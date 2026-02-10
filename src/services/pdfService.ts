// services/pdfService.ts

import { supabase } from './supabaseClient';
import type { Inspection } from '@/types/inspection';

interface GeneratePDFOptions {
  includePhotos?: boolean;
  includeSignature?: boolean;
  format?: 'standard' | 'detailed';
}

interface PDFGenerationResult {
  success: boolean;
  url?: string;
  storageKey?: string;
  error?: string;
}

interface PDFProgress {
  stage: 'preparing' | 'generating' | 'uploading' | 'complete';
  percent: number;
  message: string;
}

export const pdfService = {
  /**
   * Generate a PDF report for an inspection
   * Calls the Supabase Edge Function which handles actual PDF generation
   */
  async generateReport(
    inspection: Inspection,
    options: GeneratePDFOptions = {},
    onProgress?: (progress: PDFProgress) => void
  ): Promise<PDFGenerationResult> {
    try {
      // Stage 1: Preparing
      onProgress?.({
        stage: 'preparing',
        percent: 10,
        message: 'Preparing inspection data...',
      });

      // Minimal validation - allow any status for flexibility
      if (!inspection.id) {
        throw new Error('Inspection ID is required');
      }

      // Stage 2: Generating
      onProgress?.({
        stage: 'generating',
        percent: 30,
        message: 'Generating PDF report...',
      });

      // Call the Edge Function
      const { data, error } = await supabase!.functions.invoke('generate-pdf', {
        body: {
          inspectionId: inspection.id,
          options: {
            includePhotos: options.includePhotos ?? true,
            includeSignature: options.includeSignature ?? true,
            format: options.format ?? 'standard',
          },
        },
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message || 'Failed to generate PDF');
      }

      // Check for error in response body
      if (data?.error) {
        console.error('PDF generation error:', data.error);
        throw new Error(data.error);
      }

      // Stage 3: Processing response
      onProgress?.({
        stage: 'uploading',
        percent: 80,
        message: 'Finalizing report...',
      });

      if (!data.success || !data.url) {
        throw new Error(data.error || 'PDF generation failed');
      }

      // Stage 4: Complete
      onProgress?.({
        stage: 'complete',
        percent: 100,
        message: 'Report ready!',
      });

      return {
        success: true,
        url: data.url,
        storageKey: data.storageKey,
      };
    } catch (error) {
      console.error('PDF generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  /**
   * Get a previously generated report URL
   */
  async getReportUrl(storageKey: string): Promise<string | null> {
    try {
      const { data } = await supabase.storage
        .from('inspection-reports')
        .getPublicUrl(storageKey);

      return data?.publicUrl || null;
    } catch (error) {
      console.error('Failed to get report URL:', error);
      return null;
    }
  },

  /**
   * Download a report
   */
  async downloadReport(
    url: string,
    filename: string = 'inspection-report.pdf'
  ): Promise<boolean> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      return true;
    } catch (error) {
      console.error('Download failed:', error);
      return false;
    }
  },

  /**
   * Delete a generated report
   */
  async deleteReport(storageKey: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('inspection-reports')
        .remove([storageKey]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete report:', error);
      return false;
    }
  },

  /**
   * Check if a report exists
   */
  async reportExists(storageKey: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from('inspection-reports')
        .list('', {
          search: storageKey,
        });

      if (error) {
        throw error;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Failed to check report:', error);
      return false;
    }
  },

  /**
   * Generate filename for a report
   */
  generateFilename(inspection: Inspection): string {
    const date = new Date(inspection.inspectionDate || inspection.createdAt);
    const dateStr = date.toISOString().split('T')[0];
    const address = inspection.propertyAddress?.street?.replace(/[^a-zA-Z0-9]/g, '-') || 'unknown';
    const type = inspection.type === 'home' ? 'Home' : 'Facility';

    return `${type}-Inspection-${address}-${dateStr}.pdf`;
  },
};

export default pdfService;
