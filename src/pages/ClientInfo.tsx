// pages/ClientInfo.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { Header } from '@/components/layout/Header';
import { useInspectionStore } from '@/stores/inspectionStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import type { ClientInfo as ClientInfoType } from '@/types/inspection';

export function ClientInfo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentInspection, loadInspection, updateInspection, isLoading, isSaving } =
    useInspectionStore();

  const [clientInfo, setClientInfo] = useState<ClientInfoType>({
    name: '',
    company: '',
    email: '',
    phone: '',
  });

  // Load inspection if not already loaded
  useEffect(() => {
    if (id && !currentInspection) {
      loadInspection(id);
    }
  }, [id, currentInspection, loadInspection]);

  // Initialize form when inspection loads
  useEffect(() => {
    if (currentInspection) {
      setClientInfo(currentInspection.clientInfo);
    }
  }, [currentInspection]);

  // Auto-save when client info changes
  useAutoSave({
    data: clientInfo,
    onSave: async (data) => {
      if (currentInspection) {
        await updateInspection({ clientInfo: data as ClientInfoType });
      }
    },
    enabled: !!currentInspection,
    debounceMs: 1000,
  });

  const handleChange = (field: keyof ClientInfoType) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setClientInfo((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleNext = async () => {
    // Save before navigating
    if (currentInspection) {
      await updateInspection({ clientInfo });
    }
    navigate(`/inspection/${id}/property`);
  };

  if (isLoading || !currentInspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">🔄</div>
      </div>
    );
  }

  const isComplete = clientInfo.name && clientInfo.email && clientInfo.phone;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header title="Client Information" showBack backTo={`/inspection/${id}`} />

      <div className="p-4 space-y-4">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="font-medium text-primary">1. Client</span>
          <span>→</span>
          <span>2. Property</span>
          <span>→</span>
          <span>3. Building</span>
          <span>→</span>
          <span>4. Inspection</span>
        </div>

        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Client Details
            </h2>

            <div className="space-y-4">
              <TextField
                label="Client Name"
                value={clientInfo.name}
                onChange={handleChange('name')}
                placeholder="Enter client name"
                required
              />

              <TextField
                label="Company (Optional)"
                value={clientInfo.company || ''}
                onChange={handleChange('company')}
                placeholder="Enter company name"
              />

              <TextField
                label="Email"
                type="email"
                value={clientInfo.email}
                onChange={handleChange('email')}
                placeholder="client@example.com"
                required
              />

              <TextField
                label="Phone"
                type="tel"
                value={clientInfo.phone}
                onChange={handleChange('phone')}
                placeholder="(555) 555-5555"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Auto-save indicator */}
        {isSaving && (
          <div className="text-center text-sm text-gray-500">
            <span className="animate-pulse">Saving...</span>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/inspection/${id}`)}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1"
            disabled={!isComplete}
          >
            Next: Property Info
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ClientInfo;
