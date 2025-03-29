import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertBlogPostSchema, insertCategorySchema } from "@shared/schema";
import { requireAdmin, requireEditor, requireAuth } from "./auth";

// Validation schemas
const blogPostQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  category: z.string().optional(),
  published: z.coerce.boolean().optional(),
  sortBy: z.string().optional(),
  search: z.string().optional(),
});

// Blog Controller
export const blog = {
  // Get all blog posts with filtering
  getPosts: async (req: Request, res: Response) => {
    try {
      const params = blogPostQuerySchema.parse(req.query);
      
      const result = await storage.getBlogPosts(params);
      
      // Calculate pagination info
      const page = params.page || 1;
      const limit = params.limit || 6;
      const totalPages = Math.ceil(result.total / limit);
      
      res.status(200).json({
        posts: result.posts,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: result.total,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  },
  
  // Get single blog post by slug
  getPostBySlug: async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.status(200).json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  },
  
  // Get featured blog post
  getFeaturedPost: async (req: Request, res: Response) => {
    try {
      const featuredPost = await storage.getFeaturedBlogPost();
      
      if (!featuredPost) {
        return res.status(404).json({ message: "No featured post found" });
      }
      
      res.status(200).json(featuredPost);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured post" });
    }
  },
  
  // Get related blog posts
  getRelatedPosts: async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      
      const post = await storage.getBlogPostBySlug(slug);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      const relatedPosts = await storage.getRelatedBlogPosts(post.id, limit);
      res.status(200).json(relatedPosts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch related posts" });
    }
  },
  
  // Get all blog categories
  getCategories: async (req: Request, res: Response) => {
    try {
      const categories = await storage.getBlogCategories();
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog categories" });
    }
  },
  
  // Get all blog posts for admin
  getAdminPosts: [requireEditor, async (req: Request, res: Response) => {
    try {
      const { search } = req.query;
      const queryParams = {
        published: undefined, // Include both published and draft posts
        search: search ? String(search) : undefined
      };
      
      const result = await storage.getBlogPosts(queryParams);
      res.status(200).json(result.posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts for admin" });
    }
  }],
  
  // Create a new blog post
  createPost: [requireEditor, async (req: Request, res: Response) => {
    try {
      // Parse and validate body
      const postData = insertBlogPostSchema.parse(req.body);
      const categories = req.body.categories || [];
      
      // Check if the slug is unique
      const existingPost = await storage.getBlogPostBySlug(postData.slug);
      if (existingPost) {
        return res.status(409).json({ message: "Blog post with this slug already exists" });
      }
      
      // If the post is published, set publishedAt timestamp
      if (postData.published) {
        postData.publishedAt = new Date();
      }
      
      // Create the blog post
      const newPost = await storage.createBlogPost(postData);
      
      // Associate with categories
      for (const categoryId of categories) {
        await storage.addPostToCategory(newPost.id, parseInt(categoryId));
      }
      
      // Get the complete post with categories
      const completePost = await storage.getBlogPostById(newPost.id);
      
      res.status(201).json(completePost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid blog post data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create blog post" });
    }
  }],
  
  // Update a blog post
  updatePost: [requireEditor, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const postData = insertBlogPostSchema.partial().parse(req.body);
      const categories = req.body.categories;
      
      // If the post is being published for the first time, set publishedAt
      if (postData.published) {
        const existingPost = await storage.getBlogPostById(id);
        if (existingPost && !existingPost.published && !existingPost.publishedAt) {
          postData.publishedAt = new Date();
        }
      }
      
      // Update the blog post
      const updatedPost = await storage.updateBlogPost(id, postData);
      
      if (!updatedPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      // Update categories if provided
      if (categories) {
        // Get existing categories
        const existingCategories = await storage.getPostCategories(id);
        const existingCategoryIds = existingCategories.map(c => c.id);
        
        // Convert string IDs to numbers
        const newCategoryIds = categories.map((id: string) => parseInt(id));
        
        // Remove categories that are no longer associated
        for (const existingId of existingCategoryIds) {
          if (!newCategoryIds.includes(existingId)) {
            await storage.removePostFromCategory(id, existingId);
          }
        }
        
        // Add new categories
        for (const newId of newCategoryIds) {
          if (!existingCategoryIds.includes(newId)) {
            await storage.addPostToCategory(id, newId);
          }
        }
      }
      
      // Get the complete updated post with categories
      const completePost = await storage.getBlogPostById(id);
      
      res.status(200).json(completePost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid blog post data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update blog post" });
    }
  }],
  
  // Delete a blog post
  deletePost: [requireEditor, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteBlogPost(id);
      
      if (!result) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.status(200).json({ message: "Blog post deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  }],
  
  // Create a new blog category
  createCategory: [requireEditor, async (req: Request, res: Response) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      
      // Check if category with same slug already exists
      const existingCategory = await storage.getCategoryBySlug(categoryData.slug);
      if (existingCategory) {
        return res.status(409).json({ message: "Category with this slug already exists" });
      }
      
      const newCategory = await storage.createCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  }],
  
  // Update a blog category
  updateCategory: [requireEditor, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      
      // If slug is being updated, check uniqueness
      if (categoryData.slug) {
        const existingCategory = await storage.getCategoryBySlug(categoryData.slug);
        if (existingCategory && existingCategory.id !== id) {
          return res.status(409).json({ message: "Category with this slug already exists" });
        }
      }
      
      const updatedCategory = await storage.updateCategory(id, categoryData);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(200).json(updatedCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update category" });
    }
  }],
  
  // Delete a blog category
  deleteCategory: [requireEditor, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteCategory(id);
      
      if (!result) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  }],
};
