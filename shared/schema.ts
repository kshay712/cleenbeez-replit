import { pgTable, text, serial, integer, boolean, timestamp, decimal, primaryKey, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firebaseUid: text("firebase_uid").unique(),
  role: text("role", { enum: ["user", "editor", "admin"] }).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

export const usersRelations = relations(users, ({ many }) => ({
  blogPosts: many(blogPosts),
}));

// Categories Table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
  blogPosts: many(blogPostsToCategories),
}));

// Products Table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  image: text("image").notNull(),
  // Product features
  organic: boolean("organic").default(false),
  bpaFree: boolean("bpa_free").default(false),
  phthalateFree: boolean("phthalate_free").default(false),
  parabenFree: boolean("paraben_free").default(false),
  oxybenzoneFree: boolean("oxybenzone_free").default(false),
  formaldehydeFree: boolean("formaldehyde_free").default(false),
  sulfatesFree: boolean("sulfates_free").default(false),
  fdcFree: boolean("fdc_free").default(false),
  whyRecommend: text("why_recommend").notNull(),
  ingredients: json("ingredients").$type<string[]>().notNull(),
  affiliateLink: text("affiliate_link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  vendors: many(vendors),
}));

// Vendors Table
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

export const vendorsRelations = relations(vendors, ({ one }) => ({
  product: one(products, {
    fields: [vendors.productId],
    references: [products.id],
  }),
}));

// Blog Posts Table
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  featuredImage: text("featured_image").notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  published: boolean("published").default(false),
  featured: boolean("featured").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  categories: many(blogPostsToCategories),
}));

// Blog Posts to Categories (Many-to-Many)
export const blogPostsToCategories = pgTable("blog_posts_to_categories", {
  blogPostId: integer("blog_post_id").references(() => blogPosts.id).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.blogPostId, t.categoryId] }),
}));

export const blogPostsToCategoriesRelations = relations(blogPostsToCategories, ({ one }) => ({
  blogPost: one(blogPosts, {
    fields: [blogPostsToCategories.blogPostId],
    references: [blogPosts.id],
  }),
  category: one(categories, {
    fields: [blogPostsToCategories.categoryId],
    references: [categories.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, lastLogin: true });

export const insertCategorySchema = createInsertSchema(categories)
  .omit({ id: true });

export const insertProductSchema = createInsertSchema(products)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertVendorSchema = createInsertSchema(vendors)
  .omit({ id: true });

export const insertBlogPostSchema = createInsertSchema(blogPosts)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertBlogPostToCategorySchema = createInsertSchema(blogPostsToCategories);

// Type Definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type BlogPostToCategory = typeof blogPostsToCategories.$inferSelect;
export type InsertBlogPostToCategory = z.infer<typeof insertBlogPostToCategorySchema>;
