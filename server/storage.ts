import { type Inspection, type InsertInspection, type Settings, type InsertSettings, CHECKLIST_ITEMS } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Inspections
  getInspection(id: string): Promise<Inspection | undefined>;
  getInspectionByRoadworthyNumber(roadworthyNumber: string): Promise<Inspection | undefined>;
  getAllInspections(): Promise<Inspection[]>;
  getInProgressInspections(): Promise<Inspection[]>;
  getCompletedInspections(): Promise<Inspection[]>;
  createInspection(inspection: InsertInspection): Promise<Inspection>;
  updateInspection(id: string, updates: Partial<Inspection>): Promise<Inspection | undefined>;
  deleteInspection(id: string): Promise<boolean>;
  
  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private inspections: Map<string, Inspection>;
  private settings: Settings;

  constructor() {
    this.inspections = new Map();
    
    // Initialize default settings
    const defaultChecklistSettings: Record<string, string> = {};
    CHECKLIST_ITEMS.forEach(item => {
      // Set VIN, Under Vehicle, Engine Bay as required by default, others as optional
      defaultChecklistSettings[item] = ["VIN", "Under Vehicle", "Engine Bay"].includes(item) ? "required" : "optional";
    });

    this.settings = {
      id: randomUUID(),
      checklistItemSettings: defaultChecklistSettings,
      networkFolderPath: "",
      updatedAt: new Date(),
    };
  }

  async getInspection(id: string): Promise<Inspection | undefined> {
    return this.inspections.get(id);
  }

  async getInspectionByRoadworthyNumber(roadworthyNumber: string): Promise<Inspection | undefined> {
    return Array.from(this.inspections.values()).find(
      (inspection) => inspection.roadworthyNumber === roadworthyNumber
    );
  }

  async getAllInspections(): Promise<Inspection[]> {
    return Array.from(this.inspections.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getInProgressInspections(): Promise<Inspection[]> {
    return Array.from(this.inspections.values())
      .filter(inspection => inspection.status === "in-progress")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getCompletedInspections(): Promise<Inspection[]> {
    return Array.from(this.inspections.values())
      .filter(inspection => inspection.status === "pass" || inspection.status === "fail")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createInspection(insertInspection: InsertInspection): Promise<Inspection> {
    const id = randomUUID();
    const now = new Date();
    
    // Initialize checklist items
    const checklistItems: Record<string, boolean> = {};
    CHECKLIST_ITEMS.forEach(item => {
      checklistItems[item] = false;
    });

    const inspection: Inspection = {
      ...insertInspection,
      id,
      checklistItems,
      photos: {},
      testNumber: 1,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    
    this.inspections.set(id, inspection);
    return inspection;
  }

  async updateInspection(id: string, updates: Partial<Inspection>): Promise<Inspection | undefined> {
    const inspection = this.inspections.get(id);
    if (!inspection) {
      return undefined;
    }

    const updatedInspection: Inspection = {
      ...inspection,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.inspections.set(id, updatedInspection);
    return updatedInspection;
  }

  async deleteInspection(id: string): Promise<boolean> {
    return this.inspections.delete(id);
  }

  async getSettings(): Promise<Settings> {
    return this.settings;
  }

  async updateSettings(updates: Partial<InsertSettings>): Promise<Settings> {
    this.settings = {
      ...this.settings,
      ...updates,
      updatedAt: new Date(),
    };
    return this.settings;
  }
}

export const storage = new MemStorage();
