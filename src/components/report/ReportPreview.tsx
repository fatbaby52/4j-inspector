// components/report/ReportPreview.tsx

import React from 'react';
import type { Inspection } from '@/types';

interface ReportPreviewProps {
  inspection: Inspection;
  isLoading?: boolean;
}

export function ReportPreview({ inspection, isLoading }: ReportPreviewProps) {
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
          <div className="space-y-2 mt-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { clientInfo, propertyAddress, executiveSummary, recommendations } = inspection;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Report Header */}
      <div className="bg-gray-800 text-white p-6">
        <h1 className="text-2xl font-bold mb-2">Property Inspection Report</h1>
        <p className="text-gray-300">
          {propertyAddress?.street && `${propertyAddress.street}, `}
          {propertyAddress?.city && `${propertyAddress.city}, `}
          {propertyAddress?.state} {propertyAddress?.zip}
        </p>
      </div>

      {/* Report Body */}
      <div className="p-6 space-y-6">
        {/* Client Info */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
            Client Information
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>
              <span className="ml-2 text-gray-900">{clientInfo?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="ml-2 text-gray-900">{clientInfo?.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>
              <span className="ml-2 text-gray-900">{clientInfo?.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Inspection Date:</span>
              <span className="ml-2 text-gray-900">
                {inspection.createdAt
                  ? new Date(inspection.createdAt).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </section>

        {/* Executive Summary */}
        {executiveSummary && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
              Executive Summary
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{executiveSummary.text}</p>
          </section>
        )}

        {/* Key Findings */}
        {recommendations && recommendations.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
              Key Recommendations
            </h2>
            <div className="space-y-3">
              {recommendations.slice(0, 5).map((rec, index) => (
                <div
                  key={rec.id || index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span
                    className={`
                      px-2 py-0.5 text-xs font-medium rounded
                      ${rec.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : rec.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                      }
                    `}
                  >
                    {rec.priority?.toUpperCase()}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{rec.title}</p>
                    {rec.description && (
                      <p className="text-xs text-gray-500 mt-1">{rec.description}</p>
                    )}
                  </div>
                </div>
              ))}
              {recommendations.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  + {recommendations.length - 5} more recommendations
                </p>
              )}
            </div>
          </section>
        )}

        {/* Preview Notice */}
        <div className="text-center pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            This is a preview. The full report will include all observations, photos, and detailed findings.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReportPreview;
