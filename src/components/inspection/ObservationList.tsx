// components/inspection/ObservationList.tsx

import React, { useState } from 'react';
import { ObservationCard } from './ObservationCard';
import { EditObservationModal } from './EditObservationModal';
import { DeleteConfirmation } from './DeleteConfirmation';
import { AddObservationButton } from './AddObservationButton';
import type { Observation } from '@/types';

interface ObservationListProps {
  observations: Observation[];
  onUpdate: (observation: Observation) => void;
  onDelete: (observationId: string) => void;
  onAdd?: () => void;
  onViewPhotos?: (observation: Observation) => void;
  itemName?: string;
  showAddButton?: boolean;
  emptyMessage?: string;
}

export function ObservationList({
  observations,
  onUpdate,
  onDelete,
  onAdd,
  onViewPhotos,
  itemName,
  showAddButton = true,
  emptyMessage = 'No observations recorded',
}: ObservationListProps) {
  const [editingObservation, setEditingObservation] = useState<Observation | null>(null);
  const [deletingObservationId, setDeletingObservationId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = (observation: Observation) => {
    onUpdate(observation);
    setEditingObservation(null);
  };

  const handleDelete = async () => {
    if (!deletingObservationId) return;

    setIsDeleting(true);
    try {
      await onDelete(deletingObservationId);
    } finally {
      setIsDeleting(false);
      setDeletingObservationId(null);
    }
  };

  if (observations.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <svg
            className="w-12 h-12 mx-auto text-gray-300 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-gray-500 text-sm mb-4">{emptyMessage}</p>
          {showAddButton && onAdd && (
            <AddObservationButton onClick={onAdd} variant="outline" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {observations.map((observation) => (
        <ObservationCard
          key={observation.id}
          observation={observation}
          onEdit={() => setEditingObservation(observation)}
          onDelete={() => setDeletingObservationId(observation.id)}
          onViewPhotos={onViewPhotos ? () => onViewPhotos(observation) : undefined}
        />
      ))}

      {showAddButton && onAdd && (
        <AddObservationButton onClick={onAdd} variant="outline" fullWidth />
      )}

      <EditObservationModal
        isOpen={!!editingObservation}
        observation={editingObservation}
        onSave={handleSave}
        onClose={() => setEditingObservation(null)}
        itemName={itemName}
      />

      <DeleteConfirmation
        isOpen={!!deletingObservationId}
        onConfirm={handleDelete}
        onCancel={() => setDeletingObservationId(null)}
        title="Delete Observation"
        message="Are you sure you want to delete this observation? This will also remove any associated photos."
        isLoading={isDeleting}
      />
    </div>
  );
}

export default ObservationList;
