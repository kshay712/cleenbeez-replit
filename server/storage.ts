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
import { eq, like, or, inArray, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Product methods
  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    
    if (!product) return undefined;
    
    // Get category info
    if (product.categoryId) {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, product.categoryId));
      
      return {
        ...product,
        category
      } as unknown as Product;
    }
    
    return product;
  }

  async getProducts(options: {
    page?: number;
    limit?: number;
    category?: string[];
    organic?: boolean;
    bpaFree?: boolean;
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
    
    if (organic) {
      whereConditions.push(eq(products.organic, true));
    }
    
    if (bpaFree) {
      whereConditions.push(eq(products.bpaFree, true));
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
    const [{ count }] = await db
      .select({ count: db.fn.count() })
      .from(products)
      .where(whereClause as any);
    
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
    
    // Combine products with their categories
    const enrichedProducts = productList.map(product => {
      const category = product.categoryId
        ? categoryList.find(cat => cat.id === product.categoryId)
        : null;
      
      return {
        ...product,
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
    
    // Combine products with their categories
    return productList.map(product => {
      const category = product.categoryId
        ? categoryList.find(cat => cat.id === product.categoryId)
        : null;
      
      return {
        ...product,
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
    
    // Combine products with their categories
    return relatedProducts.map(product => {
      const category = product.categoryId
        ? categoryList.find(cat => cat.id === product.categoryId)
        : null;
      
      return {
        ...product,
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
    const [updatedProduct] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    
    return updatedProduct;
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
      published = true,
      sortBy = 'newest',
      search
    } = options;
    
    const offset = (page - 1) * limit;
    
    // Build the where clause
    let whereConditions = [];
    
    if (published !== undefined) {
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
    const [{ count }] = await db
      .select({ count: db.fn.count() })
      .from(blogPosts)
      .where(whereClause as any);
    
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
      .orderBy(desc(db.fn.count()))
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
