// components/inspection/NotesList.tsx

import React from 'react';

interface Note {
  id: string;
  text: string;
  cleanedText?: string;
  timestamp: string;
  isAccepted?: boolean;
}

interface NotesListProps {
  notes: Note[];
  onEdit?: (noteId: string) => void;
  onDelete?: (noteId: string) => void;
  showCleanedVersion?: boolean;
  emptyMessage?: string;
}

export function NotesList({
  notes,
  onEdit,
  onDelete,
  showCleanedVersion = true,
  emptyMessage = 'No notes recorded',
}: NotesListProps) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
        <svg
          className="w-10 h-10 mx-auto text-gray-300 mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <div
          key={note.id}
          className="bg-white border border-gray-200 rounded-lg p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {showCleanedVersion && note.cleanedText ? (
                <>
                  <p className="text-gray-900 text-sm whitespace-pre-wrap">
                    {note.cleanedText}
                  </p>
                  {note.text !== note.cleanedText && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        View original
                      </summary>
                      <p className="mt-1 text-xs text-gray-400 whitespace-pre-wrap">
                        {note.text}
                      </p>
                    </details>
                  )}
                </>
              ) : (
                <p className="text-gray-900 text-sm whitespace-pre-wrap">
                  {note.text}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {new Date(note.timestamp).toLocaleString()}
              </p>
            </div>

            {(onEdit || onDelete) && (
              <div className="flex items-center gap-1">
                {onEdit && (
                  <button
                    onClick={() => onEdit(note.id)}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Edit note"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(note.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Delete note"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {note.isAccepted !== undefined && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium ${
                  note.isAccepted ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {note.isAccepted ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Accepted
                  </>
                ) : (
                  'Pending review'
                )}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default NotesList;
