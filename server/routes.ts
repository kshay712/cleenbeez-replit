import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { auth, requireAdmin } from "./api/auth";
import { products } from "./api/products";
import { blog } from "./api/blog";
import { users } from "./api/users";
import { adminUtil } from "./api/adminUtil";
import { z } from "zod";
import { verifyAuthToken } from "./api/auth";
import admin from 'firebase-admin';

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin utility routes - no auth required (for development only)
  // This should be placed before the auth middleware
  app.post('/api/admin-util/promote', adminUtil.promoteUser);
  app.post('/api/admin-util/create-test-user', adminUtil.createTestUser);
  app.post('/api/admin-util/direct-login', adminUtil.directLogin);
  app.post('/api/admin-util/direct-delete-user', adminUtil.directDeleteUser);
  
  // Add a secondary path for direct login (for easier access from login page)
  app.post('/api/admin/direct-login', adminUtil.directLogin);
  app.post('/api/admin/direct-delete-user', adminUtil.directDeleteUser);
  
  // Add CORS headers for development
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
  
  // Debug middleware to log all requests
  app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.path}`);
    console.log(`[DEBUG] Headers: ${JSON.stringify(req.headers)}`);
    
    if (req.method === 'POST' || req.method === 'PUT') {
      console.log(`[DEBUG] Body: ${JSON.stringify(req.body)}`);
    }
    next();
  });

  // Middleware to parse and validate auth token
  // Apply auth to all /api routes EXCEPT those exempt below
  app.use('/api', (req, res, next) => {
    console.log(`[AUTH] Checking auth for ${req.method} ${req.path}`);
    
    // Paths that don't require authentication
    const publicPaths = [
      '/admin-util/direct-login',
      '/admin-util/promote',
      '/admin-util/create-test-user',
      '/admin-util/direct-delete-user',
      '/admin/direct-login', // New direct login path
      '/admin/direct-delete-user', // New direct delete path
      '/auth/register',
      '/auth/google',  // Google auth should always be accessible
      '/auth/me',      // Auth check should be accessible
      '/auth/profile', // Profile update endpoint is checked internally
      '/auth/logout',  // Logout should always be accessible
      '/auth/cleanup-firebase', // Cleanup endpoint has its own auth checks
      '/auth/public-cleanup-firebase', // Public cleanup for registration flows
      '/auth/check-verification', // Email verification check has its own security checks
      '/auth/check-email', // Email existence check for forgot password flow (legacy path)
      '/api/auth/check-email', // Email existence check with API prefix
      '/products',
      '/products/featured',
      '/products/related',
      '/categories',
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
        req.path === '/blog/categories' ||
        // Special case for email check endpoint - make sure to capture both with and without /api prefix
        req.path === '/auth/check-email' ||
        req.path.startsWith('/auth/check-email?') ||
        req.path === '/api/auth/check-email' ||
        req.path.startsWith('/api/auth/check-email?')
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
  app.post('/api/auth/profile', auth.updateProfile);
  app.post('/api/auth/cleanup-firebase', auth.cleanupFirebaseUser);
  app.post('/api/auth/public-cleanup-firebase', auth.publicCleanupFirebaseUser);
  app.get('/api/auth/check-verification', auth.checkVerification);
  
  // Check if an email exists (for forgot password)
  app.get('/api/auth/check-email', async (req: Request, res: Response) => {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'Email parameter is required' });
      }
      
      // Check if email exists in our database
      const user = await storage.getUserByEmail(email);
      
      // Check if email exists in Firebase
      try {
        const firebaseUser = await admin.auth().getUserByEmail(email);
        return res.status(200).json({ 
          exists: true,
          firebaseOnly: !user,
          message: 'Email is registered' 
        });
      } catch (firebaseError: any) {
        // If Firebase can't find the user either
        if (firebaseError.code === 'auth/user-not-found') {
          return res.status(200).json({ 
            exists: false, 
            message: 'Email is not registered' 
          });
        }
        
        // Some other Firebase error
        console.error('Firebase error during email check:', firebaseError);
        
        // If we have the user in our database but Firebase error, still allow password reset
        if (user) {
          return res.status(200).json({ 
            exists: true,
            message: 'Email is registered in our database' 
          });
        }
        
        return res.status(500).json({ 
          message: 'Error checking email, please try again' 
        });
      }
    } catch (error) {
      console.error('Error checking email:', error);
      return res.status(500).json({ 
        message: 'Server error when checking email' 
      });
    }
  });
  
  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    console.log('[AUTH] Logout requested');
    
    // Clear the session
    if (req.session) {
      console.log('[AUTH] Destroying session');
      req.session.destroy((err) => {
        if (err) {
          console.error('[AUTH] Error destroying session:', err);
          return res.status(500).json({ message: 'Failed to logout' });
        }
        
        console.log('[AUTH] Session destroyed successfully');
        // Clear the session cookie
        res.clearCookie('connect.sid');
        return res.status(200).json({ message: 'Logged out successfully' });
      });
    } else {
      console.log('[AUTH] No session found to destroy');
      return res.status(200).json({ message: 'No active session' });
    }
  });

  // Product-related routes
  app.get('/api/products', products.getProducts);
  app.get('/api/products/featured', products.getFeaturedProducts);
  app.get('/api/products/admin', products.getAdminProducts);
  app.get('/api/products/related/:id', products.getRelatedProducts);
  app.get('/api/products/:id', products.getProductById);
  app.get('/api/products/:id/vendors', products.getProductVendors);
  app.post('/api/products', products.createProduct);
  
  // ===== New simplified endpoints =====
  // Original paths
  app.put('/api/simple/products/:id', products.simplifiedUpdateProduct);  
  app.patch('/api/simple/products/:id/category', products.simplifiedUpdateCategory);
  
  // New paths that match what our frontend is using
  app.patch('/api/products/:id/simplified', products.simplifiedUpdateProduct);
  
  // ===== Legacy endpoints =====
  app.put('/api/products/:id', products.updateProduct);
  app.patch('/api/products/:id/features', products.updateProductFeatures);
  app.patch('/api/products/:id/category/:categoryId', products.updateProductCategory);
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
  
  // Direct endpoint for better debugging
  app.delete('/api/users/:id', [requireAdmin, (req: Request, res: Response) => {
    console.log(`[DELETE USER] User deletion request for ID: ${req.params.id}`);
    console.log(`[DELETE USER] Authenticated user: ${req.user?.username} (ID: ${req.user?.id}, Role: ${req.user?.role})`);
    
    // Call the deleteUser function directly
    users.deleteUser(req, res);
  }]);
  
  // Debug endpoint to check admin status (temporary)
  app.get('/api/admin-check', [requireAdmin, (req: Request, res: Response) => {
    console.log('Admin check passed for user:', req.user);
    res.json({ 
      success: true, 
      user: {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        email: req.user?.email
      }
    });
  }]);

  const httpServer = createServer(app);

  return httpServer;
}
