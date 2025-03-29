import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { insertUserSchema } from '@shared/schema';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace newlines in the private key
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
} catch (error) {
  console.error('Firebase admin initialization error:', error);
}

// Middleware to verify Firebase auth token
export const verifyAuthToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const firebaseUid = decodedToken.uid;
      
      // Get user from database by Firebase UID
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found in database' });
      }
      
      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// Middleware to check if user is authenticated
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// Middleware to check if user is admin
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
};

// Middleware to check if user is editor or admin
export const requireEditor = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'editor' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Editor access required' });
  }
  
  next();
};

export const auth = {
  register: async (req: Request, res: Response) => {
    try {
      const { email, password, username } = req.body;
      
      if (!email || !password || !username) {
        return res.status(400).json({ message: 'Email, password, and username are required' });
      }
      
      // Check if email exists
      const existingUserEmail = await storage.getUserByEmail(email);
      if (existingUserEmail) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      
      // Check if username exists
      const existingUserName = await storage.getUserByUsername(username);
      if (existingUserName) {
        return res.status(400).json({ message: 'Username already in use' });
      }
      
      try {
        // Create user in Firebase Auth
        const userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: username,
        });
        
        // Create user in database
        const userData = {
          username,
          email,
          firebaseUid: userRecord.uid,
          role: 'user' // Default role
        };
        
        const validatedData = insertUserSchema.parse(userData);
        const user = await storage.createUser(validatedData);
        
        res.status(201).json({
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
      } catch (error: any) {
        console.error('Firebase user creation error:', error);
        return res.status(400).json({ message: 'Failed to create user', error: error.message });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Failed to register user', error: error.message });
    }
  },

  googleAuth: async (req: Request, res: Response) => {
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        return res.status(400).json({ message: 'ID token is required' });
      }
      
      // Verify ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const firebaseUid = decodedToken.uid;
      
      // Check if user exists in database
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        // Get user details from Firebase
        const firebaseUser = await admin.auth().getUser(firebaseUid);
        
        if (!firebaseUser.email) {
          return res.status(400).json({ message: 'User email not found' });
        }
        
        // Generate a username from email if not available
        const username = firebaseUser.displayName || firebaseUser.email.split('@')[0];
        
        // Create new user in database
        const userData = {
          username,
          email: firebaseUser.email,
          firebaseUid,
          role: 'user' // Default role
        };
        
        const validatedData = insertUserSchema.parse(userData);
        user = await storage.createUser(validatedData);
      }
      
      res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error: any) {
      console.error('Google auth error:', error);
      res.status(500).json({ message: 'Failed to authenticate with Google', error: error.message });
    }
  },

  getCurrentUser: [requireAuth, async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    res.status(200).json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
  }],
};