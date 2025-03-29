import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { auth } from "./api/auth";
import { products } from "./api/products";
import { blog } from "./api/blog";
import { users } from "./api/users";
import { z } from "zod";
import { verifyAuthToken } from "./api/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to parse and validate auth token
  app.use('/api', verifyAuthToken);

  // Register auth routes
  app.post('/api/auth/register', auth.register);
  app.post('/api/auth/google', auth.googleAuth);
  app.get('/api/auth/me', auth.getCurrentUser);

  // Product-related routes
  app.get('/api/products', products.getProducts);
  app.get('/api/products/featured', products.getFeaturedProducts);
  app.get('/api/products/related/:id', products.getRelatedProducts);
  app.get('/api/products/:id', products.getProductById);
  app.get('/api/products/:id/vendors', products.getProductVendors);
  app.get('/api/products/admin', products.getAdminProducts);
  app.post('/api/products', products.createProduct);
  app.put('/api/products/:id', products.updateProduct);
  app.delete('/api/products/:id', products.deleteProduct);

  // Category routes
  app.get('/api/categories', products.getCategories);
  app.post('/api/categories', products.createCategory);

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
