// pages/Settings.tsx

// pages/Settings.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/layout/Header';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSync } from '@/hooks/useSync';
import { isSupabaseConfigured } from '@/services/supabaseClient';
import { retryFailed, resetAllItems } from '@/db/syncQueue';

export function Settings() {
  const { defaultInspectionType, updateSettings } = useSettingsStore();
  const { queueStats, isSyncing, sync, hasPendingChanges, isOnline } = useSync();

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Settings" />

      <div className="p-4 space-y-4">
        {/* App Status */}
        <Card>
          <CardHeader>
            <CardTitle>App Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-2">
              <p className="text-gray-600">
                {isConfigured
                  ? '✅ Cloud sync enabled'
                  : '📴 Running in offline mode'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Connection Status */}
              <div className="flex items-center gap-2 mb-2">
                <span className={isOnline ? 'text-green-500' : 'text-yellow-500'}>
                  {isOnline ? '🟢' : '🟡'}
                </span>
                <span className="text-sm text-gray-600">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pending</span>
                <span className="font-medium">{queueStats.queued}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">In Progress</span>
                <span className="font-medium">{queueStats.inProgress}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Failed</span>
                <span className="font-medium text-red-600">
                  {queueStats.failed}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Completed</span>
                <span className="font-medium text-green-600">
                  {queueStats.completed}
                </span>
              </div>

              {/* Sync Now Button */}
              {hasPendingChanges && (
                <div className="space-y-2">
                  <Button
                    onClick={async () => {
                      console.log('Resetting all items and syncing...');
                      await resetAllItems();
                      sync();
                    }}
                    disabled={isSyncing || !isOnline}
                    fullWidth
                  >
                    {isSyncing ? (
                      <>
                        <span className="animate-spin mr-2">🔄</span>
                        Syncing...
                      </>
                    ) : (
                      `Sync Now (${queueStats.queued + queueStats.failed} items)`
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Default Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Default Inspection Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      updateSettings({ defaultInspectionType: 'home' })
                    }
                    className={`p-3 rounded-lg border-2 transition-all ${
                      defaultInspectionType === 'home'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200'
                    }`}
                  >
                    <span className="text-xl">🏠</span>
                    <p className="text-sm mt-1">Home</p>
                  </button>
                  <button
                    onClick={() =>
                      updateSettings({ defaultInspectionType: 'facility' })
                    }
                    className={`p-3 rounded-lg border-2 transition-all ${
                      defaultInspectionType === 'facility'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200'
                    }`}
                  >
                    <span className="text-xl">🏢</span>
                    <p className="text-sm mt-1">Facility</p>
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Version</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Cloud Sync</span>
                <span>{isConfigured ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-400 text-center">
              4J Construction Property Inspection App
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Settings;
