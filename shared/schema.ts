import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Checklist items configuration
export const CHECKLIST_ITEMS = [
  "VIN",
  "Under Vehicle", 
  "Vehicle on Hoist",
  "Engine Bay",
  "Compliance Plate",
  "Front of Vehicle",
  "Rear of Vehicle", 
  "Head Light Aimer",
  "Dashboard Warning Lights",
  "Odometer Before Road Test",
  "Odometer After Road Test",
  "Brake Test Print",
  "Engine Number",
  "Modification Plate",
  "LPG Tank Plate",
  "Tint Read Out",
  "Noteworthy",
  "Fault",
  "Other"
] as const;

export type ChecklistItem = typeof CHECKLIST_ITEMS[number];

export const inspections = sqliteTable("inspections", {
  id: text("id").primaryKey(),
  roadworthyNumber: text("roadworthy_number").notNull(),
  clientName: text("client_name").default(""),
  vehicleDescription: text("vehicle_description").default(""),
  status: text("status").notNull().default("in-progress"), // "in-progress", "pass", "fail"
  checklistItems: text("checklist_items", { mode: "json" }).notNull().default("{}"),
  photos: text("photos", { mode: "json" }).notNull().default("{}"),
  testNumber: integer("test_number").notNull().default(1), // 1 for initial test, 2+ for retests
  completedAt: text("completed_at"),
  uploadedAt: text("uploaded_at"),
  uploadStatus: text("upload_status"), // "pending", "success", "failed", null
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const settings = sqliteTable("settings", {
  id: text("id").primaryKey(),
  checklistItemSettings: text("checklist_item_settings", { mode: "json" }).notNull().default("{}"),
  checklistItemOrder: text("checklist_item_order", { mode: "json" }),
  networkFolderPath: text("network_folder_path").default(""),
  networkUsername: text("network_username"),
  networkPasswordHash: text("network_password_hash"),
  logoUrl: text("logo_url"),
  updatedAt: text("updated_at").notNull(),
});

export const insertInspectionSchema = createInsertSchema(inspections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  clientName: z.string().optional().default(""),
  vehicleDescription: z.string().optional().default(""),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type InsertInspection = z.infer<typeof insertInspectionSchema>;
export type Inspection = typeof inspections.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
