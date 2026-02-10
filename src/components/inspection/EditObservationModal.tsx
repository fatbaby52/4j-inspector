// components/inspection/EditObservationModal.tsx

import { useState, useEffect } from 'react';
import { NoteInput } from './NoteInput';
import type { Observation, Grade } from '@/types/inspection';

interface EditObservationModalProps {
  isOpen: boolean;
  observation: Observation | null;
  onSave: (observation: Observation) => void;
  onClose: () => void;
  itemName?: string;
}

const GRADES: { value: Grade; label: string; color: string }[] = [
  { value: 'good', label: 'Good', color: 'bg-green-500' },
  { value: 'fair', label: 'Fair', color: 'bg-yellow-500' },
  { value: 'poor', label: 'Poor', color: 'bg-orange-500' },
  { value: 'na', label: 'N/A', color: 'bg-gray-400' },
];

export function EditObservationModal({
  isOpen,
  observation,
  onSave,
  onClose,
  itemName,
}: EditObservationModalProps) {
  const [grade, setGrade] = useState<Grade>('good');
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (observation) {
      setGrade(observation.grade);
      // Get the latest note's raw text for editing
      const latestNote = observation.notes[observation.notes.length - 1];
      setNoteText(latestNote?.rawText || '');
    } else {
      setGrade('good');
      setNoteText('');
    }
  }, [observation, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!observation) return;

    // Create updated observation with new grade and note
    const updatedNotes = [...observation.notes];
    if (noteText.trim()) {
      if (updatedNotes.length > 0) {
        // Update last note
        updatedNotes[updatedNotes.length - 1] = {
          ...updatedNotes[updatedNotes.length - 1],
          rawText: noteText,
        };
      } else {
        // Add new note
        updatedNotes.push({
          id: crypto.randomUUID(),
          rawText: noteText,
          inputMethod: 'typed',
          reviewStatus: 'pending',
          timestamp: new Date(),
        });
      }
    }

    onSave({
      ...observation,
      grade,
      notes: updatedNotes,
      updatedAt: new Date(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {itemName || 'Edit Observation'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Grade</label>
            <div className="grid grid-cols-4 gap-2">
              {GRADES.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setGrade(value)}
                  className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all
                    ${grade === value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <div className={`w-4 h-4 rounded-full ${color} mb-2`} />
                  <span className={`text-xs font-medium ${grade === value ? 'text-primary' : 'text-gray-600'}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <NoteInput
            value={noteText}
            onChange={setNoteText}
            label="Notes"
            placeholder="Describe the condition..."
            rows={6}
          />

          {observation && observation.photoIds.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{observation.photoIds.length} photo{observation.photoIds.length !== 1 ? 's' : ''} attached</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditObservationModal;
