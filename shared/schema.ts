import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("student"), // student or staff
  studentId: varchar("student_id"),
  phoneNumber: varchar("phone_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Food items table
export const foodItems = pgTable("food_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  canteenName: varchar("canteen_name", { length: 255 }).notNull(),
  canteenLocation: varchar("canteen_location", { length: 255 }),
  quantityAvailable: integer("quantity_available").notNull().default(0),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(),
  discountedPrice: decimal("discounted_price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  availableUntil: timestamp("available_until").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Food claims table
export const foodClaims = pgTable("food_claims", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  foodItemId: uuid("food_item_id").notNull().references(() => foodItems.id),
  quantityClaimed: integer("quantity_claimed").notNull().default(1),
  qrCode: text("qr_code").unique().notNull(),
  status: varchar("status", { length: 50 }).notNull().default("reserved"), // reserved, claimed, expired, cancelled
  expiresAt: timestamp("expires_at").notNull(),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  foodItems: many(foodItems),
  foodClaims: many(foodClaims),
}));

export const foodItemsRelations = relations(foodItems, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [foodItems.createdBy],
    references: [users.id],
  }),
  claims: many(foodClaims),
}));

export const foodClaimsRelations = relations(foodClaims, ({ one }) => ({
  user: one(users, {
    fields: [foodClaims.userId],
    references: [users.id],
  }),
  foodItem: one(foodItems, {
    fields: [foodClaims.foodItemId],
    references: [foodItems.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
  studentId: true,
  phoneNumber: true,
});

export const insertFoodItemSchema = createInsertSchema(foodItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFoodClaimSchema = createInsertSchema(foodClaims).omit({
  id: true,
  qrCode: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;
export type FoodItem = typeof foodItems.$inferSelect;
export type InsertFoodClaim = z.infer<typeof insertFoodClaimSchema>;
export type FoodClaim = typeof foodClaims.$inferSelect;

// Extended types with relations
export type FoodItemWithCreator = FoodItem & {
  createdBy: User;
};

export type FoodClaimWithDetails = FoodClaim & {
  user: User;
  foodItem: FoodItem;
};
