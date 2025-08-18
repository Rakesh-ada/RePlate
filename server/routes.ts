import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertFoodItemSchema, insertFoodClaimSchema } from "@shared/schema";
import { generateClaimCode } from "@shared/qr-utils";
import { z } from "zod";

// Extend session interface for demo auth
declare module 'express-session' {
  interface SessionData {
    user?: {
      claims: { sub: string };
      access_token: string;
      expires_at: number;
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Development authentication bypass for demo purposes
  app.get('/api/demo-login/:role', async (req, res) => {
    try {
      const { role } = req.params;
      
      if (role !== 'student' && role !== 'staff') {
        return res.status(400).json({ message: "Invalid role. Use 'student' or 'staff'" });
      }

      // Create demo user
      const demoUser = await storage.upsertUser({
        id: `demo-${role}-${Date.now()}`,
        email: `${role}@demo.edu`,
        firstName: role === 'staff' ? 'Staff' : 'Student',
        lastName: 'Demo',
        role: role,
        studentId: role === 'student' ? 'STU001' : undefined,
        phoneNumber: '+1234567890',
      });

      // Create demo session
      req.session.user = {
        claims: { sub: demoUser.id },
        access_token: 'demo-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      };

      res.json({ success: true, user: demoUser });
    } catch (error) {
      console.error("Error creating demo user:", error);
      res.status(500).json({ message: "Failed to create demo user" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      let user = null;
      
      // Check for demo session first
      if (req.session.user) {
        const userId = req.session.user.claims.sub;
        user = await storage.getUser(userId);
      }
      // Then check for Replit auth
      else if (req.isAuthenticated() && req.user) {
        const userId = req.user.claims.sub;
        user = await storage.getUser(userId);
      }
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Food items routes
  app.get('/api/food-items', async (req, res) => {
    try {
      const items = await storage.getAllActiveFoodItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching food items:", error);
      res.status(500).json({ message: "Failed to fetch food items" });
    }
  });

  app.get('/api/food-items/my', async (req: any, res) => {
    try {
      let userId = null;
      
      // Check demo session first
      if (req.session.user) {
        userId = req.session.user.claims.sub;
      }
      // Then check Replit auth
      else if (req.isAuthenticated() && req.user) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const items = await storage.getFoodItemsByCreator(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching user's food items:", error);
      res.status(500).json({ message: "Failed to fetch food items" });
    }
  });

  app.post('/api/food-items', async (req: any, res) => {
    try {
      let userId = null;
      
      // Check demo session first
      if (req.session.user) {
        userId = req.session.user.claims.sub;
      }
      // Then check Replit auth
      else if (req.isAuthenticated() && req.user) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Only staff can create food items" });
      }

      const validatedData = insertFoodItemSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const item = await storage.createFoodItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating food item:", error);
      res.status(500).json({ message: "Failed to create food item" });
    }
  });

  app.put('/api/food-items/:id', async (req: any, res) => {
    try {
      let userId = null;
      
      // Check demo session first
      if (req.session.user) {
        userId = req.session.user.claims.sub;
      }
      // Then check Replit auth
      else if (req.isAuthenticated() && req.user) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Only staff can update food items" });
      }

      const { id } = req.params;
      const existingItem = await storage.getFoodItemById(id);
      
      if (!existingItem || existingItem.createdBy !== userId) {
        return res.status(404).json({ message: "Food item not found or unauthorized" });
      }

      const validatedData = insertFoodItemSchema.partial().parse(req.body);
      const updatedItem = await storage.updateFoodItem(id, validatedData);
      res.json(updatedItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating food item:", error);
      res.status(500).json({ message: "Failed to update food item" });
    }
  });

  app.delete('/api/food-items/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Only staff can delete food items" });
      }

      const { id } = req.params;
      const existingItem = await storage.getFoodItemById(id);
      
      if (!existingItem || existingItem.createdBy !== userId) {
        return res.status(404).json({ message: "Food item not found or unauthorized" });
      }

      await storage.deleteFoodItem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting food item:", error);
      res.status(500).json({ message: "Failed to delete food item" });
    }
  });

  // Food claims routes
  app.post('/api/food-claims', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { foodItemId, quantityClaimed = 1 } = req.body;

      // Validate food item exists and has availability
      const foodItem = await storage.getFoodItemById(foodItemId);
      if (!foodItem || !foodItem.isActive) {
        return res.status(404).json({ message: "Food item not found or inactive" });
      }

      if (foodItem.quantityAvailable < quantityClaimed) {
        return res.status(400).json({ message: "Insufficient quantity available" });
      }

      if (new Date() >= new Date(foodItem.availableUntil)) {
        return res.status(400).json({ message: "Food item is no longer available" });
      }

      // Generate claim code
      const claimCode = generateClaimCode();
      
      // Set expiration (2 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2);

      const claimData = {
        userId,
        foodItemId,
        quantityClaimed,
        claimCode,
        status: "reserved" as const,
        expiresAt,
      };

      const claim = await storage.createFoodClaim(claimData);
      res.status(201).json(claim);
    } catch (error) {
      console.error("Error creating food claim:", error);
      res.status(500).json({ message: "Failed to claim food item" });
    }
  });

  app.get('/api/food-claims/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const claims = await storage.getFoodClaimsByUser(userId);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching user's claims:", error);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  app.get('/api/food-claims/code/:claimCode', async (req, res) => {
    try {
      const { claimCode } = req.params;
      const claim = await storage.getFoodClaimByClaimCode(claimCode);
      
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }

      // Check if claim is expired
      if (new Date() > new Date(claim.expiresAt)) {
        await storage.updateFoodClaimStatus(claim.id, "expired");
        return res.status(400).json({ message: "Claim has expired" });
      }

      res.json(claim);
    } catch (error) {
      console.error("Error fetching claim by code:", error);
      res.status(500).json({ message: "Failed to fetch claim" });
    }
  });

  app.put('/api/food-claims/:id/claim', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const claim = await storage.getFoodClaimByClaimCode(id); // id is actually claimCode here
      
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }

      if (claim.status !== "reserved") {
        return res.status(400).json({ message: "Claim is not in reserved status" });
      }

      if (new Date() > new Date(claim.expiresAt)) {
        await storage.updateFoodClaimStatus(claim.id, "expired");
        return res.status(400).json({ message: "Claim has expired" });
      }

      const updatedClaim = await storage.updateFoodClaimStatus(claim.id, "claimed", new Date());
      res.json(updatedClaim);
    } catch (error) {
      console.error("Error claiming food:", error);
      res.status(500).json({ message: "Failed to claim food" });
    }
  });

  // Stats routes
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await storage.getCampusStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Claim verification endpoints
  app.post("/api/food-claims/verify", isAuthenticated, async (req: any, res) => {
    try {
      const { claimCode } = req.body;
      if (!claimCode) {
        return res.status(400).json({ success: false, message: "Claim code is required" });
      }

      const claim = await storage.getClaimByCode(claimCode);
      if (!claim) {
        return res.json({ success: false, message: "Invalid claim code" });
      }

      if (claim.status !== "reserved") {
        return res.json({ success: false, message: `Claim is ${claim.status}` });
      }

      if (new Date() > new Date(claim.expiresAt)) {
        return res.json({ success: false, message: "Claim has expired" });
      }

      res.json({ success: true, claim });
    } catch (error) {
      console.error("Error verifying claim:", error);
      res.status(500).json({ success: false, message: "Failed to verify claim" });
    }
  });

  app.post("/api/food-claims/:id/complete", isAuthenticated, async (req: any, res) => {
    try {
      const claimId = req.params.id;
      const updatedClaim = await storage.completeClaim(claimId);
      res.json(updatedClaim);
    } catch (error) {
      console.error("Error completing claim:", error);
      res.status(500).json({ message: "Failed to complete claim" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
