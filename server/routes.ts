import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { storage } from "./sqlite-storage";
import { insertInspectionSchema, insertSettingsSchema, CHECKLIST_ITEMS } from "@shared/schema";

// Configure multer for photo uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: async (req, file, cb) => {
      try {
        const { itemName } = req.body;
        const inspectionId = req.params?.id;
        const ext = path.extname(file.originalname) || '.jpg';
        
        if (!itemName || !inspectionId) {
          return cb(new Error('Missing itemName or inspectionId'), '');
        }

        // Get current inspection to count existing photos for this item
        const inspection = await storage.getInspection(inspectionId);
        if (!inspection) {
          return cb(new Error('Inspection not found'), '');
        }

        const photos = (inspection.photos as Record<string, string[]>) || {};
        const existingPhotos = photos[itemName] || [];
        const photoNumber = existingPhotos.length + 1;

        // Create clean filename: RoadworthyNumber_ItemName + PhotoNumber + extension
        const sanitizedItemName = itemName.replace(/[^a-zA-Z0-9]/g, '');
        const sanitizedRoadworthyNumber = inspection.roadworthyNumber.replace(/[^a-zA-Z0-9]/g, '');
        const filename = `${sanitizedRoadworthyNumber}_${sanitizedItemName}${photoNumber}${ext}`;
        
        cb(null, filename);
      } catch (error) {
        cb(error as Error, '');
      }
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Serve uploaded photos statically
  app.use('/api/photos', express.static(uploadDir));
  
  // Get all inspections
  app.get("/api/inspections", async (req, res) => {
    try {
      const inspections = await storage.getAllInspections();
      res.json(inspections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inspections" });
    }
  });

  // Get in-progress inspections
  app.get("/api/inspections/in-progress", async (req, res) => {
    try {
      const inspections = await storage.getInProgressInspections();
      res.json(inspections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch in-progress inspections" });
    }
  });

  // Get completed inspections
  app.get("/api/inspections/completed", async (req, res) => {
    try {
      const inspections = await storage.getCompletedInspections();
      res.json(inspections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch completed inspections" });
    }
  });

  // Get single inspection
  app.get("/api/inspections/:id", async (req, res) => {
    try {
      const inspection = await storage.getInspection(req.params.id);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }
      res.json(inspection);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inspection" });
    }
  });

  // Create new inspection
  app.post("/api/inspections", async (req, res) => {
    try {
      const validatedData = insertInspectionSchema.parse(req.body);
      
      // Check if roadworthy number already exists
      const existing = await storage.getInspectionByRoadworthyNumber(validatedData.roadworthyNumber);
      if (existing) {
        return res.status(400).json({ message: "Roadworthy number already exists" });
      }

      const inspection = await storage.createInspection(validatedData);
      res.status(201).json(inspection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inspection" });
    }
  });

  // Update inspection
  app.patch("/api/inspections/:id", async (req, res) => {
    try {
      const updates = req.body;
      const inspection = await storage.updateInspection(req.params.id, updates);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }
      res.json(inspection);
    } catch (error) {
      res.status(500).json({ message: "Failed to update inspection" });
    }
  });

  // Upload photo for inspection item
  app.post("/api/inspections/:id/photos", upload.single("photo"), async (req, res) => {
    try {
      const { id } = req.params;
      const { itemName } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: "No photo uploaded" });
      }

      if (!CHECKLIST_ITEMS.includes(itemName as any)) {
        return res.status(400).json({ message: "Invalid checklist item" });
      }

      const inspection = await storage.getInspection(id);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }

      // Update photos record with full URLs
      const photos = inspection.photos as Record<string, string[]> || {};
      if (!photos[itemName]) {
        photos[itemName] = [];
      }
      // Store the full URL path for frontend consumption
      photos[itemName].push(`/api/photos/${req.file.filename}`);

      // Update checklist item as completed
      const checklistItems = inspection.checklistItems as Record<string, boolean> || {};
      checklistItems[itemName] = true;

      const updatedInspection = await storage.updateInspection(id, {
        photos,
        checklistItems
      });

      res.json({ 
        message: "Photo uploaded successfully",
        filename: req.file.filename,
        inspection: updatedInspection
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  // Complete inspection and upload to network folder
  app.post("/api/inspections/:id/complete", async (req, res) => {
    try {
      const { id } = req.params;
      const inspection = await storage.getInspection(id);
      
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }

      // Get current settings to check required items and network config
      const settings = await storage.getSettings();
      const checklistSettings = settings.checklistItemSettings as Record<string, string>;
      const checklistItems = inspection.checklistItems as Record<string, boolean>;

      // Validate all required items are completed
      const missingRequiredItems = CHECKLIST_ITEMS.filter(item => 
        checklistSettings[item] === "required" && !checklistItems[item]
      );

      if (missingRequiredItems.length > 0) {
        return res.status(400).json({ 
          message: "Missing required items", 
          missingItems: missingRequiredItems 
        });
      }
      // Create local backup folder structure
      const localBackupPath = path.join(process.cwd(), "Completed", inspection.roadworthyNumber);
      if (!fs.existsSync(localBackupPath)) {
        fs.mkdirSync(localBackupPath, { recursive: true });
      }

      // Copy all photos to local backup folder
      const photos = inspection.photos as Record<string, string[]>;
      for (const [itemName, photoFiles] of Object.entries(photos)) {
        for (const photoUrl of photoFiles) {
          // Extract filename from URL (remove /api/photos/ prefix)
          const filename = photoUrl.replace('/api/photos/', '');
          const sourcePath = path.join(uploadDir, filename);
          const destPath = path.join(localBackupPath, filename);
          if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, destPath);
          }
        }
      }

      // Create inspection report for backup
      const inspectionReport = {
        roadworthyNumber: inspection.roadworthyNumber,
        clientName: inspection.clientName,
        vehicleDescription: inspection.vehicleDescription,
        status: inspection.status,
        completedAt: new Date().toISOString(),
        checklistItems: inspection.checklistItems,
        photos: inspection.photos,
        testNumber: inspection.testNumber
      };

      // Save inspection report to backup folder
      const reportPath = path.join(localBackupPath, "inspection_report.json");
      fs.writeFileSync(reportPath, JSON.stringify(inspectionReport, null, 2));
      
      console.log(`Local backup completed for inspection ${inspection.roadworthyNumber} in Completed folder`);

      // Update inspection as completed (upload status will be set above)
      const updatedInspection = await storage.updateInspection(id, {
        completedAt: new Date().toISOString()
      });

      res.json({ 
        message: "Inspection completed successfully",
        localPath: localBackupPath,
        inspection: updatedInspection
      });
    } catch (error: unknown) {
      console.error("Complete inspection error:", error);
      res.status(500).json({ message: "Failed to complete inspection" });
    }
  });



  // Get settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update settings
  app.patch("/api/settings", async (req, res) => {
    try {
      const data = req.body;
      const settings = await storage.updateSettings(data);
      res.json(settings);
    } catch (error) {
      console.error("Settings update error:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Get checklist items
  app.get("/api/checklist-items", (req, res) => {
    res.json(CHECKLIST_ITEMS);
  });

  // Delete inspection
  app.delete("/api/inspections/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get inspection before deleting to clean up photos
      const inspection = await storage.getInspection(id);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }

      // Clean up associated photo files from uploads folder only
      const photos = (inspection.photos as Record<string, string[]>) || {};
      for (const [itemName, photoUrls] of Object.entries(photos)) {
        for (const photoUrl of photoUrls) {
          // Extract filename from URL (remove /api/photos/ prefix)
          const filename = photoUrl.replace('/api/photos/', '');
          const filePath = path.join(uploadDir, filename);
          
          // Only delete from uploads folder, preserve Completed folder
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
              console.log(`Deleted photo file: ${filename} from uploads`);
            } catch (deleteError) {
              console.warn(`Failed to delete photo file: ${filename}`, deleteError);
            }
          }
        }
      }
      
      const success = await storage.deleteInspection(id);
      if (!success) {
        return res.status(404).json({ message: "Inspection not found" });
      }

      res.json({ message: "Inspection deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inspection" });
    }
  });

  // Delete photo from inspection
  app.delete("/api/inspections/:id/photos/:itemName/:photoIndex", async (req, res) => {
    try {
      const { id, itemName, photoIndex } = req.params;
      const photoIndexNum = parseInt(photoIndex, 10);

      if (isNaN(photoIndexNum) || photoIndexNum < 0) {
        return res.status(400).json({ error: "Valid photo index is required" });
      }

      const inspection = await storage.getInspection(id);
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }

      const photos = (inspection.photos as Record<string, string[]>) || {};
      const itemPhotos = photos[itemName] || [];

      if (photoIndexNum >= itemPhotos.length) {
        return res.status(404).json({ error: "Photo not found" });
      }

      // Get the photo URL to delete the file
      const photoToDelete = itemPhotos[photoIndexNum];
      
      // Delete the physical file from uploads folder only
      if (photoToDelete) {
        const filename = photoToDelete.replace('/api/photos/', '');
        const filePath = path.join(uploadDir, filename);
        
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`Deleted photo file: ${filename} from uploads`);
          } catch (deleteError) {
            console.warn(`Failed to delete photo file: ${filename}`, deleteError);
          }
        }
      }

      // Remove the photo from the array
      const updatedItemPhotos = itemPhotos.filter((_: string, index: number) => index !== photoIndexNum);
      const updatedPhotos = { ...photos };
      
      if (updatedItemPhotos.length === 0) {
        delete updatedPhotos[itemName];
      } else {
        updatedPhotos[itemName] = updatedItemPhotos;
      }

      // Update checklist completion status if no photos remain for this item
      const checklistItems = (inspection.checklistItems as Record<string, boolean>) || {};
      let updatedChecklistItems = { ...checklistItems };
      
      if (updatedItemPhotos.length === 0) {
        updatedChecklistItems[itemName] = false;
      }

      const updatedInspection = await storage.updateInspection(id, {
        photos: updatedPhotos,
        checklistItems: updatedChecklistItems
      });

      res.json(updatedInspection);
    } catch (error) {
      console.error("Failed to delete photo:", error);
      res.status(500).json({ error: "Failed to delete photo" });
    }
  });

  // Create retest from existing inspection  
  app.post("/api/inspections/:id/retest", async (req, res) => {
    try {
      const { id } = req.params;
      
      const originalInspection = await storage.getInspection(id);
      if (!originalInspection) {
        return res.status(404).json({ message: "Original inspection not found" });
      }

      // Find the next test number for this roadworthy number
      const allInspections = await storage.getAllInspections();
      const sameRoadworthyInspections = allInspections.filter(
        inspection => inspection.roadworthyNumber === originalInspection.roadworthyNumber
      );
      const nextTestNumber = Math.max(...sameRoadworthyInspections.map(i => i.testNumber || 1)) + 1;

      // Create new inspection with empty checklist and photos
      const retestData = {
        roadworthyNumber: originalInspection.roadworthyNumber,
        clientName: originalInspection.clientName || "",
        vehicleDescription: originalInspection.vehicleDescription || "",
        status: "in-progress" as const,
      };

      const newInspection = await storage.createInspection(retestData);
      
      // Update the new inspection with the correct test number
      const updatedInspection = await storage.updateInspection(newInspection.id, {
        testNumber: nextTestNumber
      });

      res.status(201).json(updatedInspection);
    } catch (error) {
      res.status(500).json({ message: "Failed to create retest" });
    }
  });

  // Logo upload configuration
  const logoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/logos')
    },
    filename: function (req, file, cb) {
      // Keep original extension
      const ext = path.extname(file.originalname);
      cb(null, `logo-${Date.now()}${ext}`)
    }
  });

  const logoUpload = multer({ 
    storage: logoStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Logo upload endpoint
  app.post('/api/upload-logo', logoUpload.single('logo'), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Create logos directory if it doesn't exist
      await fs.promises.mkdir('uploads/logos', { recursive: true });

      const logoUrl = `/uploads/logos/${file.filename}`;
      
      // Update settings with new logo URL
      let settings = await storage.getSettings();
      
      if (settings) {
        await storage.updateSettings({
          checklistItemSettings: settings.checklistItemSettings as any,
          logoUrl: logoUrl
        });
      } else {
        // Create settings if they don't exist
        await storage.updateSettings({
          checklistItemSettings: {},
          logoUrl: logoUrl
        });
      }

      res.json({
        message: 'Logo uploaded successfully',
        logoUrl: logoUrl
      });
    } catch (error) {
      console.error('Logo upload error:', error);
      res.status(500).json({ error: 'Logo upload failed' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
