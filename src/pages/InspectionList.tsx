// pages/InspectionList.tsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/layout/Header';
import { useInspectionStore } from '@/stores/inspectionStore';
import { formatDate } from '@/lib/utils';
import { archiveAndDeleteInspection } from '@/services/archiveService';
import type { Inspection, InspectionStatus } from '@/types/inspection';

const statusLabels: Record<InspectionStatus, { label: string; color: string }> = {
  'field-draft': { label: 'In Field', color: 'bg-yellow-100 text-yellow-800' },
  'field-complete': { label: 'Field Complete', color: 'bg-blue-100 text-blue-800' },
  'review-in-progress': { label: 'In Review', color: 'bg-purple-100 text-purple-800' },
  'review-complete': { label: 'Review Done', color: 'bg-green-100 text-green-800' },
  'report-generated': { label: 'Completed', color: 'bg-gray-100 text-gray-800' }
};

type FilterStatus = 'all' | 'active' | 'completed';

export function InspectionList() {
  const { inspections, loadInspections, isLoading } = useInspectionStore();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [archivingId, setArchivingId] = useState<string | null>(null);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  const handleArchive = async (e: React.MouseEvent, inspection: Inspection) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmMsg = `Archive and remove "${inspection.propertyAddress.street || 'this inspection'}" from the server?\n\nThis will:\n• Download a ZIP with PDF, data, and photos\n• Delete from server (local copy remains)`;

    if (!confirm(confirmMsg)) return;

    setArchivingId(inspection.id);
    try {
      const result = await archiveAndDeleteInspection(inspection);
      if (result.success) {
        alert(`Archived successfully!\nDownloaded: ${result.filename}`);
        // Reload to update the list
        loadInspections();
      } else {
        alert(`Archive failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Archive failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setArchivingId(null);
    }
  };

  const filteredInspections = inspections.filter((inspection) => {
    if (filter === 'all') return true;
    if (filter === 'active') {
      return ['field-draft', 'field-complete', 'review-in-progress'].includes(
        inspection.status
      );
    }
    if (filter === 'completed') {
      return ['review-complete', 'report-generated'].includes(inspection.status);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Inspections" />

      <div className="p-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {(['all', 'active', 'completed'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'all' && ` (${inspections.length})`}
            </button>
          ))}
        </div>

        {/* Inspection List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin text-4xl">🔄</div>
          </div>
        ) : filteredInspections.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">📋</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Inspections
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all'
                ? 'Start your first inspection'
                : `No ${filter} inspections`}
            </p>
            {filter === 'all' && (
              <Link to="/new-inspection?type=home">
                <Button>Start Inspection</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInspections.map((inspection) => {
              const status = statusLabels[inspection.status];
              // Route to review page if field work is done
              const linkPath = inspection.status === 'field-draft'
                ? `/inspection/${inspection.id}`
                : `/inspection/${inspection.id}/review`;
              return (
                <Link
                  key={inspection.id}
                  to={linkPath}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-2xl">
                            {inspection.type === 'home' ? '🏠' : '🏢'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 truncate">
                              {inspection.propertyAddress.street || 'New Inspection'}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                            >
                              {status.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {inspection.propertyAddress.city &&
                              `${inspection.propertyAddress.city}, ${inspection.propertyAddress.state}`}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                            <span>{inspection.clientInfo.name || 'No client'}</span>
                            <span>•</span>
                            <span>{formatDate(inspection.inspectionDate)}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                          {/* Archive button - show for completed inspections */}
                          {inspection.status === 'report-generated' && (
                            <button
                              onClick={(e) => handleArchive(e, inspection)}
                              disabled={archivingId === inspection.id}
                              className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-50"
                              title="Archive and remove from server"
                            >
                              {archivingId === inspection.id ? (
                                <span className="animate-spin text-lg">⏳</span>
                              ) : (
                                <svg
                                  className="w-5 h-5 text-gray-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  />
                                </svg>
                              )}
                            </button>
                          )}
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Link
        to="/new-inspection"
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-dark active:scale-95 transition-all"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </Link>
    </div>
  );
}

export default InspectionList;
