import { Request, Response } from 'express';
import { storage } from '../storage';
import { upload, getFileUrl } from '../middleware/multer';
import { insertBlogPostSchema, insertCategorySchema } from '@shared/schema';
import { requireAuth, requireEditor } from './auth';

export const blog = {
  // Public endpoints
  getPosts: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, category, published = true, sortBy = 'publishedAt', search } = req.query;
      
      const options = {
        page: Number(page),
        limit: Number(limit),
        category: category as string,
        published: published === 'true' || published === true,
        sortBy: sortBy as string,
        search: search as string
      };
      
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
      const result = await storage.getBlogPosts({ published: false });
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching admin blog posts:', error);
      res.status(500).json({ message: 'Failed to fetch admin blog posts' });
    }
  }],

  createPost: [requireEditor, upload.single('featuredImage'), async (req: Request, res: Response) => {
    try {
      const featuredImage = req.file ? getFileUrl(req.file.filename) : null;
      if (!featuredImage) {
        return res.status(400).json({ message: 'Featured image is required' });
      }
      
      // Get user ID from authenticated user
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const authorId = req.user.id;
      const postData = { ...req.body, featuredImage, authorId };
      
      // Parse and validate categories if provided
      let categories = [];
      if (req.body.categories) {
        try {
          categories = JSON.parse(req.body.categories);
        } catch (error) {
          return res.status(400).json({ message: 'Invalid categories format' });
        }
      }
      
      // Validate blog post data
      const validatedData = insertBlogPostSchema.parse(postData);
      const post = await storage.createBlogPost(validatedData);
      
      // Add categories if provided
      if (categories.length > 0) {
        for (const categoryId of categories) {
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
      
      // Handle image upload if provided
      if (req.file) {
        postData.featuredImage = getFileUrl(req.file.filename);
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
      
      // Update categories if provided
      if (categories.length > 0) {
        // Get existing categories
        const existingCategories = await storage.getPostCategories(Number(id));
        const existingCategoryIds = existingCategories.map(c => c.id);
        
        // Remove categories that are no longer associated
        for (const categoryId of existingCategoryIds) {
          if (!categories.includes(categoryId)) {
            await storage.removePostFromCategory(Number(id), categoryId);
          }
        }
        
        // Add new categories
        for (const categoryId of categories) {
          if (!existingCategoryIds.includes(Number(categoryId))) {
            await storage.addPostToCategory(Number(id), Number(categoryId));
          }
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