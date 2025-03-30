import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { auth } from "./api/auth";
import { products } from "./api/products";
import { blog } from "./api/blog";
import { users } from "./api/users";
import { adminUtil } from "./api/adminUtil";
import { z } from "zod";
import { verifyAuthToken } from "./api/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin utility routes - no auth required (for development only)
  // This should be placed before the auth middleware
  app.post('/api/admin-util/promote', adminUtil.promoteUser);
  app.post('/api/admin-util/create-test-user', adminUtil.createTestUser);
  app.post('/api/admin-util/direct-login', adminUtil.directLogin);
  
  // Middleware to parse and validate auth token
  // Apply auth to all /api routes EXCEPT those exempt below
  app.use('/api', (req, res, next) => {
    console.log(`[AUTH] Checking auth for ${req.method} ${req.path}`);
    
    // Paths that don't require authentication
    const publicPaths = [
      '/admin-util/direct-login',
      '/admin-util/promote',
      '/admin-util/create-test-user',
      '/auth/register',
      '/auth/google',
      '/auth/me',     // Add this to public paths for initial loading
      '/products',
      '/products/featured',
      '/products/related',
      '/categories',  // Add this explicitly
      '/blog/posts',
      '/blog/featured',
      '/blog/categories',
    ];
    
    // Check for exact path matches
    if (publicPaths.includes(req.path)) {
      console.log(`[AUTH] Public path match: ${req.path}`);
      return next();
    }
    
    // Special handling for GET requests - allow them to be public
    // Skip auth for these specific paths
    if (
      // Product & category public paths (GET only)
      (req.method === 'GET' && (
        req.path.startsWith('/products/') ||
        req.path.startsWith('/categories/') ||
        req.path.startsWith('/blog/posts/') ||
        req.path.startsWith('/blog/related/') ||
        req.path === '/blog/categories'
      ))
    ) {
      console.log(`[AUTH] Public GET path: ${req.path}`);
      return next();
    }
    
    // Check for Authorization header (from development environment)
    const authHeader = req.headers.authorization;
    console.log(`[AUTH] Authorization header present: ${!!authHeader}`);
    
    // Log session info
    console.log(`[AUTH] Session user ID: ${req.session?.userId}`);
    
    return verifyAuthToken(req, res, next);
  });

  // Register auth routes
  app.post('/api/auth/register', auth.register);
  app.post('/api/auth/google', auth.googleAuth);
  app.get('/api/auth/me', auth.getCurrentUser);

  // Product-related routes
  app.get('/api/products', products.getProducts);
  app.get('/api/products/featured', products.getFeaturedProducts);
  app.get('/api/products/admin', products.getAdminProducts);
  app.get('/api/products/related/:id', products.getRelatedProducts);
  app.get('/api/products/:id', products.getProductById);
  app.get('/api/products/:id/vendors', products.getProductVendors);
  app.post('/api/products', products.createProduct);
  app.put('/api/products/:id', products.updateProduct);
  app.delete('/api/products/:id', products.deleteProduct);

  // Category routes
  app.get('/api/categories', products.getCategories);
  app.post('/api/categories', products.createCategory);
  app.put('/api/categories/:id', products.updateCategory);
  app.delete('/api/categories/:id', products.deleteCategory);

  // Vendor routes
  app.post('/api/vendors', products.createVendor);
  app.put('/api/vendors/:id', products.updateVendor);
  app.delete('/api/vendors/:id', products.deleteVendor);

  // Blog routes
  app.get('/api/blog/posts', blog.getPosts);
  app.get('/api/blog/posts/:slug', blog.getPostBySlug);
  app.get('/api/blog/featured', blog.getFeaturedPost);
  app.get('/api/blog/related/:slug', blog.getRelatedPosts);
  app.get('/api/blog/categories', blog.getCategories);
  app.get('/api/blog/admin', blog.getAdminPosts);
  app.post('/api/blog/posts', blog.createPost);
  app.put('/api/blog/posts/:id', blog.updatePost);
  app.delete('/api/blog/posts/:id', blog.deletePost);
  app.post('/api/blog/categories', blog.createCategory);
  app.put('/api/blog/categories/:id', blog.updateCategory);
  app.delete('/api/blog/categories/:id', blog.deleteCategory);

  // User management
  app.get('/api/users', users.getUsers);
  app.patch('/api/users/:id/role', users.updateUserRole);
  app.delete('/api/users/:id', users.deleteUser);

  const httpServer = createServer(app);

  return httpServer;
}
