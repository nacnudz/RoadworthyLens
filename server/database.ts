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

// Migration function to add missing columns to existing databases
function runMigrations() {
  try {
    // Check inspections table for upload tracking column
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

// Run migrations on startup
runMigrations();

export { sqlite };

