// pages/ReportGeneration.tsx

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/layout/Header';
import { useInspectionStore } from '@/stores/inspectionStore';
import { pdfService } from '@/services/pdfService';

type GenerationStatus = 'idle' | 'generating' | 'complete' | 'error';

export function ReportGeneration() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentInspection, loadInspection, updateInspection, isLoading } = useInspectionStore();

  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Load inspection if not already loaded
  useEffect(() => {
    if (id && !currentInspection) {
      loadInspection(id);
    }
  }, [id, currentInspection, loadInspection]);

  // Auto-start generation if status is review-complete
  useEffect(() => {
    if (currentInspection?.status === 'review-complete' && status === 'idle') {
      handleGenerate();
    }
  }, [currentInspection?.status]);

  const handleGenerate = useCallback(async () => {
    if (!currentInspection) return;

    setStatus('generating');
    setProgress(0);
    setProgressMessage('Preparing...');
    setErrorMessage(null);

    try {
      const result = await pdfService.generateReport(
        currentInspection,
        { includePhotos: true, includeSignature: true },
        (progressInfo) => {
          setProgress(progressInfo.percent);
          setProgressMessage(progressInfo.message);
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate report');
      }

      setReportUrl(result.url || null);

      await updateInspection({
        status: 'report-generated',
        reportGeneratedAt: new Date(),
        reportUrl: result.url,
      });

      setStatus('complete');
    } catch (error) {
      console.error('Failed to generate report:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }, [currentInspection, updateInspection]);

  const handleDownload = useCallback(async () => {
    const url = reportUrl || currentInspection?.reportUrl;
    if (!url || !currentInspection) {
      alert('Report URL not available. Please try generating the report again.');
      return;
    }

    setIsDownloading(true);

    try {
      // Generate filename
      const filename = pdfService.generateFilename(currentInspection);

      // Fetch the PDF and trigger download
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      // Create download link and trigger it
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsDownloading(false);
    }
  }, [reportUrl, currentInspection]);

  if (isLoading || !currentInspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">🔄</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header title="Generate Report" showBack backTo={`/inspection/${id}/review`} />

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Status Card */}
        <Card className="text-center">
          <CardContent className="py-8">
            {status === 'idle' && (
              <>
                <span className="text-6xl block mb-4">📄</span>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Ready to Generate
                </h2>
                <p className="text-gray-500 mb-6">
                  Your inspection report is ready to be generated.
                </p>
                <Button onClick={handleGenerate}>
                  Generate PDF Report
                </Button>
              </>
            )}

            {status === 'generating' && (
              <>
                <span className="text-6xl block mb-4 animate-pulse">⚙️</span>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Generating Report...
                </h2>
                <p className="text-gray-500 mb-4">
                  Please wait while we create your professional PDF report.
                </p>

                {/* Progress bar */}
                <div className="w-full max-w-xs mx-auto">
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{progressMessage || `${progress}%`}</p>
                </div>

                <div className="mt-4 text-sm text-gray-500">
                  <p>• Compiling inspection data</p>
                  <p>• Processing photos</p>
                  <p>• Generating PDF</p>
                </div>
              </>
            )}

            {status === 'complete' && (
              <>
                <span className="text-6xl block mb-4">✅</span>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Report Generated!
                </h2>
                <p className="text-gray-500 mb-6">
                  Your inspection report is ready for download.
                </p>
                <div className="flex flex-col gap-3 items-center">
                  <Button onClick={handleDownload} disabled={isDownloading}>
                    {isDownloading ? '⏳ Downloading...' : '📥 Download PDF'}
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/inspections')} disabled={isDownloading}>
                    Back to Inspections
                  </Button>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <span className="text-6xl block mb-4">❌</span>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Generation Failed
                </h2>
                <p className="text-red-500 mb-4">
                  {errorMessage || 'An error occurred while generating the report.'}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleGenerate}>
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={() => navigate(`/inspection/${id}/review/final`)}>
                    Back to Review
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Report Info (when complete) */}
        {status === 'complete' && (
          <>
            <Card>
              <CardContent>
                <h3 className="font-medium text-gray-900 mb-3">Report Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Property</span>
                    <span className="text-gray-900">{currentInspection.propertyAddress.street}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Client</span>
                    <span className="text-gray-900">{currentInspection.clientInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Generated</span>
                    <span className="text-gray-900">
                      {currentInspection.reportGeneratedAt
                        ? new Date(currentInspection.reportGeneratedAt).toLocaleString()
                        : 'Just now'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent>
                <h4 className="font-medium text-blue-900 mb-2">Next Steps</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Download and review the PDF report</li>
                  <li>• Send the report to your client via email</li>
                  <li>• Keep a copy for your records</li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}

        {/* What's included */}
        {(status === 'idle' || status === 'generating') && (
          <Card>
            <CardContent>
              <h3 className="font-medium text-gray-900 mb-3">Report Includes</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Cover page with property and client information
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Executive summary
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Building data and characteristics
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Detailed findings by category
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Photos with descriptions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Prioritized recommendations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Inspection limitations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Inspector signature and certification
                </li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom">
        <div className="max-w-2xl mx-auto">
          {status === 'complete' ? (
            <Button fullWidth onClick={() => navigate('/inspections')}>
              Back to Inspections
            </Button>
          ) : status === 'error' ? (
            <Button fullWidth variant="secondary" onClick={() => navigate(`/inspection/${id}/review`)}>
              Back to Review
            </Button>
          ) : (
            <Button
              fullWidth
              variant="secondary"
              onClick={() => navigate(`/inspection/${id}/review/final`)}
              disabled={status === 'generating'}
            >
              Back to Final Review
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportGeneration;
