import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { OAuth2Client } from "google-auth-library";
import { eq, desc, and, gte } from 'drizzle-orm';
import { insertFoodItemSchema, insertFoodClaimSchema } from "@shared/schema";
import { generateClaimCode } from "@shared/qr-utils";
import { z } from "zod";
import { db } from './db';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BASE_URL || 'http://localhost:5000'}/api/auth/google/callback`
);

export async function registerRoutes(app: Express): Promise<Server> {
 // Google OAuth routes
app.get('/api/auth/google', (req, res) => {
  const authUrl = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'profile', 'email'],  // 👈 MUST include openid
    prompt: 'consent',
    state: 'signup',
  });
  res.redirect(authUrl);
});

app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect('/?error=no_code');
    }

    const { tokens } = await googleClient.getToken(code as string);
    googleClient.setCredentials(tokens);
    console.log('Google tokens:', tokens);

    // Check if id_token exists
    if (!tokens.id_token) {
      console.error('No id_token received from Google');
      return res.redirect('/?error=no_id_token');
    }

    // Verify ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload();
    if (!payload) {
      return res.redirect('/?error=invalid_token');
    }

    // Create or get user
    const user = await storage.upsertUser({
      id: payload.sub,
      email: payload.email!,
      firstName: payload.given_name || '',
      lastName: payload.family_name || '',
      role: 'student',
      studentId: `STU${payload.sub.slice(-6)}`,
      phoneNumber: null,
    });

    // Create session
    req.session.user = {
      claims: { sub: user.id },
      access_token: tokens.access_token || 'google-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    // Redirect after login
    res.redirect('/student');
  } catch (error) {
    console.error('Google auth error:', error);
    res.redirect('/?error=auth_failed');
  }
});

  // Staff request routes
  app.post('/api/staff/request', async (req, res) => {
    try {
      const { firstName, lastName, email, phoneNumber, department, position, reason } = req.body;

      if (!firstName || !lastName || !email || !phoneNumber || !department || !position || !reason) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      const existingRequest = await storage.getStaffRequestByEmail(email);
      if (existingRequest) {
        return res.status(409).json({ message: 'A request with this email already exists' });
      }

      const staffRequest = await storage.createStaffRequest({
        firstName,
        lastName,
        email,
        phoneNumber,
        department,
        position,
        reason,
        status: 'pending',
      });

      res.status(201).json({ success: true, requestId: staffRequest.id });
    } catch (error) {
      console.error('Error creating staff request:', error);
      res.status(500).json({ message: 'Failed to create staff request' });
    }
  });

  // Admin routes for managing staff requests
  app.get('/api/admin/staff-requests', async (req, res) => {
    try {
      let userId = null;
      
      if (req.session.user) {
        userId = req.session.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const requests = await storage.getAllStaffRequests();
      res.json(requests);
    } catch (error) {
      console.error('Error fetching staff requests:', error);
      res.status(500).json({ message: 'Failed to fetch staff requests' });
    }
  });

  app.put('/api/admin/staff-requests/:id/approve', async (req, res) => {
    try {
      let userId = null;
      
      if (req.session.user) {
        userId = req.session.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const staffRequest = await storage.getStaffRequestById(id);
      
      if (!staffRequest) {
        return res.status(404).json({ message: 'Staff request not found' });
      }

      if (staffRequest.status !== 'pending') {
        return res.status(400).json({ message: 'Request has already been processed' });
      }

      const staffUser = await storage.upsertUser({
        id: `staff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: staffRequest.email,
        firstName: staffRequest.firstName,
        lastName: staffRequest.lastName,
        role: 'staff',
        phoneNumber: staffRequest.phoneNumber,
        studentId: undefined,
      });

      await storage.updateStaffRequestStatus(id, 'approved');

      res.json({ success: true, user: staffUser });
    } catch (error) {
      console.error('Error approving staff request:', error);
      res.status(500).json({ message: 'Failed to approve staff request' });
    }
  });

  app.put('/api/admin/staff-requests/:id/reject', async (req, res) => {
    try {
      let userId = null;
      
      if (req.session.user) {
        userId = req.session.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { reason } = req.body;

      await storage.updateStaffRequestStatus(id, 'rejected', reason);
      res.json({ success: true });
    } catch (error) {
      console.error('Error rejecting staff request:', error);
      res.status(500).json({ message: 'Failed to reject staff request' });
    }
  });

  // Auth routes
  app.get('/api/auth/user', async (req, res) => {
    try {
      let user = null;
      
      if (req.session.user) {
        const userId = req.session.user.claims.sub;
        user = await storage.getUser(userId);
      }
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      return res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Error logging out" });
      }
      res.clearCookie('connect.sid', { path: '/' });
      return res.json({ success: true });
    });
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

  app.delete('/api/food-items/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const existingItem = await storage.getFoodItemById(id);
      
      if (!existingItem) {
        return res.status(404).json({ message: "Food item not found" });
      }

      await storage.deleteFoodItem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting food item:", error);
      res.status(500).json({ message: "Failed to delete food item" });
    }
  });

  // Food claims routes
  app.post('/api/food-claims', async (req: any, res) => {
    try {
      let userId = null;
      
      // Check demo session first
      if (req.session.user) {
        userId = req.session.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
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

  app.get('/api/food-claims/my', async (req: any, res) => {
    try {
      let userId = null;
      
      // Check demo session first
      if (req.session.user) {
        userId = req.session.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
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

  app.put('/api/food-claims/:id/claim', async (req: any, res) => {
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
  app.post("/api/food-claims/verify", async (req: any, res) => {
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

  app.post("/api/food-claims/:id/complete", async (req: any, res) => {
    try {
      const claimId = req.params.id;
      const updatedClaim = await storage.completeClaim(claimId);
      res.json(updatedClaim);
    } catch (error) {
      console.error("Error completing claim:", error);
      res.status(500).json({ message: "Failed to complete claim" });
    }
  });

  // Food donation routes
  app.get('/api/donations', async (req: any, res) => {
    try {
      let userId = null;
      
      // Check demo session first
      if (req.session.user) {
        userId = req.session.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Only staff can view donations" });
      }

      const donations = await storage.getDonationsByCreator(userId);
      res.json(donations);
    } catch (error) {
      console.error("Error fetching donations:", error);
      res.status(500).json({ message: "Failed to fetch donations" });
    }
  });

  app.post('/api/donations/transfer-expired', async (req: any, res) => {
    try {
      let userId = null;
      
      // Check demo session first
      if (req.session.user) {
        userId = req.session.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Only staff can transfer expired items" });
      }

      const transferredCount = await storage.transferExpiredItemsToDonations();
      res.json({ success: true, transferredCount });
    } catch (error) {
      console.error("Error transferring expired items:", error);
      res.status(500).json({ message: "Failed to transfer expired items" });
    }
  });

  app.put('/api/donations/:id/reserve', async (req: any, res) => {
    try {
      let userId = null;
      
      // Check demo session first
      if (req.session.user) {
        userId = req.session.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Only staff can manage donations" });
      }

      const { id } = req.params;
      const { ngoName, ngoContactPerson, ngoPhoneNumber } = req.body;

      if (!ngoName || !ngoContactPerson || !ngoPhoneNumber) {
        return res.status(400).json({ message: "NGO information is required" });
      }

      const updatedDonation = await storage.updateDonationStatus(id, "reserved_for_ngo", {
        ngoName,
        ngoContactPerson,
        ngoPhoneNumber,
      });

      res.json(updatedDonation);
    } catch (error) {
      console.error("Error reserving donation:", error);
      res.status(500).json({ message: "Failed to reserve donation" });
    }
  });

  app.put('/api/donations/:id/collect', async (req: any, res) => {
    try {
      let userId = null;
      
      // Check demo session first
      if (req.session.user) {
        userId = req.session.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Only staff can manage donations" });
      }

      const { id } = req.params;
      const updatedDonation = await storage.updateDonationStatus(id, "collected");
      res.json(updatedDonation);
    } catch (error) {
      console.error("Error marking donation as collected:", error);
      res.status(500).json({ message: "Failed to mark donation as collected" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
