/**
 * Offline functionality for TulsiHealth PWA
 * Background sync, caching, and offline detection
 */

import DatabaseService from './db';

export interface SyncStatus {
  online: boolean;
  lastSync?: Date;
  pendingActions: number;
  unsyncedPatients: number;
  unsyncedEncounters: number;
  unsyncedAuditLogs: number;
}

export interface OfflineConfig {
  autoSync: boolean;
  syncInterval: number; // minutes
  maxRetries: number;
  cacheTimeout: number; // hours
}

class OfflineManager {
  private config: OfflineConfig;
  private syncTimer?: NodeJS.Timeout;
  private eventListeners: Map<string, Function[]> = new Map();
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor(config: Partial<OfflineConfig> = {}) {
    this.config = {
      autoSync: true,
      syncInterval: 5, // 5 minutes
      maxRetries: 3,
      cacheTimeout: 24, // 24 hours
      ...config
    };
    if (typeof window !== 'undefined') {
      this.initializeEventListeners();
      this.startAutoSync();
      this.cleanupExpiredCache();
    }
  }

  // Event management
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Initialize event listeners
  private initializeEventListeners() {
    // Network status changes
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online');
      if (this.config.autoSync) {
        this.syncAll();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline');
    });

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline && this.config.autoSync) {
        this.syncAll();
      }
    });

    // Service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_CLEARED') {
          this.emit('cache-cleared');
        }
      });
    }
  }

  // Auto-sync functionality
  private startAutoSync() {
    if (this.config.autoSync) {
      this.syncTimer = setInterval(() => {
        if (this.isOnline) {
          this.syncAll();
        }
      }, this.config.syncInterval * 60 * 1000);
    }
  }

  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }

  // Sync operations
  async syncAll(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    try {
      this.emit('sync-start');
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Sync pending actions
      await this.syncPendingActions(token);
      
      // Sync unsynced data
      await this.syncUnsyncedData(token);
      
      // Clean up expired cache
      await this.cleanupExpiredCache();
      
      this.emit('sync-complete');
    } catch (error) {
      console.error('Sync failed:', error);
      this.emit('sync-error', error);
      throw error;
    }
  }

  private async syncPendingActions(token: string): Promise<void> {
    const actions = await DatabaseService.getPendingActions();
    
    for (const action of actions) {
      try {
        await this.executeAction(action, token);
        await DatabaseService.markActionSynced(action.uuid!);
        this.emit('action-synced', action);
      } catch (error) {
        console.error(`Failed to sync action ${action.uuid}:`, error);
        await DatabaseService.incrementActionRetry(action.uuid!, error.message);
        this.emit('action-failed', { action, error });
      }
    }
  }

  private async executeAction(action: any, token: string): Promise<void> {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    switch (action.resource) {
      case 'patient':
        await this.syncPatientAction(action, headers);
        break;
      case 'encounter':
        await this.syncEncounterAction(action, headers);
        break;
      case 'audit':
        await this.syncAuditAction(action, headers);
        break;
      default:
        throw new Error(`Unknown resource type: ${action.resource}`);
    }
  }

  private async syncPatientAction(action: any, headers: HeadersInit): Promise<void> {
    switch (action.type) {
      case 'create':
        await fetch('/api/patients', {
          method: 'POST',
          headers,
          body: JSON.stringify(action.data)
        });
        break;
      case 'update':
        await fetch(`/api/patients/${action.data.uuid}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(action.data.updates)
        });
        break;
      case 'delete':
        await fetch(`/api/patients/${action.data.uuid}`, {
          method: 'DELETE',
          headers
        });
        break;
    }
  }

  private async syncEncounterAction(action: any, headers: HeadersInit): Promise<void> {
    switch (action.type) {
      case 'create':
        await fetch('/api/encounters', {
          method: 'POST',
          headers,
          body: JSON.stringify(action.data)
        });
        break;
      case 'update':
        await fetch(`/api/encounters/${action.data.uuid}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(action.data.updates)
        });
        break;
    }
  }

  private async syncAuditAction(action: any, headers: HeadersInit): Promise<void> {
    await fetch('/api/audit/logs', {
      method: 'POST',
      headers,
      body: JSON.stringify(action.data)
    });
  }

  private async syncUnsyncedData(token: string): Promise<void> {
    const unsyncedData = await DatabaseService.getUnsyncedData();
    
    // Sync patients
    for (const patient of unsyncedData.patients) {
      try {
        const response = await fetch('/api/patients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(patient)
        });
        
        if (response.ok) {
          await DatabaseService.markAsSynced('patient', patient.uuid!);
        }
      } catch (error) {
        console.error(`Failed to sync patient ${patient.uuid}:`, error);
      }
    }
    
    // Sync encounters
    for (const encounter of unsyncedData.encounters) {
      try {
        const response = await fetch('/api/encounters', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(encounter)
        });
        
        if (response.ok) {
          await DatabaseService.markAsSynced('encounter', encounter.uuid!);
        }
      } catch (error) {
        console.error(`Failed to sync encounter ${encounter.uuid}:`, error);
      }
    }
    
    // Sync audit logs
    for (const auditLog of unsyncedData.auditLogs) {
      try {
        const response = await fetch('/api/audit/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(auditLog)
        });
        
        if (response.ok) {
          await DatabaseService.markAsSynced('audit', auditLog.uuid!);
        }
      } catch (error) {
        console.error(`Failed to sync audit log ${auditLog.uuid}:`, error);
      }
    }
  }

  // Cache management
  async cacheData(key: string, data: any, ttl?: number): Promise<void> {
    const timeout = ttl || this.config.cacheTimeout * 60 * 60 * 1000; // Convert to milliseconds
    await DatabaseService.setCache(key, data, timeout);
  }

  async getCachedData(key: string): Promise<any | undefined> {
    return await DatabaseService.getCache(key);
  }

  async clearCache(): Promise<void> {
    await DatabaseService.clearCache();
    
    // Notify service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({ type: 'FORCE_REFRESH' });
    }
  }

  private async cleanupExpiredCache(): Promise<void> {
    await DatabaseService.clearExpiredCache();
  }

  // Status and statistics
  async getSyncStatus(): Promise<SyncStatus> {
    const [pendingActions, unsyncedData] = await Promise.all([
      DatabaseService.getPendingActions(),
      DatabaseService.getUnsyncedData()
    ]);

    return {
      online: this.isOnline,
      lastSync: await this.getLastSyncTime(),
      pendingActions: pendingActions.length,
      unsyncedPatients: unsyncedData.patients.length,
      unsyncedEncounters: unsyncedData.encounters.length,
      unsyncedAuditLogs: unsyncedData.auditLogs.length
    };
  }

  private async getLastSyncTime(): Promise<Date | undefined> {
    const lastSync = await DatabaseService.getPreference('lastSyncTime');
    return lastSync ? new Date(lastSync) : undefined;
  }

  private async setLastSyncTime(): Promise<void> {
    await DatabaseService.setPreference('lastSyncTime', new Date().toISOString());
  }

  // Background sync registration
  async registerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      
      try {
        await registration.sync.register('background-sync-patients');
        await registration.sync.register('background-sync-audit');
        console.log('Background sync registered successfully');
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }

  // Push notification subscription
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      });

      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(subscription)
      });

      return subscription;
    } catch (error) {
      console.error('Push notification subscription failed:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  // Storage management
  async getStorageStats(): Promise<any> {
    return await DatabaseService.getDatabaseStats();
  }

  async clearAllData(): Promise<void> {
    await DatabaseService.clearAllData();
    this.emit('data-cleared');
  }

  // Network utilities
  isNetworkAvailable(): boolean {
    return this.isOnline;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Configuration
  updateConfig(newConfig: Partial<OfflineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart auto-sync with new interval
    this.stopAutoSync();
    this.startAutoSync();
  }

  getConfig(): OfflineConfig {
    return { ...this.config };
  }

  // Cleanup
  destroy(): void {
    this.stopAutoSync();
    this.eventListeners.clear();
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager();

// Export for use in components
export default OfflineManager;
