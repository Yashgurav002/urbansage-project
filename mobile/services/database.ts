import * as SQLite from 'expo-sqlite';

interface LocalIssue {
  id?: number;
  title: string;
  description: string;
  location: string;
  photo_url?: string | undefined;  // ✅ Fixed: Allow undefined instead of null
  created_at: string;
  synced: boolean;  // ✅ Fixed: Keep as boolean for TypeScript
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  // Initialize database
  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync('urbansage.db');
      await this.createTables();
      console.log('✅ Local database initialized');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
    }
  }

  // Create tables
  private async createTables() {
    if (!this.db) return;

    const createIssuesTable = `
      CREATE TABLE IF NOT EXISTS issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        photo_url TEXT,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );
    `;

    await this.db.execAsync(createIssuesTable);
  }

  // Save issue locally - FIXED VERSION
  async saveIssueLocally(issue: Omit<LocalIssue, 'id'>) {
    if (!this.db) await this.init();
    if (!this.db) return null;

    try {
      const result = await this.db.runAsync(
        'INSERT INTO issues (title, description, location, photo_url, created_at, synced) VALUES (?, ?, ?, ?, ?, ?)',
        [
          issue.title, 
          issue.description, 
          issue.location, 
          issue.photo_url || null,  // ✅ Convert undefined to null for SQLite
          issue.created_at, 
          issue.synced ? 1 : 0      // ✅ Convert boolean to number for SQLite
        ]
      );

      console.log('✅ Issue saved locally:', result.lastInsertRowId);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('❌ Error saving issue locally:', error);
      return null;
    }
  }

  // Get all local issues - FIXED VERSION
  async getLocalIssues(): Promise<LocalIssue[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    try {
      const result = await this.db.getAllAsync('SELECT * FROM issues ORDER BY created_at DESC');
      
      return result.map((row: any) => ({
        id: Number(row.id),
        title: String(row.title),
        description: String(row.description),
        location: String(row.location),
        photo_url: row.photo_url ? String(row.photo_url) : undefined,  // ✅ Convert null to undefined
        created_at: String(row.created_at),
        synced: Boolean(Number(row.synced)),  // ✅ Convert 0/1 to boolean
      }));
    } catch (error) {
      console.error('❌ Error getting local issues:', error);
      return [];
    }
  }

  // Get unsynced issues - FIXED VERSION
  async getUnsyncedIssues(): Promise<LocalIssue[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    try {
      const result = await this.db.getAllAsync('SELECT * FROM issues WHERE synced = 0 ORDER BY created_at DESC');
      
      return result.map((row: any) => ({
        id: Number(row.id),
        title: String(row.title),
        description: String(row.description),
        location: String(row.location),
        photo_url: row.photo_url ? String(row.photo_url) : undefined,
        created_at: String(row.created_at),
        synced: Boolean(Number(row.synced)),
      }));
    } catch (error) {
      console.error('❌ Error getting unsynced issues:', error);
      return [];
    }
  }

  // Mark issue as synced
  async markAsSynced(localId: number) {
    if (!this.db) return;

    try {
      await this.db.runAsync('UPDATE issues SET synced = 1 WHERE id = ?', [localId]);
      console.log('✅ Issue marked as synced:', localId);
    } catch (error) {
      console.error('❌ Error marking issue as synced:', error);
    }
  }

  // Get issue count 
  async getIssueCount(): Promise<number> {
    if (!this.db) await this.init();
    if (!this.db) return 0;

    try {
      const result = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM issues') as any;
      return Number(result?.count || 0);
    } catch (error) {
      console.error('❌ Error getting issue count:', error);
      return 0;
    }
  }

  // Clear all data (for testing)
  async clearAllData() {
    if (!this.db) return;

    try {
      await this.db.runAsync('DELETE FROM issues');
      console.log('✅ All local data cleared');
    } catch (error) {
      console.error('❌ Error clearing data:', error);
    }
  }
}

export default new DatabaseService();
