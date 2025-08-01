import { type Inspection, type InsertInspection, type Settings, type InsertSettings, CHECKLIST_ITEMS, inspections, settings } from "@shared/schema";
import { db } from "./database";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { IStorage } from "./storage";

export class SqliteStorage implements IStorage {
  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    // Initialize settings if not exists
    const existingSettings = await db.select().from(settings).limit(1);
    if (existingSettings.length === 0) {
      const defaultChecklistSettings: Record<string, string> = {};
      CHECKLIST_ITEMS.forEach(item => {
        // Set VIN, Under Vehicle, Engine Bay as required by default, others as optional
        defaultChecklistSettings[item] = ["VIN", "Under Vehicle", "Engine Bay"].includes(item) ? "required" : "optional";
      });

      await db.insert(settings).values({
        id: randomUUID(),
        checklistItemSettings: defaultChecklistSettings,
        checklistItemOrder: [...CHECKLIST_ITEMS].sort(),
        networkFolderPath: "",
        networkUsername: "",
        networkPasswordHash: "",
        updatedAt: new Date().toISOString(),
      });
    }
  }

  async getInspection(id: string): Promise<Inspection | undefined> {
    const result = await db.select().from(inspections).where(eq(inspections.id, id)).limit(1);
    return result[0];
  }

  async getInspectionByRoadworthyNumber(roadworthyNumber: string): Promise<Inspection | undefined> {
    const result = await db.select().from(inspections).where(eq(inspections.roadworthyNumber, roadworthyNumber)).limit(1);
    return result[0];
  }

  async getAllInspections(): Promise<Inspection[]> {
    return await db.select().from(inspections).orderBy(inspections.updatedAt);
  }

  async getInProgressInspections(): Promise<Inspection[]> {
    return await db.select().from(inspections).where(eq(inspections.status, "in-progress")).orderBy(inspections.updatedAt);
  }

  async getCompletedInspections(): Promise<Inspection[]> {
    const passInspections = await db.select().from(inspections).where(eq(inspections.status, "pass"));
    const failInspections = await db.select().from(inspections).where(eq(inspections.status, "fail"));
    return [...passInspections, ...failInspections].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async createInspection(insertInspection: InsertInspection): Promise<Inspection> {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    // Initialize checklist items
    const checklistItems: Record<string, boolean> = {};
    CHECKLIST_ITEMS.forEach(item => {
      checklistItems[item] = false;
    });

    const inspection: Inspection = {
      id,
      roadworthyNumber: insertInspection.roadworthyNumber,
      clientName: insertInspection.clientName || "",
      vehicleDescription: insertInspection.vehicleDescription || "",
      status: insertInspection.status || "in-progress",
      checklistItems,
      photos: {},
      testNumber: 1,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    
    await db.insert(inspections).values(inspection);
    return inspection;
  }

  async updateInspection(id: string, updates: Partial<Inspection>): Promise<Inspection | undefined> {
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await db.update(inspections).set(updatedData).where(eq(inspections.id, id));
    return this.getInspection(id);
  }

  async deleteInspection(id: string): Promise<boolean> {
    const result = await db.delete(inspections).where(eq(inspections.id, id));
    return result.changes > 0;
  }

  async getSettings(): Promise<Settings> {
    const result = await db.select().from(settings).limit(1);
    return result[0];
  }

  async updateSettings(updates: Partial<InsertSettings>): Promise<Settings> {
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await db.update(settings).set(updatedData);
    return this.getSettings();
  }
}

export const storage = new SqliteStorage();