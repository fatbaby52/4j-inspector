// components/report/DownloadButton.tsx

import React, { useState } from 'react';

interface DownloadButtonProps {
  reportUrl: string | null;
  fileName?: string;
  onDownload?: () => void;
  variant?: 'primary' | 'secondary';
}

export function DownloadButton({
  reportUrl,
  fileName = 'inspection-report.pdf',
  onDownload,
  variant = 'primary',
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!reportUrl) return;

    setIsDownloading(true);
    try {
      // For cloud URLs, fetch and download
      const response = await fetch(reportUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
      onDownload?.();
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(reportUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const baseClasses = 'flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50';
  const variantClasses = variant === 'primary'
    ? 'bg-green-600 text-white hover:bg-green-700'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300';

  return (
    <button
      onClick={handleDownload}
      disabled={!reportUrl || isDownloading}
      className={`${baseClasses} ${variantClasses}`}
    >
      {isDownloading ? (
        <>
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Downloading...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </>
      )}
    </button>
  );
}

export default DownloadButton;
