import {
  users,
  foodItems,
  foodClaims,
  foodDonations,
  type User,
  type UpsertUser,
  type FoodItem,
  type InsertFoodItem,
  type FoodClaim,
  type InsertFoodClaim,
  type FoodDonation,
  type InsertFoodDonation,
  type FoodItemWithCreator,
  type FoodClaimWithDetails,
  type FoodDonationWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Food item operations
  getAllActiveFoodItems(): Promise<FoodItemWithCreator[]>;
  getFoodItemById(id: string): Promise<FoodItem | undefined>;
  createFoodItem(foodItem: InsertFoodItem): Promise<FoodItem>;
  updateFoodItem(
    id: string,
    updates: Partial<InsertFoodItem>,
  ): Promise<FoodItem>;
  deleteFoodItem(id: string): Promise<void>;
  getFoodItemsByCreator(creatorId: string): Promise<FoodItem[]>;

  // Food claim operations
  createFoodClaim(
    claim: InsertFoodClaim & { claimCode: string },
  ): Promise<FoodClaim>;
  getFoodClaimsByUser(userId: string): Promise<FoodClaimWithDetails[]>;
  getFoodClaimByClaimCode(
    claimCode: string,
  ): Promise<FoodClaimWithDetails | undefined>;
  updateFoodClaimStatus(
    id: string,
    status: string,
    claimedAt?: Date,
  ): Promise<FoodClaim>;
  getActiveFoodClaims(): Promise<FoodClaimWithDetails[]>;

  // Get claim with full details for verification
  getClaimByCode(claimCode: string): Promise<FoodClaimWithDetails | undefined>;

  // Complete a claim (mark as collected)
  completeClaim(claimId: string): Promise<FoodClaimWithDetails>;

  // Food donation operations
  getExpiredFoodItems(): Promise<FoodItem[]>;
  createFoodDonation(donation: InsertFoodDonation): Promise<FoodDonation>;
  getAllDonations(): Promise<FoodDonationWithDetails[]>;
  getDonationsByCreator(creatorId: string): Promise<FoodDonationWithDetails[]>;
  updateDonationStatus(
    id: string,
    status: string,
    ngoInfo?: {
      ngoName: string;
      ngoContactPerson: string;
      ngoPhoneNumber: string;
    },
  ): Promise<FoodDonation>;
  transferExpiredItemsToDonations(): Promise<number>;

  // Status management
  updateExpiredItemsStatus(): Promise<number>;

  // Stats operations
  getCampusStats(): Promise<{
    totalMealsSaved: number;
    activeStudents: number;
    partnerCanteens: number;
    totalSavings: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Food item operations
  async getAllActiveFoodItems(): Promise<FoodItemWithCreator[]> {
    const now = new Date().toISOString();

    // First, automatically deactivate expired items
    await this.updateExpiredItemsStatus();

    return (await db
      .select({
        id: foodItems.id,
        name: foodItems.name,
        description: foodItems.description,
        canteenName: foodItems.canteenName,
        canteenLocation: foodItems.canteenLocation,
        quantityAvailable: foodItems.quantityAvailable,
        originalPrice: foodItems.originalPrice,
        discountedPrice: foodItems.discountedPrice,
        imageUrl: foodItems.imageUrl,
        availableUntil: foodItems.availableUntil,
        isActive: foodItems.isActive,
        createdBy: foodItems.createdBy,
        createdAt: foodItems.createdAt,
        updatedAt: foodItems.updatedAt,
        createdByUser: users,
      })
      .from(foodItems)
      .leftJoin(users, eq(foodItems.createdBy, users.id))
      .where(
        and(
          eq(foodItems.isActive, true),
          gte(foodItems.availableUntil, now),
          gte(foodItems.quantityAvailable, 1),
        ),
      )
      .orderBy(desc(foodItems.createdAt))) as any;
  }

  async getFoodItemById(id: string): Promise<FoodItem | undefined> {
    const [item] = await db
      .select()
      .from(foodItems)
      .where(eq(foodItems.id, id));
    return item;
  }

  async createFoodItem(foodItem: InsertFoodItem): Promise<FoodItem> {
    const [item] = await db.insert(foodItems).values(foodItem).returning();
    return item;
  }

  async updateFoodItem(
    id: string,
    updates: Partial<InsertFoodItem>,
  ): Promise<FoodItem> {
    const [item] = await db
      .update(foodItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(foodItems.id, id))
      .returning();
    return item;
  }

  async deleteFoodItem(id: string): Promise<void> {
    // Delete associated food donations first (if any)
    await db.delete(foodDonations).where(eq(foodDonations.foodItemId, id));

    // Delete associated food claims
    await db.delete(foodClaims).where(eq(foodClaims.foodItemId, id));

    // Finally delete the food item
    await db.delete(foodItems).where(eq(foodItems.id, id));
  }

  async getFoodItemsByCreator(creatorId: string): Promise<FoodItem[]> {
    // Update expired items status before fetching
    await this.updateExpiredItemsStatus();

    return await db
      .select()
      .from(foodItems)
      .where(eq(foodItems.createdBy, creatorId))
      .orderBy(desc(foodItems.createdAt));
  }

  // Food claim operations
  async createFoodClaim(
    claim: InsertFoodClaim & { claimCode: string },
  ): Promise<FoodClaim> {
    const [newClaim] = await db.insert(foodClaims).values(claim).returning();

    // Update food item quantity
    await db
      .update(foodItems)
      .set({
        quantityAvailable: sql`quantity_available - ${claim.quantityClaimed}`,
        updatedAt: new Date(),
      })
      .where(eq(foodItems.id, claim.foodItemId));

    return newClaim;
  }

  async getFoodClaimsByUser(userId: string): Promise<FoodClaimWithDetails[]> {
    return (await db
      .select({
        id: foodClaims.id,
        userId: foodClaims.userId,
        foodItemId: foodClaims.foodItemId,
        quantityClaimed: foodClaims.quantityClaimed,
        claimCode: foodClaims.claimCode,
        status: foodClaims.status,
        expiresAt: foodClaims.expiresAt,
        claimedAt: foodClaims.claimedAt,
        createdAt: foodClaims.createdAt,
        user: users,
        foodItem: foodItems,
      })
      .from(foodClaims)
      .leftJoin(users, eq(foodClaims.userId, users.id))
      .leftJoin(foodItems, eq(foodClaims.foodItemId, foodItems.id))
      .where(eq(foodClaims.userId, userId))
      .orderBy(desc(foodClaims.createdAt))) as any;
  }

  async getFoodClaimByClaimCode(
    claimCode: string,
  ): Promise<FoodClaimWithDetails | undefined> {
    const [claim] = (await db
      .select({
        id: foodClaims.id,
        userId: foodClaims.userId,
        foodItemId: foodClaims.foodItemId,
        quantityClaimed: foodClaims.quantityClaimed,
        claimCode: foodClaims.claimCode,
        status: foodClaims.status,
        expiresAt: foodClaims.expiresAt,
        claimedAt: foodClaims.claimedAt,
        createdAt: foodClaims.createdAt,
        user: users,
        foodItem: foodItems,
      })
      .from(foodClaims)
      .leftJoin(users, eq(foodClaims.userId, users.id))
      .leftJoin(foodItems, eq(foodClaims.foodItemId, foodItems.id))
      .where(eq(foodClaims.claimCode, claimCode))) as any;

    return claim;
  }

  async updateFoodClaimStatus(
    id: string,
    status: string,
    claimedAt?: Date,
  ): Promise<FoodClaim> {
    const [claim] = await db
      .update(foodClaims)
      .set({ status, claimedAt })
      .where(eq(foodClaims.id, id))
      .returning();
    return claim;
  }

  async getActiveFoodClaims(): Promise<FoodClaimWithDetails[]> {
    const now = new Date();
    return (await db
      .select({
        id: foodClaims.id,
        userId: foodClaims.userId,
        foodItemId: foodClaims.foodItemId,
        quantityClaimed: foodClaims.quantityClaimed,
        claimCode: foodClaims.claimCode,
        status: foodClaims.status,
        expiresAt: foodClaims.expiresAt,
        claimedAt: foodClaims.claimedAt,
        createdAt: foodClaims.createdAt,
        user: users,
        foodItem: foodItems,
      })
      .from(foodClaims)
      .leftJoin(users, eq(foodClaims.userId, users.id))
      .leftJoin(foodItems, eq(foodClaims.foodItemId, foodItems.id))
      .where(
        and(eq(foodClaims.status, "reserved"), gte(foodClaims.expiresAt, now)),
      )
      .orderBy(desc(foodClaims.createdAt))) as any;
  }

  async getCampusStats(): Promise<{
    totalMealsSaved: number;
    activeStudents: number;
    partnerCanteens: number;
    totalSavings: number;
  }> {
    // Get total meals claimed
    const [mealsSaved] = await db
      .select({ count: sql<number>`count(*)` })
      .from(foodClaims)
      .where(eq(foodClaims.status, "claimed"));

    // Get active students (users with claims in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [activeStudents] = await db
      .select({ count: sql<number>`count(distinct user_id)` })
      .from(foodClaims)
      .where(gte(foodClaims.createdAt, thirtyDaysAgo));

    // Get unique canteens count
    const [partnerCanteens] = await db
      .select({ count: sql<number>`count(distinct canteen_name)` })
      .from(foodItems)
      .where(eq(foodItems.isActive, true));

    // Calculate total savings (difference between original and discounted prices)
    const [savings] = await db
      .select({
        total: sql<number>`sum((${foodItems.originalPrice} - ${foodItems.discountedPrice}) * ${foodClaims.quantityClaimed})`,
      })
      .from(foodClaims)
      .leftJoin(foodItems, eq(foodClaims.foodItemId, foodItems.id))
      .where(eq(foodClaims.status, "claimed"));

    return {
      totalMealsSaved: mealsSaved?.count || 0,
      activeStudents: activeStudents?.count || 0,
      partnerCanteens: partnerCanteens?.count || 0,
      totalSavings: Number(savings?.total || 0),
    };
  }

  // Get claim with full details for verification (alias for getFoodClaimByClaimCode)
  async getClaimByCode(
    claimCode: string,
  ): Promise<FoodClaimWithDetails | undefined> {
    return this.getFoodClaimByClaimCode(claimCode);
  }

  // Complete a claim (mark as collected)
  async completeClaim(claimId: string): Promise<FoodClaimWithDetails> {
    // Update the claim status to 'claimed'
    await this.updateFoodClaimStatus(claimId, "claimed", new Date());

    // Return the updated claim with full details
    const claim = await db
      .select({
        id: foodClaims.id,
        userId: foodClaims.userId,
        foodItemId: foodClaims.foodItemId,
        quantityClaimed: foodClaims.quantityClaimed,
        claimCode: foodClaims.claimCode,
        status: foodClaims.status,
        expiresAt: foodClaims.expiresAt,
        claimedAt: foodClaims.claimedAt,
        createdAt: foodClaims.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          studentId: users.studentId,
          phoneNumber: users.phoneNumber,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        foodItem: {
          id: foodItems.id,
          name: foodItems.name,
          description: foodItems.description,
          canteenName: foodItems.canteenName,
          canteenLocation: foodItems.canteenLocation,
          quantityAvailable: foodItems.quantityAvailable,
          originalPrice: foodItems.originalPrice,
          discountedPrice: foodItems.discountedPrice,
          imageUrl: foodItems.imageUrl,
          availableUntil: foodItems.availableUntil,
          isActive: foodItems.isActive,
          createdBy: foodItems.createdBy,
          createdAt: foodItems.createdAt,
          updatedAt: foodItems.updatedAt,
        },
      })
      .from(foodClaims)
      .leftJoin(users, eq(foodClaims.userId, users.id))
      .leftJoin(foodItems, eq(foodClaims.foodItemId, foodItems.id))
      .where(eq(foodClaims.id, claimId))
      .limit(1);

    if (!claim[0]) {
      throw new Error("Claim not found after completion");
    }

    return claim[0] as FoodClaimWithDetails;
  }

  // Food donation operations
  async getExpiredFoodItems(): Promise<FoodItem[]> {
    const now = new Date().toISOString();
    return await db
      .select()
      .from(foodItems)
      .where(
        and(
          eq(foodItems.isActive, false), // Now get inactive items (which are expired)
          sql`${foodItems.availableUntil} < ${now}`,
        ),
      )
      .orderBy(desc(foodItems.createdAt));
  }

  // New method to automatically update expired items to inactive
  async updateExpiredItemsStatus(): Promise<number> {
    const now = new Date().toISOString();

    // Set expired items to inactive
    const expiredResult = await db
      .update(foodItems)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(foodItems.isActive, true),
          sql`${foodItems.availableUntil} < ${now}`,
        ),
      )
      .returning({ id: foodItems.id });

    // Reactivate items that are not expired anymore (in case time was extended)
    const reactivatedResult = await db
      .update(foodItems)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(foodItems.isActive, false),
          gte(foodItems.availableUntil, now),
          gte(foodItems.quantityAvailable, 1),
        ),
      )
      .returning({ id: foodItems.id });

    return expiredResult.length;
  }

  async createFoodDonation(
    donation: InsertFoodDonation,
  ): Promise<FoodDonation> {
    const [newDonation] = await db
      .insert(foodDonations)
      .values(donation)
      .returning();
    return newDonation;
  }

  async getAllDonations(): Promise<FoodDonationWithDetails[]> {
    return (await db
      .select({
        id: foodDonations.id,
        foodItemId: foodDonations.foodItemId,
        ngoName: foodDonations.ngoName,
        ngoContactPerson: foodDonations.ngoContactPerson,
        ngoPhoneNumber: foodDonations.ngoPhoneNumber,
        quantityDonated: foodDonations.quantityDonated,
        status: foodDonations.status,
        donatedAt: foodDonations.donatedAt,
        reservedAt: foodDonations.reservedAt,
        collectedAt: foodDonations.collectedAt,
        notes: foodDonations.notes,
        createdAt: foodDonations.createdAt,
        foodItem: foodItems,
      })
      .from(foodDonations)
      .leftJoin(foodItems, eq(foodDonations.foodItemId, foodItems.id))
      .orderBy(desc(foodDonations.createdAt))) as any;
  }

  async getDonationsByCreator(
    creatorId: string,
  ): Promise<FoodDonationWithDetails[]> {
    return (await db
      .select({
        id: foodDonations.id,
        foodItemId: foodDonations.foodItemId,
        ngoName: foodDonations.ngoName,
        ngoContactPerson: foodDonations.ngoContactPerson,
        ngoPhoneNumber: foodDonations.ngoPhoneNumber,
        quantityDonated: foodDonations.quantityDonated,
        status: foodDonations.status,
        donatedAt: foodDonations.donatedAt,
        reservedAt: foodDonations.reservedAt,
        collectedAt: foodDonations.collectedAt,
        notes: foodDonations.notes,
        createdAt: foodDonations.createdAt,
        foodItem: foodItems,
      })
      .from(foodDonations)
      .leftJoin(foodItems, eq(foodDonations.foodItemId, foodItems.id))
      .where(eq(foodItems.createdBy, creatorId))
      .orderBy(desc(foodDonations.createdAt))) as any;
  }

  async updateDonationStatus(
    id: string,
    status: string,
    ngoInfo?: {
      ngoName: string;
      ngoContactPerson: string;
      ngoPhoneNumber: string;
    },
  ): Promise<FoodDonation> {
    const updateData: any = { status };

    if (status === "reserved_for_ngo" && ngoInfo) {
      updateData.ngoName = ngoInfo.ngoName;
      updateData.ngoContactPerson = ngoInfo.ngoContactPerson;
      updateData.ngoPhoneNumber = ngoInfo.ngoPhoneNumber;
      updateData.reservedAt = new Date();
    } else if (status === "collected") {
      updateData.collectedAt = new Date();
    }

    const [donation] = await db
      .update(foodDonations)
      .set(updateData)
      .where(eq(foodDonations.id, id))
      .returning();
    return donation;
  }

  async transferExpiredItemsToDonations(): Promise<number> {
    // First update expired items status
    await this.updateExpiredItemsStatus();

    const expiredItems = await this.getExpiredFoodItems();
    let transferredCount = 0;

    for (const item of expiredItems) {
      if (item.quantityAvailable > 0) {
        // Check if donation already exists for this item
        const existingDonation = await db
          .select()
          .from(foodDonations)
          .where(eq(foodDonations.foodItemId, item.id))
          .limit(1);

        if (existingDonation.length === 0) {
          // Create donation entry only if it doesn't exist
          await this.createFoodDonation({
            foodItemId: item.id,
            quantityDonated: item.quantityAvailable,
            status: "available",
            notes: `Auto-transferred from expired food item: ${item.name}`,
          });
          transferredCount++;
        }
      }
    }

    return transferredCount;
  }
}

export const storage = new DatabaseStorage();
