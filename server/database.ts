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

// Initialize database schema and run migrations
function initializeDatabase() {
  try {
    // Create tables if they don't exist
    sqlite.exec(`
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
        uploaded_to_vicroads_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        checklist_item_settings TEXT NOT NULL DEFAULT '{}',
        checklist_item_order TEXT,
        logo_url TEXT,
        updated_at TEXT NOT NULL
      );
    `);
    
    console.log("Database schema initialized successfully");
    
    // Migration function to add missing columns to existing databases
    const inspectionsTableInfo = sqlite.prepare("PRAGMA table_info(inspections)").all() as any[];
    const inspectionsColumnNames = inspectionsTableInfo.map((col: any) => col.name);
    
    if (!inspectionsColumnNames.includes('uploaded_to_vicroads_at')) {
      sqlite.prepare("ALTER TABLE inspections ADD COLUMN uploaded_to_vicroads_at TEXT").run();
      console.log("Added uploaded_to_vicroads_at column to inspections table");
    }
    
  } catch (error) {
    console.log("Migration completed or table structure already correct");
  }
}

// Initialize database on startup
initializeDatabase();

export { sqlite };

