/**
 * Offline page for TulsiHealth PWA
 * Shows offline status and available functionality
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Database, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Users,
  FileText,
  Activity
} from 'lucide-react';
import { offlineManager } from '@/lib/offline';
import DatabaseService from '@/lib/db';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updateSyncStatus = async () => {
      try {
        const status = await offlineManager.getSyncStatus();
        setSyncStatus(status);
        setLastSyncTime(status.lastSync ? new Date(status.lastSync) : null);
      } catch (error) {
        console.error('Failed to get sync status:', error);
      }
    };

    const updateStorageStats = async () => {
      try {
        const stats = await offlineManager.getStorageStats();
        setStorageStats(stats);
      } catch (error) {
        console.error('Failed to get storage stats:', error);
      }
    };

    // Initial load
    updateOnlineStatus();
    updateSyncStatus();
    updateStorageStats();

    // Event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    offlineManager.on('sync-start', () => setIsSyncing(true));
    offlineManager.on('sync-complete', () => {
      setIsSyncing(false);
      updateSyncStatus();
    });
    offlineManager.on('sync-error', () => setIsSyncing(false));

    // Periodic updates
    const interval = setInterval(() => {
      updateSyncStatus();
      updateStorageStats();
    }, 5000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    if (!isOnline) return;
    
    try {
      setIsSyncing(true);
      await offlineManager.syncAll();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCache = async () => {
    try {
      await offlineManager.clearCache();
      // Refresh stats
      const stats = await offlineManager.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('Are you sure you want to clear all offline data? This cannot be undone.')) {
      return;
    }
    
    try {
      await offlineManager.clearAllData();
      // Refresh stats
      const stats = await offlineManager.getStorageStats();
      setStorageStats(stats);
      const status = await offlineManager.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Offline Status</h1>
          <p className="text-gray-400">
            Monitor your offline functionality and sync status
          </p>
        </div>

        {/* Connection Status */}
        <div className={`p-6 rounded-lg border mb-6 ${
          isOnline 
            ? 'bg-green-900/20 border-green-500/30' 
            : 'bg-red-900/20 border-red-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isOnline ? (
                <Wifi className="w-8 h-8 text-green-500" />
              ) : (
                <WifiOff className="w-8 h-8 text-red-500" />
              )}
              <div>
                <h2 className="text-xl font-semibold">
                  {isOnline ? 'Online' : 'Offline'}
                </h2>
                <p className="text-sm text-gray-400">
                  {isOnline 
                    ? 'Connected to network. Full functionality available.'
                    : 'No network connection. Limited functionality available.'
                  }
                </p>
              </div>
            </div>
            
            {isOnline && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync Status */}
        {syncStatus && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Sync Status</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Pending Actions</span>
                  {syncStatus.pendingActions === 0 ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <p className="text-2xl font-bold">{syncStatus.pendingActions}</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Patients</span>
                  {syncStatus.unsyncedPatients === 0 ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Users className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <p className="text-2xl font-bold">{syncStatus.unsyncedPatients}</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Encounters</span>
                  {syncStatus.unsyncedEncounters === 0 ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <FileText className="w-4 h-4 text-purple-500" />
                  )}
                </div>
                <p className="text-2xl font-bold">{syncStatus.unsyncedEncounters}</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Audit Logs</span>
                  {syncStatus.unsyncedAuditLogs === 0 ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Activity className="w-4 h-4 text-orange-500" />
                  )}
                </div>
                <p className="text-2xl font-bold">{syncStatus.unsyncedAuditLogs}</p>
              </div>
            </div>
            
            {lastSyncTime && (
              <div className="text-sm text-gray-400">
                Last sync: {formatTimeAgo(lastSyncTime)}
              </div>
            )}
          </div>
        )}

        {/* Storage Stats */}
        {storageStats && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Storage Usage</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Size</p>
                <p className="text-xl font-bold">{storageStats.totalSize}</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Records</p>
                <p className="text-xl font-bold">
                  {storageStats.patients + storageStats.encounters + storageStats.auditLogs}
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Cache Entries</p>
                <p className="text-xl font-bold">{storageStats.cacheEntries}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
              <div className="text-center">
                <p className="text-gray-400">Patients</p>
                <p className="font-medium">{storageStats.patients}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">Encounters</p>
                <p className="font-medium">{storageStats.encounters}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">Audit Logs</p>
                <p className="font-medium">{storageStats.auditLogs}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">Actions</p>
                <p className="font-medium">{storageStats.offlineActions}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">Cache</p>
                <p className="font-medium">{storageStats.cacheEntries}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">Preferences</p>
                <p className="font-medium">{storageStats.userPreferences}</p>
              </div>
            </div>
          </div>
        )}

        {/* Available Features */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Available Features</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-green-400">Available Offline</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">View patient records</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Create new patients</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Record encounters</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Diagnosis search (cached)</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-400">Requires Connection</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">Real-time AI assistance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">Live terminology updates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">Face authentication</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">Data synchronization</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Management Actions */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Management</h3>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Clear Cache</span>
            </button>
            
            <button
              onClick={handleClearAllData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>Clear All Data</span>
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-400">
            <p className="mb-1">
              <strong>Clear Cache:</strong> Removes temporary cached data but preserves your records.
            </p>
            <p>
              <strong>Clear All Data:</strong> Permanently removes all offline data including patients, encounters, and settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
