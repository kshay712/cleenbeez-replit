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

// Middleware to verify authentication (Firebase token OR session)
export const verifyAuthToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(`[AUTH] Verify Auth Token for ${req.method} ${req.path}`);
    
    // First check if we have a user in the session
    if (req.session && req.session.userId) {
      console.log(`[AUTH] Found userId in session: ${req.session.userId}`);
      const user = await storage.getUserById(req.session.userId);
      if (user) {
        console.log(`[AUTH] Session user found: ${user.username} (${user.role})`);
        req.user = user;
        return next();
      } else {
        console.log('[AUTH] Session userId exists but user not found in database');
      }
    } else {
      console.log('[AUTH] No userId in session');
    }
    
    // If no session, check for Firebase token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[AUTH] No authentication token provided for route:', req.path);
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    console.log(`[AUTH] Token starts with: ${token.substring(0, 10)}...`);
    
    try {
      // For development login, handle a special case test token
      if (token.startsWith('test-')) {
        console.log('[AUTH] Detected development token');
        const user = await storage.getUserByFirebaseUid(token);
        if (user) {
          console.log(`[AUTH] Dev user found: ${user.username} (${user.role})`);
          req.user = user;
          if (req.session) {
            req.session.userId = user.id;
            console.log(`[AUTH] Set session userId to ${user.id}`);
          }
          return next();
        } else {
          console.log('[AUTH] Dev token found but user not in database');
          return res.status(401).json({ message: 'Development user not found' });
        }
      }
      
      // Normal Firebase token authentication
      console.log('[AUTH] Verifying Firebase token');
      const decodedToken = await admin.auth().verifyIdToken(token);
      const firebaseUid = decodedToken.uid;
      console.log(`[AUTH] Token verified, Firebase UID: ${firebaseUid}`);
      
      // Get user from database by Firebase UID
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        console.log('[AUTH] Firebase user not found in database');
        return res.status(401).json({ message: 'User not found in database' });
      }
      
      // Add user to request object
      console.log(`[AUTH] Firebase user found: ${user.username} (${user.role})`);
      req.user = user;
      
      // Also set in session for future requests
      if (req.session) {
        req.session.userId = user.id;
        console.log(`[AUTH] Set session userId to ${user.id}`);
      }
      
      return next();
    } catch (error) {
      console.error('[AUTH] Token verification error:', error);
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
  } catch (error) {
    console.error('[AUTH] Auth middleware error:', error);
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

  getCurrentUser: async (req: Request, res: Response) => {
    console.log('[AUTH] Getting current user');
    
    // First check for a dev user in headers
    const devUserId = req.headers['x-dev-user-id'];
    if (devUserId) {
      console.log(`[AUTH] Found X-Dev-User-ID header: ${devUserId}`);
      try {
        const user = await storage.getUserById(Number(devUserId));
        if (user) {
          console.log(`[AUTH] Found dev user: ${user.username} (${user.role})`);
          return res.status(200).json({
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              firebaseUid: user.firebaseUid
            }
          });
        }
      } catch (error) {
        console.error('[AUTH] Error fetching dev user:', error);
      }
    }
    
    // Then verify authentication
    try {
      // First check if we have a user in the session
      if (req.session && req.session.userId) {
        console.log(`[AUTH] Found userId in session: ${req.session.userId}`);
        const user = await storage.getUserById(req.session.userId);
        if (user) {
          console.log(`[AUTH] Found session user: ${user.username} (${user.role})`);
          return res.status(200).json({
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              firebaseUid: user.firebaseUid
            }
          });
        }
      }
      
      // If no session, check for Firebase token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[AUTH] No auth header for getCurrentUser');
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const token = authHeader.split('Bearer ')[1];
      
      // For development login, handle a special case test token
      if (token.startsWith('test-')) {
        console.log('[AUTH] Found test- token in getCurrentUser');
        const user = await storage.getUserByFirebaseUid(token);
        if (user) {
          console.log(`[AUTH] Found dev token user: ${user.username} (${user.role})`);
          // Set in session for future requests
          if (req.session) {
            req.session.userId = user.id;
          }
          return res.status(200).json({
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              firebaseUid: user.firebaseUid
            }
          });
        }
      }
      
      // Normal Firebase token
      const decodedToken = await admin.auth().verifyIdToken(token);
      const firebaseUid = decodedToken.uid;
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found in database' });
      }
      
      // Set in session for future requests
      if (req.session) {
        req.session.userId = user.id;
      }
      
      return res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          firebaseUid: user.firebaseUid
        }
      });
    } catch (error) {
      console.error('[AUTH] getCurrentUser error:', error);
      return res.status(401).json({ message: 'Not authenticated' });
    }
  },
};