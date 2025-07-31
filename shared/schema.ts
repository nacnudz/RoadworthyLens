import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const inspections = pgTable("inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roadworthyNumber: text("roadworthy_number").notNull(),
  clientName: text("client_name").default(""),
  vehicleDescription: text("vehicle_description").default(""),
  status: text("status").notNull().default("in-progress"), // "in-progress", "pass", "fail"
  checklistItems: jsonb("checklist_items").notNull().default('{}'),
  photos: jsonb("photos").notNull().default('{}'),
  testNumber: integer("test_number").notNull().default(1), // 1 for initial test, 2+ for retests
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  checklistItemSettings: jsonb("checklist_item_settings").notNull().default('{}'),
  networkFolderPath: text("network_folder_path").default(""),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
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
