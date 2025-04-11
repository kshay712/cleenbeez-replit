import { Request, Response } from 'express';
import { storage } from '../storage';
import { upload, getFileUrl } from '../middleware/multer';
import { insertBlogPostSchema, insertCategorySchema, blogPosts, blogPostsToCategories, users, categories } from '@shared/schema';
import { requireAuth, requireEditor } from './auth';
import { db } from '../db';
import { and, eq, inArray, desc, sql } from 'drizzle-orm';

export const blog = {
  // First-principles approach: Direct category posts endpoint
  getPostsByCategory: async (req: Request, res: Response) => {
    const categoryId = req.params.categoryId;
    const { page = 1, limit = 10 } = req.query;
    
    console.log('[BLOG] Direct fetch of posts for category ID:', categoryId);
    
    if (!categoryId || isNaN(parseInt(categoryId))) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }
    
    try {
      // Find posts in the specific category
      const postCategories = await db
        .select()
        .from(blogPostsToCategories)
        .where(eq(blogPostsToCategories.categoryId, parseInt(categoryId)));
      
      if (postCategories.length === 0) {
        console.log('[BLOG] No posts found for category ID:', categoryId);
        return res.json({ posts: [], total: 0 });
      }
      
      const postIds = postCategories.map(pc => pc.blogPostId);
      console.log('[BLOG] Found post IDs in category:', postIds);
      
      // Get the actual posts with only published ones
      const posts = await db
        .select()
        .from(blogPosts)
        .where(
          and(
            inArray(blogPosts.id, postIds),
            eq(blogPosts.published, true)
          )
        )
        .orderBy(desc(blogPosts.publishedAt))
        .limit(parseInt(limit as string))
        .offset((parseInt(page as string) - 1) * parseInt(limit as string));
      
      if (posts.length === 0) {
        console.log('[BLOG] No published posts found for category ID:', categoryId);
        return res.json({ posts: [], total: 0 });
      }
      
      // Count total for pagination
      const countResult = await db
        .select({ count: sql`count(*)` })
        .from(blogPosts)
        .where(
          and(
            inArray(blogPosts.id, postIds),
            eq(blogPosts.published, true)
          )
        );
      
      const count = Number(countResult[0]?.count || 0);
      
      // Get author information
      const authorIds = posts.map(post => post.authorId);
      const authors = await db
        .select()
        .from(users)
        .where(inArray(users.id, authorIds));
      
      // Get all categories for these posts
      const allPostIds = posts.map(post => post.id);
      const allPostCategories = await db
        .select()
        .from(blogPostsToCategories)
        .where(inArray(blogPostsToCategories.blogPostId, allPostIds));
      
      const categoryIds = allPostCategories.map(pc => pc.categoryId);
      const categoriesList = await db
        .select()
        .from(categories)
        .where(inArray(categories.id, categoryIds));
      
      // Build complete posts with author and categories
      const enrichedPosts = posts.map(post => {
        const author = authors.find(a => a.id === post.authorId);
        const postCategories = allPostCategories
          .filter(pc => pc.blogPostId === post.id)
          .map(pc => {
            return categoriesList.find(c => c.id === pc.categoryId);
          })
          .filter(Boolean);
        
        return {
          ...post,
          author,
          categories: postCategories
        };
      });
      
      console.log('[BLOG] Returning', enrichedPosts.length, 'posts for category ID:', categoryId);
      
      res.json({
        posts: enrichedPosts,
        total: count
      });
    } catch (error) {
      console.error('Error fetching posts by category:', error);
      res.status(500).json({ error: 'Failed to fetch posts by category' });
    }
  },
  // Public endpoints
  getPosts: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, category, published, sortBy = 'publishedAt', search } = req.query;
      
      const options: any = {
        page: Number(page),
        limit: Number(limit),
        category: category as string,
        sortBy: sortBy as string,
        search: search as string
      };
      
      // Only filter by published status if explicitly specified
      // This ensures all public queries default to published=true
      if (published !== undefined) {
        options.published = published === 'true' || published === true;
      } else {
        // Default to only published posts for public queries
        options.published = true;
      }
      
      console.log('[BLOG] Fetching blog posts with options:', options);
      const result = await storage.getBlogPosts(options);
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching blog posts:', error);
      res.status(500).json({ message: 'Failed to fetch blog posts' });
    }
  },

  getPostBySlug: async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ message: 'Blog post not found' });
      }
      
      res.json(post);
    } catch (error: any) {
      console.error('Error fetching blog post:', error);
      res.status(500).json({ message: 'Failed to fetch blog post' });
    }
  },

  getFeaturedPost: async (req: Request, res: Response) => {
    try {
      const post = await storage.getFeaturedBlogPost();
      
      if (!post) {
        return res.status(404).json({ message: 'No featured blog post found' });
      }
      
      res.json(post);
    } catch (error: any) {
      console.error('Error fetching featured blog post:', error);
      res.status(500).json({ message: 'Failed to fetch featured blog post' });
    }
  },
  
  setFeaturedPost: [requireEditor, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'Invalid blog post ID' });
      }
      
      const post = await storage.getBlogPostById(parseInt(id));
      if (!post) {
        return res.status(404).json({ message: 'Blog post not found' });
      }
      
      const success = await storage.setFeaturedBlogPost(parseInt(id));
      
      if (success) {
        res.json({ message: 'Blog post set as featured successfully' });
      } else {
        res.status(500).json({ message: 'Failed to set blog post as featured' });
      }
    } catch (error: any) {
      console.error('Error setting featured blog post:', error);
      res.status(500).json({ message: 'Failed to set featured blog post' });
    }
  }],

  getRelatedPosts: async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const limit = req.query.limit ? Number(req.query.limit) : 3;
      
      const post = await storage.getBlogPostBySlug(slug);
      if (!post) {
        return res.status(404).json({ message: 'Blog post not found' });
      }
      
      const relatedPosts = await storage.getRelatedBlogPosts(post.id, limit);
      res.json(relatedPosts);
    } catch (error: any) {
      console.error('Error fetching related blog posts:', error);
      res.status(500).json({ message: 'Failed to fetch related blog posts' });
    }
  },

  getCategories: async (req: Request, res: Response) => {
    try {
      const categories = await storage.getBlogCategories();
      res.json(categories);
    } catch (error: any) {
      console.error('Error fetching blog categories:', error);
      res.status(500).json({ message: 'Failed to fetch blog categories' });
    }
  },

  // Admin endpoints
  getAdminPosts: [requireEditor, async (req: Request, res: Response) => {
    try {
      // Admin should see all posts, regardless of published status
      const result = await storage.getBlogPosts();
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching admin blog posts:', error);
      res.status(500).json({ message: 'Failed to fetch admin blog posts' });
    }
  }],

  createPost: [requireEditor, upload.single('featuredImage'), async (req: Request, res: Response) => {
    try {
      // Get user ID from authenticated user
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      let featuredImage = req.file ? getFileUrl(req.file.filename) : req.body.featuredImage;
      if (!featuredImage) {
        return res.status(400).json({ message: 'Featured image is required' });
      }
      
      const authorId = req.user.id;
      
      // Convert published string to boolean if it exists
      const published = req.body.published === 'true' 
        ? true 
        : req.body.published === 'false' 
          ? false 
          : req.body.published;
      
      const postData = { 
        ...req.body, 
        featuredImage, 
        authorId,
        published
      };
      
      // Parse and validate categories if provided
      let categories = [];
      if (req.body.categories) {
        try {
          categories = JSON.parse(req.body.categories);
        } catch (error) {
          return res.status(400).json({ message: 'Invalid categories format' });
        }
      }
      
      // Set publishedAt if the post is being published
      if (postData.published) {
        postData.publishedAt = new Date();
      }
      
      // Validate blog post data
      const validatedData = insertBlogPostSchema.parse(postData);
      const post = await storage.createBlogPost(validatedData);
      
      // Add categories if provided
      if (categories.length > 0) {
        // Convert all categoryIds to numbers for consistent comparison
        const categoryIds = categories.map(cat => Number(cat));
        
        console.log('Adding categories for new post:', {
          postId: post.id,
          categoryIds
        });
        
        for (const categoryId of categoryIds) {
          console.log(`Adding category ${categoryId} to new post ${post.id}`);
          await storage.addPostToCategory(post.id, Number(categoryId));
        }
      }
      
      res.status(201).json(post);
    } catch (error: any) {
      console.error('Error creating blog post:', error);
      res.status(400).json({ message: 'Failed to create blog post', error: error.message });
    }
  }],

  updatePost: [requireEditor, upload.single('featuredImage'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      let postData = { ...req.body };
      
      // Convert published string to boolean if it exists
      if (postData.published) {
        postData.published = postData.published === 'true' 
          ? true 
          : postData.published === 'false' 
            ? false 
            : postData.published;
      }
      
      // Handle image upload if provided
      if (req.file) {
        postData.featuredImage = getFileUrl(req.file.filename);
      } else if (req.body.featuredImage) {
        // Use the featuredImage URL from the request body
        postData.featuredImage = req.body.featuredImage;
      }
      
      // Parse and validate categories if provided
      let categories = [];
      if (req.body.categories) {
        try {
          categories = JSON.parse(req.body.categories);
        } catch (error) {
          return res.status(400).json({ message: 'Invalid categories format' });
        }
      }
      
      const post = await storage.updateBlogPost(Number(id), postData);
      
      if (!post) {
        return res.status(404).json({ message: 'Blog post not found' });
      }
      
      // Always update categories (even if empty, to allow removing all categories)
      // Get existing categories
      const existingCategories = await storage.getPostCategories(Number(id));
      const existingCategoryIds = existingCategories.map(c => c.id);
      
      // Convert all categoryIds to numbers for consistent comparison
      const categoryIds = categories.map(cat => Number(cat));
      
      console.log('Updating categories for post:', {
        postId: id,
        existingCategoryIds,
        newCategoryIds: categoryIds
      });
      
      // Remove categories that are no longer associated
      for (const categoryId of existingCategoryIds) {
        if (!categoryIds.includes(categoryId)) {
          console.log(`Removing category ${categoryId} from post ${id}`);
          await storage.removePostFromCategory(Number(id), categoryId);
        }
      }
      
      // Add new categories
      for (const categoryId of categoryIds) {
        if (!existingCategoryIds.includes(categoryId)) {
          console.log(`Adding category ${categoryId} to post ${id}`);
          await storage.addPostToCategory(Number(id), Number(categoryId));
        }
      }
      
      res.json(post);
    } catch (error: any) {
      console.error('Error updating blog post:', error);
      res.status(400).json({ message: 'Failed to update blog post', error: error.message });
    }
  }],

  deletePost: [requireEditor, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteBlogPost(Number(id));
      
      if (!success) {
        return res.status(404).json({ message: 'Blog post not found' });
      }
      
      res.status(200).json({ message: 'Blog post deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({ message: 'Failed to delete blog post' });
    }
  }],

  createCategory: [requireEditor, async (req: Request, res: Response) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error: any) {
      console.error('Error creating blog category:', error);
      res.status(400).json({ message: 'Failed to create blog category', error: error.message });
    }
  }],

  updateCategory: [requireEditor, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const category = await storage.updateCategory(Number(id), req.body);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(category);
    } catch (error: any) {
      console.error('Error updating category:', error);
      res.status(400).json({ message: 'Failed to update category', error: error.message });
    }
  }],

  deleteCategory: [requireEditor, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCategory(Number(id));
      
      if (!success) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: 'Failed to delete category' });
    }
  }],
};