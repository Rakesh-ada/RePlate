import {
  users,
  foodItems,
  foodClaims,
  type User,
  type UpsertUser,
  type FoodItem,
  type InsertFoodItem,
  type FoodClaim,
  type InsertFoodClaim,
  type FoodItemWithCreator,
  type FoodClaimWithDetails,
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
  updateFoodItem(id: string, updates: Partial<InsertFoodItem>): Promise<FoodItem>;
  deleteFoodItem(id: string): Promise<void>;
  getFoodItemsByCreator(creatorId: string): Promise<FoodItem[]>;

  // Food claim operations
  createFoodClaim(claim: InsertFoodClaim & { claimCode: string }): Promise<FoodClaim>;
  getFoodClaimsByUser(userId: string): Promise<FoodClaimWithDetails[]>;
  getFoodClaimByClaimCode(claimCode: string): Promise<FoodClaimWithDetails | undefined>;
  updateFoodClaimStatus(id: string, status: string, claimedAt?: Date): Promise<FoodClaim>;
  getActiveFoodClaims(): Promise<FoodClaimWithDetails[]>;

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
    const now = new Date();
    return await db
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
          gte(foodItems.quantityAvailable, 1)
        )
      )
      .orderBy(desc(foodItems.createdAt)) as any;
  }

  async getFoodItemById(id: string): Promise<FoodItem | undefined> {
    const [item] = await db.select().from(foodItems).where(eq(foodItems.id, id));
    return item;
  }

  async createFoodItem(foodItem: InsertFoodItem): Promise<FoodItem> {
    const [item] = await db.insert(foodItems).values(foodItem).returning();
    return item;
  }

  async updateFoodItem(id: string, updates: Partial<InsertFoodItem>): Promise<FoodItem> {
    const [item] = await db
      .update(foodItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(foodItems.id, id))
      .returning();
    return item;
  }

  async deleteFoodItem(id: string): Promise<void> {
    await db.delete(foodItems).where(eq(foodItems.id, id));
  }

  async getFoodItemsByCreator(creatorId: string): Promise<FoodItem[]> {
    return await db
      .select()
      .from(foodItems)
      .where(eq(foodItems.createdBy, creatorId))
      .orderBy(desc(foodItems.createdAt));
  }

  // Food claim operations
  async createFoodClaim(claim: InsertFoodClaim & { claimCode: string }): Promise<FoodClaim> {
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
    return await db
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
      .orderBy(desc(foodClaims.createdAt)) as any;
  }

  async getFoodClaimByClaimCode(claimCode: string): Promise<FoodClaimWithDetails | undefined> {
    const [claim] = await db
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
      .where(eq(foodClaims.claimCode, claimCode)) as any;
    
    return claim;
  }

  async updateFoodClaimStatus(id: string, status: string, claimedAt?: Date): Promise<FoodClaim> {
    const [claim] = await db
      .update(foodClaims)
      .set({ status, claimedAt })
      .where(eq(foodClaims.id, id))
      .returning();
    return claim;
  }

  async getActiveFoodClaims(): Promise<FoodClaimWithDetails[]> {
    const now = new Date();
    return await db
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
        and(
          eq(foodClaims.status, "reserved"),
          gte(foodClaims.expiresAt, now)
        )
      )
      .orderBy(desc(foodClaims.createdAt)) as any;
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
}

export const storage = new DatabaseStorage();
