// pages/InspectionChecklist.tsx

import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/layout/Header';
import { StorageWarning } from '@/components/common/StorageWarning';
import { useInspectionStore } from '@/stores/inspectionStore';
import { inspectionCategories } from '@/data/inspectionCategories';
import { cn } from '@/lib/utils';

export function InspectionChecklist() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentInspection,
    loadInspection,
    isLoading,
    photoCount
  } = useInspectionStore();

  useEffect(() => {
    if (id) {
      loadInspection(id);
    }
  }, [id, loadInspection]);

  if (isLoading || !currentInspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p className="text-gray-500">Loading inspection...</p>
        </div>
      </div>
    );
  }

  // Calculate progress for each category
  const getCategoryProgress = (categoryId: string) => {
    const category = inspectionCategories.find(c => c.id === categoryId);
    if (!category) return { completed: 0, total: 0 };

    const total = category.items.length;
    let completed = 0;

    category.items.forEach(item => {
      const observations = currentInspection.observations[item.id];
      if (observations && observations.length > 0) {
        completed++;
      }
    });

    return { completed, total };
  };

  const totalProgress = inspectionCategories.reduce(
    (acc, cat) => {
      const progress = getCategoryProgress(cat.id);
      return {
        completed: acc.completed + progress.completed,
        total: acc.total + progress.total
      };
    },
    { completed: 0, total: 0 }
  );

  const overallPercent = Math.round(
    (totalProgress.completed / totalProgress.total) * 100
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header
        title={currentInspection.propertyAddress.street || 'Inspection'}
        showBack
        backTo="/inspections"
      />

      <div className="p-4 space-y-4">
        {/* Property Summary */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">
                  {currentInspection.type === 'home' ? '🏠' : '🏢'}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">
                  {currentInspection.propertyAddress.street}
                </h2>
                <p className="text-sm text-gray-500">
                  {currentInspection.propertyAddress.city},{' '}
                  {currentInspection.propertyAddress.state}{' '}
                  {currentInspection.propertyAddress.zip}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium text-gray-900">
                  {totalProgress.completed}/{totalProgress.total} items
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo Storage Warning */}
        <StorageWarning photoCount={photoCount} />

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-2">
          <Link to={`/inspection/${id}/client`}>
            <Card padding="sm" className="text-center hover:shadow-md transition-shadow">
              <span className="text-xl">👤</span>
              <p className="text-xs text-gray-600 mt-1">Client</p>
            </Card>
          </Link>
          <Link to={`/inspection/${id}/property`}>
            <Card padding="sm" className="text-center hover:shadow-md transition-shadow">
              <span className="text-xl">📍</span>
              <p className="text-xs text-gray-600 mt-1">Property</p>
            </Card>
          </Link>
          <Link to={`/inspection/${id}/building`}>
            <Card padding="sm" className="text-center hover:shadow-md transition-shadow">
              <span className="text-xl">🏗️</span>
              <p className="text-xs text-gray-600 mt-1">Building</p>
            </Card>
          </Link>
        </div>

        {/* Inspection Categories */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 mt-4">
            Inspection Areas
          </h3>
          {inspectionCategories.map((category) => {
            const progress = getCategoryProgress(category.id);
            const isComplete = progress.completed === progress.total;
            const hasStarted = progress.completed > 0;

            return (
              <Link
                key={category.id}
                to={`/inspection/${id}/category/${category.id}`}
                className="block"
              >
                <Card
                  className={cn(
                    'hover:shadow-md transition-shadow',
                    isComplete && 'border-green-200 bg-green-50/50'
                  )}
                >
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
                          isComplete
                            ? 'bg-green-100'
                            : hasStarted
                            ? 'bg-yellow-100'
                            : 'bg-gray-100'
                        )}
                      >
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {category.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {progress.completed}/{progress.total} items
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isComplete && (
                          <span className="text-green-500">✓</span>
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
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom">
        <Button
          fullWidth
          size="lg"
          onClick={() => navigate(`/inspection/${id}/complete`)}
        >
          Review & Complete Field Inspection
        </Button>
      </div>
    </div>
  );
}

export default InspectionChecklist;
