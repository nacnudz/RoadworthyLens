import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";
import fs from "fs";

// Create database directory if it doesn't exist
const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(path.join(dbDir, "roadworthy.db"));
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// Initialize tables manually
const createTablesSQL = `
  CREATE TABLE IF NOT EXISTS inspections (
    id TEXT PRIMARY KEY,
    roadworthy_number TEXT NOT NULL,
    client_name TEXT DEFAULT '',
    vehicle_description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'in-progress',
    checklist_items TEXT NOT NULL DEFAULT '{}',
    photos TEXT NOT NULL DEFAULT '{}',
    test_number INTEGER NOT NULL DEFAULT 1,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    checklist_item_settings TEXT NOT NULL DEFAULT '{}',
    network_folder_path TEXT DEFAULT '',
    logo_url TEXT,
    updated_at TEXT NOT NULL
  );
`;

sqlite.exec(createTablesSQL);

// Migration function to add missing columns to existing databases
function runMigrations() {
  try {
    // Check if logo_url column exists, if not add it
    const tableInfo = sqlite.prepare("PRAGMA table_info(settings)").all() as any[];
    const hasLogoUrl = tableInfo.some(col => col.name === 'logo_url');
    
    if (!hasLogoUrl) {
      sqlite.prepare("ALTER TABLE settings ADD COLUMN logo_url TEXT").run();
      console.log("Added logo_url column to settings table");
    }
  } catch (error) {
    console.log("Migration completed or table structure already correct");
  }
}

// Run migrations on startup
runMigrations();

export { sqlite };