import { db } from "./db";
import { 
  users, 
  products, 
  categories, 
  vendors, 
  blogPosts, 
  blogPostsToCategories,
  type User, 
  type InsertUser,
  type Product,
  type InsertProduct,
  type Category,
  type InsertCategory,
  type Vendor,
  type InsertVendor,
  type BlogPost,
  type InsertBlogPost,
  type BlogPostToCategory,
  type InsertBlogPostToCategory
} from "@shared/schema";
import { eq, like, or, inArray, and, desc, asc, sql } from "drizzle-orm";

import session from "express-session";
import MemoryStore from "memorystore";

export interface IStorage {
  // Session store for express session
  sessionStore: session.Store;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  updateFirebaseUid(id: number, firebaseUid: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;

  // Product methods
  getProductById(id: number): Promise<Product | undefined>;
  getProducts(options?: {
    page?: number;
    limit?: number;
    category?: string[];
    organic?: boolean;
    bpaFree?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    search?: string;
  }): Promise<{ products: Product[], total: number }>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  getRelatedProducts(productId: number, limit?: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Vendor methods
  getVendorsByProductId(productId: number): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, vendor: Partial<InsertVendor>): Promise<Vendor | undefined>;
  deleteVendor(id: number): Promise<boolean>;

  // Blog methods
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getBlogPostById(id: number): Promise<BlogPost | undefined>;
  getBlogPosts(options?: {
    page?: number;
    limit?: number;
    category?: string;
    published?: boolean;
    sortBy?: string;
    search?: string;
  }): Promise<{ posts: BlogPost[], total: number }>;
  getFeaturedBlogPost(): Promise<BlogPost | undefined>;
  getRelatedBlogPosts(postId: number, limit?: number): Promise<BlogPost[]>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  
  // Blog category methods
  getBlogCategories(): Promise<Category[]>;
  addPostToCategory(postId: number, categoryId: number): Promise<void>;
  removePostFromCategory(postId: number, categoryId: number): Promise<void>;
  getPostCategories(postId: number): Promise<Category[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Initialize the session store
    const MemoryStoreFactory = MemoryStore(session);
    this.sessionStore = new MemoryStoreFactory({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.getUserById(id);
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateFirebaseUid(id: number, firebaseUid: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ firebaseUid })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Product methods
  async getProductById(id: number): Promise<Product | undefined> {
    try {
      // Force a fresh database query using SQL to avoid any cache issues
      // Especially important for feature flags
      const { sql } = await import('drizzle-orm');
      
      console.log('STORAGE: Getting fresh product data for ID:', id);
      
      const rawProduct = await db.execute(sql`
        SELECT 
          p.*,
          c.id as category_id,
          c.name as category_name,
          c.slug as category_slug
        FROM 
          products p
        LEFT JOIN 
          categories c ON p.category_id = c.id
        WHERE 
          p.id = ${id}
      `);
      
      if (!rawProduct || !rawProduct.length || !rawProduct[0]) {
        console.log('STORAGE: Product not found with ID:', id);
        return undefined;
      }
      
      const raw = rawProduct[0] as any;
      
      // Map the raw result to the Product type
      const product: Product = {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        price: raw.price,
        categoryId: raw.category_id,
        image: raw.image,
        organic: raw.organic,
        bpaFree: raw.bpa_free,
        phthalateFree: raw.phthalate_free,
        parabenFree: raw.paraben_free,
        oxybenzoneFree: raw.oxybenzone_free,
        formaldehydeFree: raw.formaldehyde_free,
        sulfatesFree: raw.sulfates_free,
        fdcFree: raw.fdc_free,
        whyRecommend: raw.why_recommend,
        ingredients: (() => {
          // BUGFIX: Handle ingredients properly by checking if it's already parsed
          if (!raw.ingredients) return [];
          
          try {
            // If it's a string, try to parse it
            if (typeof raw.ingredients === 'string') {
              return JSON.parse(raw.ingredients);
            } 
            // If it's already an array, use it as is
            if (Array.isArray(raw.ingredients)) {
              return raw.ingredients;
            }
            // If it's an object (from PostgreSQL), stringify and parse to ensure format
            return JSON.parse(JSON.stringify(raw.ingredients));
          } catch (error) {
            console.warn('Error parsing ingredients JSON, using as string:', error);
            // If parsing fails, wrap the raw string in an array
            return [raw.ingredients];
          }
        })(),
        affiliateLink: raw.affiliate_link,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
        category: raw.category_id ? {
          id: raw.category_id,
          name: raw.category_name,
          slug: raw.category_slug,
        } : undefined,
      };
      
      console.log('STORAGE: Fresh product feature flags:', {
        id: product.id,
        organic: product.organic,
        bpaFree: product.bpaFree,
        phthalateFree: product.phthalateFree,
        parabenFree: product.parabenFree,
        oxybenzoneFree: product.oxybenzoneFree,
        formaldehydeFree: product.formaldehydeFree,
        sulfatesFree: product.sulfatesFree,
        fdcFree: product.fdcFree
      });
      
      return product;
    } catch (error) {
      console.error('Error getting product by ID:', error);
      return undefined;
    }
  }

  async getProducts(options: {
    page?: number;
    limit?: number;
    category?: string[];
    organic?: boolean;
    bpaFree?: boolean;
    phthalateFree?: boolean;
    parabenFree?: boolean;
    oxybenzoneFree?: boolean;
    formaldehydeFree?: boolean;
    sulfatesFree?: boolean;
    fdcFree?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    search?: string;
  } = {}): Promise<{ products: Product[], total: number }> {
    const {
      page = 1,
      limit = 12,
      category,
      organic,
      bpaFree,
      phthalateFree,
      parabenFree,
      oxybenzoneFree,
      formaldehydeFree,
      sulfatesFree,
      fdcFree,
      minPrice,
      maxPrice,
      sortBy = 'newest',
      search
    } = options;
    
    const offset = (page - 1) * limit;
    
    // Build the where clause
    let whereConditions = [];
    
    if (category && category.length > 0) {
      const categoryIds = category.map(id => parseInt(id));
      whereConditions.push(inArray(products.categoryId, categoryIds));
    }
    
    // Add all feature filters
    if (organic) {
      whereConditions.push(eq(products.organic, true));
    }
    
    if (bpaFree) {
      whereConditions.push(eq(products.bpaFree, true));
    }
    
    if (phthalateFree) {
      whereConditions.push(eq(products.phthalateFree, true));
    }
    
    if (parabenFree) {
      whereConditions.push(eq(products.parabenFree, true));
    }
    
    if (oxybenzoneFree) {
      whereConditions.push(eq(products.oxybenzoneFree, true));
    }
    
    if (formaldehydeFree) {
      whereConditions.push(eq(products.formaldehydeFree, true));
    }
    
    if (sulfatesFree) {
      whereConditions.push(eq(products.sulfatesFree, true));
    }
    
    if (fdcFree) {
      whereConditions.push(eq(products.fdcFree, true));
    }
    
    if (minPrice !== undefined) {
      whereConditions.push(products.price.gte(minPrice));
    }
    
    if (maxPrice !== undefined) {
      whereConditions.push(products.price.lte(maxPrice));
    }
    
    if (search) {
      whereConditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.description, `%${search}%`)
        )
      );
    }
    
    // Determine sort order
    let orderBy;
    switch (sortBy) {
      case 'price-asc':
        orderBy = asc(products.price);
        break;
      case 'price-desc':
        orderBy = desc(products.price);
        break;
      case 'newest':
        orderBy = desc(products.createdAt);
        break;
      default:
        orderBy = desc(products.createdAt);
    }
    
    // Combine into a single where clause if needed
    const whereClause = whereConditions.length > 0
      ? and(...whereConditions)
      : undefined;
    
    // Count total products for pagination
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(products)
      .where(whereClause as any);
    
    const count = Number(countResult[0]?.count || 0);
    
    // Get the products with category information
    const productList = await db
      .select()
      .from(products)
      .where(whereClause as any)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);
    
    // Get categories for all products
    const categoryIds = productList
      .map(product => product.categoryId)
      .filter(Boolean) as number[];
    
    const categoryList = categoryIds.length > 0
      ? await db
          .select()
          .from(categories)
          .where(inArray(categories.id, categoryIds))
      : [];
    
    // Combine products with their categories and process ingredients
    const enrichedProducts = productList.map(product => {
      const category = product.categoryId
        ? categoryList.find(cat => cat.id === product.categoryId)
        : null;
      
      // BUGFIX: Handle ingredients properly for listing
      let ingredients = [];
      if (product.ingredients) {
        try {
          // Check if it's already an array
          if (Array.isArray(product.ingredients)) {
            ingredients = product.ingredients;
          } else if (typeof product.ingredients === 'string') {
            // Try to parse the JSON string
            ingredients = JSON.parse(product.ingredients);
          } else {
            // Handle object representation 
            ingredients = JSON.parse(JSON.stringify(product.ingredients));
          }
        } catch (error) {
          console.warn('Error parsing ingredients in products list, using as string:', error);
          ingredients = [product.ingredients].filter(Boolean);
        }
      }
      
      return {
        ...product,
        ingredients,
        category: category || null
      } as unknown as Product;
    });
    
    return {
      products: enrichedProducts,
      total: Number(count)
    };
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.categoryId, categoryId));
  }

  async getFeaturedProducts(limit: number = 3): Promise<Product[]> {
    const productList = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt))
      .limit(limit);
    
    // Get categories for the products
    const categoryIds = productList
      .map(product => product.categoryId)
      .filter(Boolean) as number[];
    
    const categoryList = categoryIds.length > 0
      ? await db
          .select()
          .from(categories)
          .where(inArray(categories.id, categoryIds))
      : [];
    
    // Combine products with their categories and parse ingredients
    return productList.map(product => {
      const category = product.categoryId
        ? categoryList.find(cat => cat.id === product.categoryId)
        : null;
      
      // Handle ingredients the same way
      let ingredients = [];
      if (product.ingredients) {
        try {
          if (Array.isArray(product.ingredients)) {
            ingredients = product.ingredients;
          } else if (typeof product.ingredients === 'string') {
            ingredients = JSON.parse(product.ingredients);
          } else {
            ingredients = JSON.parse(JSON.stringify(product.ingredients));
          }
        } catch (error) {
          console.warn('Error parsing ingredients in featured products, using as string:', error);
          ingredients = [product.ingredients].filter(Boolean);
        }
      }
      
      return {
        ...product,
        ingredients,
        category: category || null
      } as unknown as Product;
    });
  }

  async getRelatedProducts(productId: number, limit: number = 4): Promise<Product[]> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));
    
    if (!product || !product.categoryId) {
      return this.getFeaturedProducts(limit);
    }
    
    const relatedProducts = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.categoryId, product.categoryId),
          products.id.notEq(productId)
        )
      )
      .limit(limit);
    
    // If we don't have enough related products, fill in with featured products
    if (relatedProducts.length < limit) {
      const additionalProducts = await db
        .select()
        .from(products)
        .where(
          and(
            products.id.notEq(productId),
            products.categoryId.notEq(product.categoryId)
          )
        )
        .orderBy(desc(products.createdAt))
        .limit(limit - relatedProducts.length);
      
      relatedProducts.push(...additionalProducts);
    }
    
    // Get categories for all products
    const categoryIds = relatedProducts
      .map(product => product.categoryId)
      .filter(Boolean) as number[];
    
    const categoryList = categoryIds.length > 0
      ? await db
          .select()
          .from(categories)
          .where(inArray(categories.id, categoryIds))
      : [];
    
    // Combine products with their categories and parse ingredients
    return relatedProducts.map(product => {
      const category = product.categoryId
        ? categoryList.find(cat => cat.id === product.categoryId)
        : null;
      
      // Handle ingredients the same way
      let ingredients = [];
      if (product.ingredients) {
        try {
          if (Array.isArray(product.ingredients)) {
            ingredients = product.ingredients;
          } else if (typeof product.ingredients === 'string') {
            ingredients = JSON.parse(product.ingredients);
          } else {
            ingredients = JSON.parse(JSON.stringify(product.ingredients));
          }
        } catch (error) {
          console.warn('Error parsing ingredients in related products, using as string:', error);
          ingredients = [product.ingredients].filter(Boolean);
        }
      }
      
      return {
        ...product,
        ingredients,
        category: category || null
      } as unknown as Product;
    });
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    // Enhanced debug logging
    console.log('Storage: updateProduct - ID:', id);
    console.log('Storage: updateProduct - Product data:', JSON.stringify(product, null, 2));
    
    // Log all boolean features specifically
    console.log('Storage: Feature flags debug:');
    console.log('- organic:', product.organic, typeof product.organic);
    console.log('- bpaFree:', product.bpaFree, typeof product.bpaFree);
    console.log('- phthalateFree:', product.phthalateFree, typeof product.phthalateFree);
    console.log('- parabenFree:', product.parabenFree, typeof product.parabenFree);
    console.log('- oxybenzoneFree:', product.oxybenzoneFree, typeof product.oxybenzoneFree);
    console.log('- formaldehydeFree:', product.formaldehydeFree, typeof product.formaldehydeFree);
    console.log('- sulfatesFree:', product.sulfatesFree, typeof product.sulfatesFree);
    console.log('- fdcFree:', product.fdcFree, typeof product.fdcFree);
    
    // Explicitly ensure categoryId is a number if present
    const updateData: Partial<InsertProduct> = { ...product };
    if (updateData.categoryId !== undefined) {
      // Force conversion to number if it's coming in as a string
      const numCategoryId = typeof updateData.categoryId === 'string' 
        ? parseInt(updateData.categoryId) 
        : updateData.categoryId;
      
      console.log('Storage: ensuring categoryId is a number:', numCategoryId);
      updateData.categoryId = numCategoryId;
    }
    
    // Check ingredient handling
    if (updateData.ingredients) {
      console.log('Storage: ingredients type before update:', 
        typeof updateData.ingredients, 
        Array.isArray(updateData.ingredients) ? 'is array' : 'not array'
      );
    }
    
    // Perform update
    try {
      const [updatedProduct] = await db
        .update(products)
        .set(updateData)
        .where(eq(products.id, id))
        .returning();
      
      console.log('Storage: updateProduct - Result:', updatedProduct);
      return updatedProduct;
    } catch (error) {
      console.error('Storage: Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(id: number): Promise<boolean> {
    // First delete any associated vendors
    await db
      .delete(vendors)
      .where(eq(vendors.productId, id));
    
    // Then delete the product
    const result = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug));
    
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    // Update products that use this category
    await db
      .update(products)
      .set({ categoryId: null })
      .where(eq(products.categoryId, id));
    
    // Delete category from blog post associations
    await db
      .delete(blogPostsToCategories)
      .where(eq(blogPostsToCategories.categoryId, id));
    
    // Delete the category
    const result = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Vendor methods
  async getVendorsByProductId(productId: number): Promise<Vendor[]> {
    return await db
      .select()
      .from(vendors)
      .where(eq(vendors.productId, productId));
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [newVendor] = await db
      .insert(vendors)
      .values(vendor)
      .returning();
    
    return newVendor;
  }

  async updateVendor(id: number, vendor: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const [updatedVendor] = await db
      .update(vendors)
      .set(vendor)
      .where(eq(vendors.id, id))
      .returning();
    
    return updatedVendor;
  }

  async deleteVendor(id: number): Promise<boolean> {
    const result = await db
      .delete(vendors)
      .where(eq(vendors.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Blog methods
  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug));
    
    if (!post) return undefined;
    
    // Get author info
    const [author] = await db
      .select()
      .from(users)
      .where(eq(users.id, post.authorId));
    
    // Get categories
    const categories = await this.getPostCategories(post.id);
    
    return {
      ...post,
      author,
      categories
    } as unknown as BlogPost;
  }

  async getBlogPostById(id: number): Promise<BlogPost | undefined> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id));
    
    if (!post) return undefined;
    
    // Get author info
    const [author] = await db
      .select()
      .from(users)
      .where(eq(users.id, post.authorId));
    
    // Get categories
    const categories = await this.getPostCategories(post.id);
    
    return {
      ...post,
      author,
      categories
    } as unknown as BlogPost;
  }

  async getBlogPosts(options: {
    page?: number;
    limit?: number;
    category?: string;
    published?: boolean;
    sortBy?: string;
    search?: string;
  } = {}): Promise<{ posts: BlogPost[], total: number }> {
    const {
      page = 1,
      limit = 6,
      category,
      published,
      sortBy = 'newest',
      search
    } = options;
    
    const offset = (page - 1) * limit;
    
    // Build the where clause
    let whereConditions = [];
    
    // Only filter by published if it's explicitly defined
    if (published !== undefined) {
      console.log('[STORAGE] Filtering blog posts by published:', published);
      whereConditions.push(eq(blogPosts.published, published));
    }
    
    if (search) {
      whereConditions.push(
        or(
          like(blogPosts.title, `%${search}%`),
          like(blogPosts.content, `%${search}%`),
          like(blogPosts.excerpt, `%${search}%`)
        )
      );
    }
    
    // Determine sort order
    let orderBy;
    switch (sortBy) {
      case 'oldest':
        orderBy = asc(blogPosts.publishedAt || blogPosts.createdAt);
        break;
      case 'newest':
      default:
        orderBy = desc(blogPosts.publishedAt || blogPosts.createdAt);
    }
    
    // Combine into a single where clause if needed
    const whereClause = whereConditions.length > 0
      ? and(...whereConditions)
      : undefined;
    
    // Handle category filter separately if needed
    let filteredPostIds: number[] = [];
    if (category) {
      // Get post IDs that have this category
      const categoryId = parseInt(category);
      const postCategories = await db
        .select()
        .from(blogPostsToCategories)
        .where(eq(blogPostsToCategories.categoryId, categoryId));
      
      filteredPostIds = postCategories.map(pc => pc.blogPostId);
      
      if (filteredPostIds.length === 0) {
        return { posts: [], total: 0 };
      }
      
      whereConditions.push(inArray(blogPosts.id, filteredPostIds));
    }
    
    // Count total posts for pagination
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(blogPosts)
      .where(whereClause as any);
    
    const count = Number(countResult[0]?.count || 0);
    
    // Get the posts
    const postList = await db
      .select()
      .from(blogPosts)
      .where(whereClause as any)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);
    
    // Get author information
    const authorIds = postList.map(post => post.authorId);
    const authors = await db
      .select()
      .from(users)
      .where(inArray(users.id, authorIds));
    
    // Get categories for all posts
    const postIds = postList.map(post => post.id);
    const postCategoryRelations = await db
      .select()
      .from(blogPostsToCategories)
      .where(inArray(blogPostsToCategories.blogPostId, postIds));
    
    const categoryIds = postCategoryRelations.map(pcr => pcr.categoryId);
    const categoryList = await db
      .select()
      .from(categories)
      .where(inArray(categories.id, categoryIds));
    
    // Combine posts with their authors and categories
    const enrichedPosts = postList.map(post => {
      const author = authors.find(a => a.id === post.authorId);
      const postCategories = postCategoryRelations
        .filter(pcr => pcr.blogPostId === post.id)
        .map(pcr => {
          return categoryList.find(c => c.id === pcr.categoryId);
        })
        .filter(Boolean) as Category[];
      
      return {
        ...post,
        author,
        categories: postCategories
      } as unknown as BlogPost;
    });
    
    return {
      posts: enrichedPosts,
      total: Number(count)
    };
  }

  async getFeaturedBlogPost(): Promise<BlogPost | undefined> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.publishedAt || blogPosts.createdAt))
      .limit(1);
    
    if (!post) return undefined;
    
    // Get author info
    const [author] = await db
      .select()
      .from(users)
      .where(eq(users.id, post.authorId));
    
    // Get categories
    const categories = await this.getPostCategories(post.id);
    
    return {
      ...post,
      author,
      categories
    } as unknown as BlogPost;
  }

  async getRelatedBlogPosts(postId: number, limit: number = 3): Promise<BlogPost[]> {
    // Get categories for the given post
    const postCategories = await db
      .select()
      .from(blogPostsToCategories)
      .where(eq(blogPostsToCategories.blogPostId, postId));
    
    if (postCategories.length === 0) {
      // If no categories, return recent posts
      return this.getBlogPosts({ limit }).then(result => result.posts);
    }
    
    const categoryIds = postCategories.map(pc => pc.categoryId);
    
    // Find posts that share categories but exclude the original post
    const relatedPostIds = await db
      .select({ blogPostId: blogPostsToCategories.blogPostId })
      .from(blogPostsToCategories)
      .where(
        and(
          inArray(blogPostsToCategories.categoryId, categoryIds),
          blogPostsToCategories.blogPostId.notEq(postId)
        )
      )
      .groupBy(blogPostsToCategories.blogPostId)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);
    
    if (relatedPostIds.length === 0) {
      // If no related posts, return recent posts
      return this.getBlogPosts({ limit }).then(result => result.posts);
    }
    
    const ids = relatedPostIds.map(r => r.blogPostId);
    
    // Get the related posts
    const postList = await db
      .select()
      .from(blogPosts)
      .where(
        and(
          inArray(blogPosts.id, ids),
          eq(blogPosts.published, true)
        )
      );
    
    // Get author information
    const authorIds = postList.map(post => post.authorId);
    const authors = await db
      .select()
      .from(users)
      .where(inArray(users.id, authorIds));
    
    // Get categories for all posts
    const postCategoryRelations = await db
      .select()
      .from(blogPostsToCategories)
      .where(inArray(blogPostsToCategories.blogPostId, ids));
    
    const allCategoryIds = postCategoryRelations.map(pcr => pcr.categoryId);
    const categoryList = await db
      .select()
      .from(categories)
      .where(inArray(categories.id, allCategoryIds));
    
    // Combine posts with their authors and categories
    return postList.map(post => {
      const author = authors.find(a => a.id === post.authorId);
      const postCategories = postCategoryRelations
        .filter(pcr => pcr.blogPostId === post.id)
        .map(pcr => {
          return categoryList.find(c => c.id === pcr.categoryId);
        })
        .filter(Boolean) as Category[];
      
      return {
        ...post,
        author,
        categories: postCategories
      } as unknown as BlogPost;
    });
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [newPost] = await db
      .insert(blogPosts)
      .values(post)
      .returning();
    
    return newPost;
  }

  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const [updatedPost] = await db
      .update(blogPosts)
      .set(post)
      .where(eq(blogPosts.id, id))
      .returning();
    
    return updatedPost;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    // First delete category associations
    await db
      .delete(blogPostsToCategories)
      .where(eq(blogPostsToCategories.blogPostId, id));
    
    // Then delete the post
    const result = await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Blog category methods
  async getBlogCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async addPostToCategory(postId: number, categoryId: number): Promise<void> {
    await db
      .insert(blogPostsToCategories)
      .values({ blogPostId: postId, categoryId })
      .onConflictDoNothing();
  }

  async removePostFromCategory(postId: number, categoryId: number): Promise<void> {
    await db
      .delete(blogPostsToCategories)
      .where(
        and(
          eq(blogPostsToCategories.blogPostId, postId),
          eq(blogPostsToCategories.categoryId, categoryId)
        )
      );
  }

  async getPostCategories(postId: number): Promise<Category[]> {
    const postCategories = await db
      .select()
      .from(blogPostsToCategories)
      .where(eq(blogPostsToCategories.blogPostId, postId));
    
    if (postCategories.length === 0) {
      return [];
    }
    
    const categoryIds = postCategories.map(pc => pc.categoryId);
    
    return await db
      .select()
      .from(categories)
      .where(inArray(categories.id, categoryIds));
  }
}

export const storage = new DatabaseStorage();
