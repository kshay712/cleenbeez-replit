import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { z } from "zod";
import admin from "firebase-admin";
import { insertUserSchema } from "@shared/schema";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

// Middleware to verify Firebase auth token
export const verifyAuthToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  // Skip token verification for public routes
  const publicPaths = [
    '/api/products',
    '/api/products/featured',
    '/api/products/related',
    '/api/categories',
    '/api/blog/posts',
    '/api/blog/featured',
    '/api/blog/related',
    '/api/blog/categories',
  ];
  
  const isPublicPath = publicPaths.some(path => req.path.startsWith(path));
  
  if (isPublicPath || req.method === 'GET') {
    return next();
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const user = await storage.getUserByFirebaseUid(decodedToken.uid);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Ensure user is authenticated
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Ensure user has admin role
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
};

// Ensure user has editor role (or higher)
export const requireEditor = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'editor') {
    return res.status(403).json({ message: "Editor access required" });
  }
  
  next();
};

// Registration Schema
const registerSchema = insertUserSchema.extend({
  email: z.string().email(),
  firebaseUid: z.string().optional(),
});

// Google Auth Schema
const googleAuthSchema = z.object({
  email: z.string().email(),
  firebaseUid: z.string(),
  username: z.string(),
});

// Auth Controller
export const auth = {
  // Register a new user
  register: async (req: Request, res: Response) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username is already taken" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email is already registered" });
      }
      
      // Create the user
      const newUser = await storage.createUser({
        ...validatedData,
        role: "user", // Default role for new users
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  },
  
  // Handle Google authentication
  googleAuth: async (req: Request, res: Response) => {
    try {
      const validatedData = googleAuthSchema.parse(req.body);
      
      // Check if user already exists by Firebase UID
      let user = await storage.getUserByFirebaseUid(validatedData.firebaseUid);
      
      if (user) {
        // User exists, return user info
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        // Update existing user with Firebase UID
        user = await storage.updateUserRole(existingEmail.id, existingEmail.role);
        if (user) {
          const { password, ...userWithoutPassword } = user;
          return res.status(200).json(userWithoutPassword);
        }
      }
      
      // Create new user
      // Generate a random password since it's not used for OAuth users
      const randomPassword = Math.random().toString(36).slice(-10);
      
      const newUser = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        password: randomPassword, // This password won't be used for login
        firebaseUid: validatedData.firebaseUid,
        role: "user",
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to authenticate with Google" });
    }
  },
  
  // Get current user
  getCurrentUser: [requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = req.user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user information" });
    }
  }],
};
