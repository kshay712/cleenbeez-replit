import { Request, Response } from "express";
import { storage } from "../storage";
import { sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { requireAdmin, requireEditor } from "./auth";
import { db } from "../db";
import { blogPosts } from "@shared/schema";

// Configure multer storage
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "blog");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = `${uuidv4()}${ext}`;
      cb(null, filename);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // More permissive image type checking
    const allowedTypes = [
      "image/jpeg", "image/jpg", "image/png", "image/webp", 
      "image/gif", "image/svg+xml", "image/bmp"
    ];
    
    console.log("[DEBUG] File upload - mimetype:", file.mimetype, ", originalname:", file.originalname);
    
    // More lenient checking - accept image/* types or specific allowed types
    if (file.mimetype.startsWith('image/') || allowedTypes.includes(file.mimetype)) {
      console.log("[DEBUG] File upload accepted:", file.originalname);
      cb(null, true);
    } else {
      console.error("[ERROR] Invalid file type rejected:", file.mimetype);
      cb(new Error("Invalid file type. Only image files are allowed."));
    }
  }
});

export const blog = {
  // Fix published dates for existing published posts
  fixPublishedDates: [requireAdmin, async (req: Request, res: Response) => {
    try {
      console.log("[DEBUG] Fixing published dates for published posts with null publishedAt");
      
      // Query to get all published posts with null publishedAt values
      const postsToFix = await db
        .select()
        .from(blogPosts)
        .where(sql`${blogPosts.published} = true AND ${blogPosts.publishedAt} IS NULL`);
      
      console.log(`[DEBUG] Found ${postsToFix.length} posts that need updating`);
      
      // Update each post's publishedAt value to its createdAt value
      for (const post of postsToFix) {
        await db
          .update(blogPosts)
          .set({ publishedAt: post.createdAt })
          .where(sql`${blogPosts.id} = ${post.id}`);
        
        console.log(`[DEBUG] Updated post ID ${post.id} - '${post.title}'`);
      }
      
      res.status(200).json({ 
        success: true, 
        message: `Fixed publishedAt dates for ${postsToFix.length} posts`,
        posts: postsToFix
      });
    } catch (error) {
      console.error("[ERROR] Error fixing published dates:", error);
      res.status(500).json({ error: "Failed to fix published dates" });
    }
  }],
  
  // Get blog posts by category
  getPostsByCategory: async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    try {
      // The route expects a categoryId parameter, not a slug
      console.log("[DEBUG] Looking up posts for category ID:", categoryId);
      
      // Check if categoryId is a valid number
      const categoryIdNum = parseInt(categoryId);
      if (isNaN(categoryIdNum)) {
        console.error("[ERROR] Invalid category ID:", categoryId);
        return res.status(400).json({ error: "Invalid category ID" });
      }
      
      const category = await storage.getCategoryById(categoryIdNum);
      if (!category) {
        console.error("[ERROR] Category not found with ID:", categoryId);
        return res.status(404).json({ error: "Category not found" });
      }
      
      const { posts, total } = await storage.getBlogPosts({
        page,
        limit,
        category: category.id.toString(),
        published: true,
        sortBy: "publishedAt"
      });
      
      // Get categories for each post
      for (const post of posts) {
        post.categories = await storage.getPostCategories(post.id);
      }
      
      res.json({
        posts,
        total,
        category,
        currentPage: page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error("Error fetching posts by category:", error);
      res.status(500).json({ error: "Failed to fetch posts by category" });
    }
  },
  
  // Get all blog posts with pagination
  getPosts: async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const search = req.query.search as string;
    
    // Default to showing published posts only for public requests
    // This means published=true by default, but can be overridden with explicit query param
    let published: boolean | undefined = true;
    
    if (req.query.published !== undefined) {
      published = req.query.published === "true" || req.query.published === "1";
      console.log("[BLOG] Explicit published param:", req.query.published, "-> set to:", published);
    }
    
    try {
      console.log("[BLOG] Fetching blog posts with options:", {
        page,
        limit,
        category,
        sortBy: 'publishedAt',
        search,
        published
      });
      
      const { posts, total } = await storage.getBlogPosts({
        page,
        limit,
        category,
        sortBy: "publishedAt",
        search,
        published
      });
      
      // Get categories for each post
      for (const post of posts) {
        post.categories = await storage.getPostCategories(post.id);
        
        // If author info is needed
        if (post.authorId) {
          post.author = await storage.getUser(post.authorId);
        }
      }
      
      res.json({
        posts,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  },
  
  // Get a single blog post by slug
  getPostBySlug: async (req: Request, res: Response) => {
    const { slug } = req.params;
    
    try {
      const post = await storage.getBlogPostBySlug(slug);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      // Get post categories
      post.categories = await storage.getPostCategories(post.id);
      
      // Get author details if available
      if (post.authorId) {
        post.author = await storage.getUser(post.authorId);
      }
      
      // Get related posts if requested
      if (req.query.includeRelated === "true") {
        post.relatedPosts = await storage.getRelatedBlogPosts(post.id, 3);
        
        // Get categories for related posts
        for (const relatedPost of post.relatedPosts) {
          relatedPost.categories = await storage.getPostCategories(relatedPost.id);
        }
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching post by slug:", error);
      res.status(500).json({ error: "Failed to fetch post" });
    }
  },
  
  // Get the currently featured blog post
  getFeaturedPost: async (req: Request, res: Response) => {
    try {
      const featuredPost = await storage.getFeaturedBlogPost();
      if (!featuredPost) {
        return res.status(404).json({ error: "No featured post found" });
      }
      
      // Get post categories
      featuredPost.categories = await storage.getPostCategories(featuredPost.id);
      
      // Get author details if available
      if (featuredPost.authorId) {
        featuredPost.author = await storage.getUser(featuredPost.authorId);
      }
      
      res.json(featuredPost);
    } catch (error) {
      console.error("Error fetching featured post:", error);
      res.status(500).json({ error: "Failed to fetch featured post" });
    }
  },
  
  // Set a post as the featured post
  setFeaturedPost: [requireEditor, async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      const success = await storage.setFeaturedBlogPost(parseInt(id));
      if (success) {
        res.json({ success: true, message: "Featured post updated successfully" });
      } else {
        res.status(404).json({ error: "Post not found" });
      }
    } catch (error) {
      console.error("Error setting featured post:", error);
      res.status(500).json({ error: "Failed to set featured post" });
    }
  }],
  
  // Get related blog posts
  getRelatedPosts: async (req: Request, res: Response) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 3;
    
    try {
      const relatedPosts = await storage.getRelatedBlogPosts(parseInt(id), limit);
      
      // Get categories for each post
      for (const post of relatedPosts) {
        post.categories = await storage.getPostCategories(post.id);
      }
      
      res.json(relatedPosts);
    } catch (error) {
      console.error("Error fetching related posts:", error);
      res.status(500).json({ error: "Failed to fetch related posts" });
    }
  },
  
  // Get all blog categories
  getCategories: async (req: Request, res: Response) => {
    try {
      const categories = await storage.getBlogCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching blog categories:", error);
      res.status(500).json({ error: "Failed to fetch blog categories" });
    }
  },
  
  // Admin: Get all blog posts with additional details
  getAdminPosts: [requireEditor, async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    
    try {
      // For admin, get all posts regardless of published status
      const { posts, total } = await storage.getBlogPosts({
        page,
        limit,
        search,
        // Published status is undefined to get all posts
        published: undefined,
        sortBy: "createdAt"
      });
      
      // Get categories and author for each post
      for (const post of posts) {
        post.categories = await storage.getPostCategories(post.id);
        
        if (post.authorId) {
          post.author = await storage.getUser(post.authorId);
        }
      }
      
      res.json({
        posts,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error("Error fetching admin posts:", error);
      res.status(500).json({ error: "Failed to fetch admin posts" });
    }
  }],
  
  // Create a new blog post
  createPost: [requireEditor, upload.single('featuredImage'), async (req: Request, res: Response) => {
    try {
      // Ensure the postData is available and properly parsed
      if (!req.body.postData) {
        console.error("[ERROR] Missing postData in request body");
        return res.status(400).json({ error: "Missing post data" });
      }
      
      // Handle possible JSON parsing errors with try/catch
      let postData;
      try {
        postData = JSON.parse(req.body.postData);
        console.log("[DEBUG] Successfully parsed postData");
      } catch (error) {
        console.error("[ERROR] Failed to parse postData JSON:", error, "Raw data:", req.body.postData);
        return res.status(400).json({ error: "Invalid post data format" });
      }
      
      // Set a default featured image if none was uploaded
      if (req.file) {
        console.log("[DEBUG] File uploaded:", req.file.filename);
        postData.featuredImage = `/uploads/blog/${req.file.filename}`;
      } else {
        console.log("[DEBUG] No file uploaded, using default image");
        postData.featuredImage = `/uploads/blog/default-blog-image.jpg`;
      }
      
      // Set author ID from authenticated user
      postData.authorId = req.user?.id;
      
      // Set publishedAt date if post is published
      console.log("[DEBUG] Post published status:", postData.published);
      if (postData.published) {
        postData.publishedAt = new Date();
        console.log("[DEBUG] Setting publishedAt for new post:", new Date());
      }
      
      // Extract categories before creating the post
      const categories = postData.categories || [];
      delete postData.categories;
      
      // Create the blog post
      const post = await storage.createBlogPost(postData);
      
      // Add categories if provided
      if (categories.length > 0) {
        for (const categoryId of categories) {
          await storage.addPostToCategory(post.id, parseInt(categoryId));
        }
      }
      
      // Get the categories for the response
      post.categories = await storage.getPostCategories(post.id);
      
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating blog post:", error);
      res.status(500).json({ error: "Failed to create blog post" });
    }
  }],
  
  // Update an existing blog post
  updatePost: [requireEditor, upload.single('featuredImage'), async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      // Get the existing post
      const existingPost = await storage.getBlogPostById(parseInt(id));
      if (!existingPost) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      // Ensure the postData is available and properly parsed
      if (!req.body.postData) {
        console.error("[ERROR] Missing postData in request body for post update");
        return res.status(400).json({ error: "Missing post data" });
      }
      
      // Handle possible JSON parsing errors with try/catch
      let postData;
      try {
        postData = JSON.parse(req.body.postData);
        console.log("[DEBUG] Successfully parsed update postData");
      } catch (error) {
        console.error("[ERROR] Failed to parse update postData JSON:", error, "Raw data:", req.body.postData);
        return res.status(400).json({ error: "Invalid post data format" });
      }
      
      // Set the featured image path if file was uploaded
      if (req.file) {
        // Remove old image if it exists and is not the default
        if (existingPost.featuredImage && !existingPost.featuredImage.includes('default')) {
          const oldImagePath = path.join(process.cwd(), 'public', existingPost.featuredImage);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        
        postData.featuredImage = `/uploads/blog/${req.file.filename}`;
      }
      
      // Check if published status changed from false to true
      if (!existingPost.published && postData.published && !existingPost.publishedAt) {
        postData.publishedAt = new Date();
      }
      
      // Extract categories before updating the post
      const categories = postData.categories || [];
      delete postData.categories;
      
      // Update the blog post
      const post = await storage.updateBlogPost(parseInt(id), postData);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      // Update categories if provided
      if (categories) {
        // Get existing categories
        const existingCategories = await storage.getPostCategories(post.id);
        const existingCategoryIds = existingCategories.map(cat => cat.id.toString());
        
        // Remove categories that are no longer selected
        for (const existingId of existingCategoryIds) {
          if (!categories.includes(existingId)) {
            await storage.removePostFromCategory(post.id, parseInt(existingId));
          }
        }
        
        // Add new categories
        for (const categoryId of categories) {
          if (!existingCategoryIds.includes(categoryId)) {
            await storage.addPostToCategory(post.id, parseInt(categoryId));
          }
        }
      }
      
      // Get the updated categories for the response
      post.categories = await storage.getPostCategories(post.id);
      
      res.json(post);
    } catch (error) {
      console.error("Error updating blog post:", error);
      res.status(500).json({ error: "Failed to update blog post" });
    }
  }],
  
  // Delete a blog post
  deletePost: [requireEditor, async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      // Get the post to check for featured image
      const post = await storage.getBlogPostById(parseInt(id));
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      // Delete featured image if it exists and is not a default image
      if (post.featuredImage && !post.featuredImage.includes('default')) {
        const imagePath = path.join(process.cwd(), 'public', post.featuredImage);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      // Delete the post
      const success = await storage.deleteBlogPost(parseInt(id));
      if (success) {
        res.json({ success: true, message: "Blog post deleted successfully" });
      } else {
        res.status(404).json({ error: "Post not found" });
      }
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ error: "Failed to delete blog post" });
    }
  }],
  
  // Create a new blog category
  createCategory: [requireEditor, async (req: Request, res: Response) => {
    try {
      const category = await storage.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating blog category:", error);
      res.status(500).json({ error: "Failed to create blog category" });
    }
  }],
  
  // Update an existing blog category
  updateCategory: [requireEditor, async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      const category = await storage.updateCategory(parseInt(id), req.body);
      if (category) {
        res.json(category);
      } else {
        res.status(404).json({ error: "Category not found" });
      }
    } catch (error) {
      console.error("Error updating blog category:", error);
      res.status(500).json({ error: "Failed to update blog category" });
    }
  }],
  
  // Delete a blog category
  deleteCategory: [requireEditor, async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      const success = await storage.deleteCategory(parseInt(id));
      if (success) {
        res.json({ success: true, message: "Category deleted successfully" });
      } else {
        res.status(404).json({ error: "Category not found" });
      }
    } catch (error) {
      console.error("Error deleting blog category:", error);
      res.status(500).json({ error: "Failed to delete blog category" });
    }
  }]
};