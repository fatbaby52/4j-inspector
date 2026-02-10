// components/inspection/ObservationCard.tsx

import { type Observation, type Grade } from '@/types/inspection';

interface ObservationCardProps {
  observation: Observation;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewPhotos?: () => void;
  compact?: boolean;
}

export function ObservationCard({
  observation,
  onEdit,
  onDelete,
  onViewPhotos,
  compact = false,
}: ObservationCardProps) {
  const gradeColors: Record<Grade, string> = {
    good: 'bg-green-100 text-green-800 border-green-200',
    fair: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    poor: 'bg-orange-100 text-orange-800 border-orange-200',
    na: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const gradeLabels: Record<Grade, string> = {
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    na: 'N/A',
  };

  const photoCount = observation.photoIds?.length || 0;
  const hasNotes = observation.notes && observation.notes.length > 0;
  const latestNote = hasNotes ? observation.notes[observation.notes.length - 1] : null;

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-1 text-xs font-medium rounded border ${gradeColors[observation.grade]}`}
          >
            {gradeLabels[observation.grade]}
          </span>
          {photoCount > 0 && (
            <span className="text-xs text-gray-500">
              {photoCount} photo{photoCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {onEdit && (
          <button onClick={onEdit} className="text-primary text-sm font-medium">
            Edit
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full border ${gradeColors[observation.grade]}`}
          >
            {gradeLabels[observation.grade]}
          </span>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Edit observation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Delete observation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {latestNote && (
          <div className="mb-3">
            <p className="text-gray-700 text-sm whitespace-pre-wrap">
              {latestNote.cleanedText || latestNote.rawText}
            </p>
          </div>
        )}

        {photoCount > 0 && (
          <button
            onClick={onViewPhotos}
            className="flex items-center gap-2 text-sm text-primary font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            View {photoCount} photo{photoCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>
    </div>
  );
}

export default ObservationCard;
