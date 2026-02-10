// pages/Home.tsx

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Card, CardContent } from '@/components/common/Card';
import { Header } from '@/components/layout/Header';
import { useInspectionStore } from '@/stores/inspectionStore';
import { useSyncStore } from '@/stores/syncStore';
import { formatDate } from '@/lib/utils';

export function Home() {
  const { inspections, loadInspections, isLoading } = useInspectionStore();
  const { queueStats, refreshStats } = useSyncStore();

  useEffect(() => {
    loadInspections();
    refreshStats();
  }, [loadInspections, refreshStats]);

  // Get recent and active inspections
  const activeInspections = inspections.filter(
    (i) => i.status === 'field-draft' || i.status === 'field-complete'
  );
  const recentInspections = inspections.slice(0, 5);

  const pendingSync = queueStats.queued + queueStats.failed;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="4J Inspector" />

      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Start New Inspection
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/new-inspection?type=home" className="block">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="text-4xl mb-2">🏠</span>
                  <span className="font-medium text-gray-900">Home Inspection</span>
                  <span className="text-sm text-gray-500 mt-1">Residential</span>
                </CardContent>
              </Card>
            </Link>
            <Link to="/new-inspection?type=facility" className="block">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="text-4xl mb-2">🏢</span>
                  <span className="font-medium text-gray-900">Facility Inspection</span>
                  <span className="text-sm text-gray-500 mt-1">Commercial/Gov</span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Active Inspections */}
        {activeInspections.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">
                In Progress
              </h2>
              <span className="text-sm text-gray-500">
                {activeInspections.length} active
              </span>
            </div>
            <div className="space-y-2">
              {activeInspections.map((inspection) => (
                <Link
                  key={inspection.id}
                  to={inspection.status === 'field-draft' ? `/inspection/${inspection.id}` : `/inspection/${inspection.id}/review`}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xl">
                          {inspection.type === 'home' ? '🏠' : '🏢'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {inspection.propertyAddress.street || 'New Inspection'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {inspection.clientInfo.name || 'No client'}
                          {' • '}
                          {formatDate(inspection.inspectionDate)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {inspection.status === 'field-draft' ? 'In Field' : 'Field Done'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Sync Status */}
        {pendingSync > 0 && (
          <section>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="flex items-center gap-3">
                <span className="text-2xl">🔄</span>
                <div>
                  <p className="font-medium text-yellow-800">
                    {pendingSync} item{pendingSync !== 1 ? 's' : ''} pending sync
                  </p>
                  <p className="text-sm text-yellow-600">
                    Will sync automatically when online
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Recent Inspections */}
        {recentInspections.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Inspections
              </h2>
              <Link
                to="/inspections"
                className="text-sm text-primary font-medium"
              >
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {recentInspections.map((inspection) => (
                <Link
                  key={inspection.id}
                  to={inspection.status === 'field-draft' ? `/inspection/${inspection.id}` : `/inspection/${inspection.id}/review`}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <span>
                          {inspection.type === 'home' ? '🏠' : '🏢'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {inspection.propertyAddress.street || 'New Inspection'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(inspection.inspectionDate)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!isLoading && inspections.length === 0 && (
          <section className="text-center py-12">
            <span className="text-6xl mb-4 block">📋</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Inspections Yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start your first property inspection
            </p>
            <Link to="/new-inspection?type=home">
              <Button>Start Home Inspection</Button>
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}

export default Home;
