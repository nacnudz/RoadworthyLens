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
    checklist_item_order TEXT,
    network_folder_path TEXT DEFAULT '',
    network_username TEXT,
    network_password_hash TEXT,
    logo_url TEXT,
    updated_at TEXT NOT NULL
  );
`;

sqlite.exec(createTablesSQL);

// Migration function to add missing columns to existing databases
function runMigrations() {
  try {
    // Check settings table
    const settingsTableInfo = sqlite.prepare("PRAGMA table_info(settings)").all() as any[];
    const settingsColumnNames = settingsTableInfo.map((col: any) => col.name);
    
    // Add missing settings columns
    if (!settingsColumnNames.includes('logo_url')) {
      sqlite.prepare("ALTER TABLE settings ADD COLUMN logo_url TEXT").run();
      console.log("Added logo_url column to settings table");
    }
    
    if (!settingsColumnNames.includes('checklist_item_order')) {
      sqlite.prepare("ALTER TABLE settings ADD COLUMN checklist_item_order TEXT").run();
      console.log("Added checklist_item_order column to settings table");
    }
    
    if (!settingsColumnNames.includes('network_username')) {
      sqlite.prepare("ALTER TABLE settings ADD COLUMN network_username TEXT").run();
      console.log("Added network_username column to settings table");
    }
    
    if (!settingsColumnNames.includes('network_password_hash')) {
      sqlite.prepare("ALTER TABLE settings ADD COLUMN network_password_hash TEXT").run();
      console.log("Added network_password_hash column to settings table");
    }
    
    // Check inspections table for upload tracking columns
    const inspectionsTableInfo = sqlite.prepare("PRAGMA table_info(inspections)").all() as any[];
    const inspectionsColumnNames = inspectionsTableInfo.map((col: any) => col.name);
    
    if (!inspectionsColumnNames.includes('uploaded_at')) {
      sqlite.prepare("ALTER TABLE inspections ADD COLUMN uploaded_at TEXT").run();
      console.log("Added uploaded_at column to inspections table");
    }
    
    if (!inspectionsColumnNames.includes('upload_status')) {
      sqlite.prepare("ALTER TABLE inspections ADD COLUMN upload_status TEXT").run();
      console.log("Added upload_status column to inspections table");
    }
    
  } catch (error) {
    console.log("Migration completed or table structure already correct");
  }
}

// Run migrations on startup
runMigrations();

export { sqlite };