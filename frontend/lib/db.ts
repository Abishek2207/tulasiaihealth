/**
 * IndexedDB Database for TulsiHealth PWA
 * Offline data storage using Dexie.js
 */

import Dexie, { Table } from 'dexie';

// Database interfaces
export interface Patient {
  id?: number;
  uuid: string;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  abhaId?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  allergies?: string[];
  conditions?: string[];
  lastVisit?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  lastSyncAt?: string;
}

export interface Encounter {
  id?: number;
  uuid: string;
  patientUuid: string;
  type: string;
  status: string;
  startTime: string;
  endTime?: string;
  diagnoses: Diagnosis[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  lastSyncAt?: string;
}

export interface Diagnosis {
  id?: number;
  uuid: string;
  code: string;
  system: 'NAMASTE' | 'ICD-11';
  name: string;
  description?: string;
  icdCode?: string;
  confidence?: number;
  category?: string;
}

export interface AuditLog {
  id?: number;
  uuid: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  synced: boolean;
  lastSyncAt?: string;
}

export interface OfflineAction {
  id?: number;
  uuid: string;
  type: 'create' | 'update' | 'delete';
  resource: 'patient' | 'encounter' | 'audit';
  data: any;
  timestamp: string;
  retryCount: number;
  lastRetryAt?: string;
  error?: string;
}

export interface CacheEntry {
  id?: number;
  key: string;
  data: any;
  timestamp: string;
  expiresAt?: string;
}

export interface UserPreferences {
  id?: number;
  key: string;
  value: any;
  updatedAt: string;
}

// Database class
class TulsiHealthDB extends Dexie {
  // Tables
  patients!: Table<Patient>;
  encounters!: Table<Encounter>;
  auditLogs!: Table<AuditLog>;
  offlineActions!: Table<OfflineAction>;
  cache!: Table<CacheEntry>;
  userPreferences!: Table<UserPreferences>;

  constructor() {
    super('TulsiHealthDB');

    // Define schema
    this.version(1).stores({
      patients: '++id, uuid, name, email, phone, createdAt, updatedAt, synced, lastSyncAt',
      encounters: '++id, uuid, patientUuid, type, status, startTime, createdAt, updatedAt, synced, lastSyncAt',
      auditLogs: '++id, uuid, userId, action, resource, timestamp, synced, lastSyncAt',
      offlineActions: '++id, uuid, type, resource, timestamp, retryCount, lastRetryAt',
      cache: '++id, key, timestamp, expiresAt',
      userPreferences: '++id, key, updatedAt'
    });

    // Hooks for data validation and timestamps
    this.patients.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date().toISOString();
      obj.updatedAt = new Date().toISOString();
      obj.synced = false;
    });

    this.patients.hook('updating', (modifications: any, primKey, obj, trans) => {
      modifications.updatedAt = new Date().toISOString();
      modifications.synced = false;
    });

    this.encounters.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date().toISOString();
      obj.updatedAt = new Date().toISOString();
      obj.synced = false;
    });

    this.encounters.hook('updating', (modifications: any, primKey, obj, trans) => {
      modifications.updatedAt = new Date().toISOString();
      modifications.synced = false;
    });

    this.auditLogs.hook('creating', (primKey, obj, trans) => {
      obj.timestamp = new Date().toISOString();
      obj.synced = false;
    });

    this.offlineActions.hook('creating', (primKey, obj, trans) => {
      obj.timestamp = new Date().toISOString();
      obj.retryCount = 0;
    });

    this.cache.hook('creating', (primKey, obj, trans) => {
      obj.timestamp = new Date().toISOString();
    });

    this.userPreferences.hook('updating', (modifications: any, primKey, obj, trans) => {
      modifications.updatedAt = new Date().toISOString();
    });
  }
}

// Database instance
export const db = new TulsiHealthDB();

// Database service class
export class DatabaseService {
  // Patient operations
  static async savePatient(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'synced'>): Promise<string> {
    const uuid = crypto.randomUUID();
    await db.patients.add({
      ...patient,
      uuid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    });

    // Add to offline actions queue
    await this.addOfflineAction({
      uuid: crypto.randomUUID(),
      type: 'create',
      resource: 'patient',
      data: { ...patient, uuid },
      timestamp: new Date().toISOString(),
      retryCount: 0
    });

    return uuid;
  }

  static async updatePatient(uuid: string, updates: Partial<Patient>): Promise<void> {
    await db.patients.update(uuid, updates);

    // Add to offline actions queue
    await this.addOfflineAction({
      uuid: crypto.randomUUID(),
      type: 'update',
      resource: 'patient',
      data: { uuid, updates },
      timestamp: new Date().toISOString(),
      retryCount: 0
    });
  }

  static async getPatient(uuid: string): Promise<Patient | undefined> {
    return await db.patients.get(uuid);
  }

  static async getAllPatients(): Promise<Patient[]> {
    return await db.patients.orderBy('name').toArray();
  }

  static async searchPatients(query: string): Promise<Patient[]> {
    const lowerQuery = query.toLowerCase();
    return await db.patients
      .filter(patient => 
        patient.name.toLowerCase().includes(lowerQuery) ||
        (patient.email && patient.email.toLowerCase().includes(lowerQuery)) ||
        (patient.phone && patient.phone.includes(query))
      )
      .toArray();
  }

  static async deletePatient(uuid: string): Promise<void> {
    await db.patients.delete(uuid);

    // Add to offline actions queue
    await this.addOfflineAction({
      uuid: crypto.randomUUID(),
      type: 'delete',
      resource: 'patient',
      data: { uuid },
      timestamp: new Date().toISOString(),
      retryCount: 0
    });
  }

  // Encounter operations
  static async saveEncounter(encounter: Omit<Encounter, 'id' | 'createdAt' | 'updatedAt' | 'synced'>): Promise<string> {
    const uuid = crypto.randomUUID();
    await db.encounters.add({
      ...encounter,
      uuid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    });

    // Add to offline actions queue
    await this.addOfflineAction({
      uuid: crypto.randomUUID(),
      type: 'create',
      resource: 'encounter',
      data: { ...encounter, uuid },
      timestamp: new Date().toISOString(),
      retryCount: 0
    });

    return uuid;
  }

  static async getEncounter(uuid: string): Promise<Encounter | undefined> {
    return await db.encounters.get(uuid);
  }

  static async getPatientEncounters(patientUuid: string): Promise<Encounter[]> {
    return await db.encounters
      .where('patientUuid')
      .equals(patientUuid)
      .reverse()
      .toArray();
  }

  // Audit log operations
  static async logAudit(auditLog: Omit<AuditLog, 'id' | 'timestamp' | 'synced'>): Promise<void> {
    await db.auditLogs.add({
      ...auditLog,
      timestamp: new Date().toISOString(),
      synced: false
    });

    // Add to offline actions queue
    await this.addOfflineAction({
      uuid: crypto.randomUUID(),
      type: 'create',
      resource: 'audit',
      data: auditLog,
      timestamp: new Date().toISOString(),
      retryCount: 0
    });
  }

  static async getAuditLogs(userId?: string, limit = 100): Promise<AuditLog[]> {
    let collection = db.auditLogs.orderBy('timestamp').reverse();
    
    if (userId) {
      collection = collection.filter(log => log.userId === userId);
    }
    
    return await collection.limit(limit).toArray();
  }

  // Offline actions queue
  static async addOfflineAction(action: Omit<OfflineAction, 'id'>): Promise<void> {
    await db.offlineActions.add(action);
  }

  static async getPendingActions(): Promise<OfflineAction[]> {
    return await db.offlineActions
      .where('retryCount')
      .below(3) // Max 3 retries
      .toArray();
  }

  static async markActionSynced(uuid: string): Promise<void> {
    await db.offlineActions.delete(uuid);
  }

  static async incrementActionRetry(uuid: string, error?: string): Promise<void> {
    await db.offlineActions.update(uuid, {
      retryCount: (Dexie as any).min('retryCount').add(1),
      lastRetryAt: new Date().toISOString(),
      error
    });
  }

  // Cache operations
  static async setCache(key: string, data: any, ttl?: number): Promise<void> {
    const expiresAt = ttl ? new Date(Date.now() + ttl * 1000).toISOString() : undefined;
    
    await db.cache.put({
      key,
      data,
      timestamp: new Date().toISOString(),
      expiresAt
    });
  }

  static async getCache(key: string): Promise<any | undefined> {
    const entry = await db.cache.get(key);
    
    if (!entry) return undefined;
    
    // Check if expired
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
      await db.cache.delete(key);
      return undefined;
    }
    
    return entry.data;
  }

  static async clearExpiredCache(): Promise<void> {
    const now = new Date().toISOString();
    await db.cache
      .where('expiresAt')
      .below(now)
      .delete();
  }

  static async clearCache(): Promise<void> {
    await db.cache.clear();
  }

  // User preferences
  static async setPreference(key: string, value: any): Promise<void> {
    await db.userPreferences.put({
      key,
      value,
      updatedAt: new Date().toISOString()
    });
  }

  static async getPreference(key: string): Promise<any | undefined> {
    const pref = await db.userPreferences.get(key);
    return pref?.value;
  }

  static async removePreference(key: string): Promise<void> {
    await db.userPreferences.delete(key);
  }

  // Sync operations
  static async getUnsyncedData(): Promise<{
    patients: Patient[];
    encounters: Encounter[];
    auditLogs: AuditLog[];
  }> {
    const [patients, encounters, auditLogs] = await Promise.all([
      db.patients.where('synced').equals(false as any).toArray(),
      db.encounters.where('synced').equals(false as any).toArray(),
      db.auditLogs.where('synced').equals(false as any).toArray()
    ]);

    return { patients, encounters, auditLogs };
  }

  static async markAsSynced(resource: 'patient' | 'encounter' | 'audit', uuid: string): Promise<void> {
    const table = resource === 'patient' ? db.patients : 
                   resource === 'encounter' ? db.encounters : 
                   db.auditLogs;
    
    await table.update(uuid, {
      synced: true,
      lastSyncAt: new Date().toISOString()
    });
  }

  // Database maintenance
  static async getDatabaseStats(): Promise<{
    patients: number;
    encounters: number;
    auditLogs: number;
    offlineActions: number;
    cacheEntries: number;
    totalSize: string;
  }> {
    const [patients, encounters, auditLogs, offlineActions, cacheEntries] = await Promise.all([
      db.patients.count(),
      db.encounters.count(),
      db.auditLogs.count(),
      db.offlineActions.count(),
      db.cache.count()
    ]);

    // Estimate size (rough calculation)
    const totalSize = this.formatBytes(
      (patients + encounters + auditLogs + offlineActions + cacheEntries) * 1024
    );

    return {
      patients,
      encounters,
      auditLogs,
      offlineActions,
      cacheEntries,
      totalSize
    };
  }

  static async clearAllData(): Promise<void> {
    await Promise.all([
      db.patients.clear(),
      db.encounters.clear(),
      db.auditLogs.clear(),
      db.offlineActions.clear(),
      db.cache.clear(),
      db.userPreferences.clear()
    ]);
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export for use in components
export default DatabaseService;
