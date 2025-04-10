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
  console.log('[AUTH CHECK] Checking user authentication');
  
  // TEMPORARY DEBUG: Check headers
  console.log('[AUTH CHECK] Auth header:', req.headers.authorization);
  console.log('[AUTH CHECK] Dev user ID header:', req.headers['x-dev-user-id']);
  
  // Check if we have a development user ID in the header
  const devUserId = req.headers['x-dev-user-id'];
  if (devUserId) {
    try {
      const user = await storage.getUserById(Number(devUserId));
      if (user) {
        console.log(`[AUTH CHECK] Setting req.user from header to ${user.username} (${user.role})`);
        req.user = user;
      }
    } catch (error) {
      console.error('[AUTH CHECK] Error fetching user from devUserId:', error);
    }
  }
  
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// Middleware to check if user is admin
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  console.log('[ADMIN CHECK] Checking admin permissions');
  
  // TEMPORARY DEBUG: Check headers
  console.log('[ADMIN CHECK] Auth header:', req.headers.authorization ? 'Present' : 'Not present');
  console.log('[ADMIN CHECK] Session userId:', req.session?.userId);
  
  // First, check if we have a user in the session
  if (req.session && req.session.userId) {
    console.log(`[ADMIN CHECK] Found userId in session: ${req.session.userId}`);
    const user = await storage.getUserById(req.session.userId);
    if (user) {
      console.log(`[ADMIN CHECK] Session user found: ${user.username} (${user.role})`);
      req.user = user;
    }
  }
  
  // If no user yet, check for Firebase token
  if (!req.user && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const token = req.headers.authorization.split('Bearer ')[1];
    try {
      // Check if this is a test token first
      if (token.startsWith('test-')) {
        console.log('[ADMIN CHECK] Found test token');
        const user = await storage.getUserByFirebaseUid(token);
        if (user) {
          console.log(`[ADMIN CHECK] Dev user found from token: ${user.username} (${user.role})`);
          req.user = user;
          
          // Set in session for future requests
          if (req.session) {
            req.session.userId = user.id;
            console.log(`[ADMIN CHECK] Set session userId to ${user.id}`);
          }
        }
      } else {
        // Normal Firebase token validation
        console.log('[ADMIN CHECK] Verifying Firebase token');
        const decodedToken = await admin.auth().verifyIdToken(token);
        const firebaseUid = decodedToken.uid;
        console.log(`[ADMIN CHECK] Token verified, Firebase UID: ${firebaseUid}`);
        
        // Get user from database by Firebase UID
        const user = await storage.getUserByFirebaseUid(firebaseUid);
        if (user) {
          console.log(`[ADMIN CHECK] Firebase user found: ${user.username} (${user.role})`);
          req.user = user;
          
          // Set in session for future requests
          if (req.session) {
            req.session.userId = user.id;
            console.log(`[ADMIN CHECK] Set session userId to ${user.id}`);
          }
        }
      }
    } catch (error) {
      console.error('[ADMIN CHECK] Token verification error:', error);
    }
  }
  
  // Final checks
  if (!req.user) {
    console.log('[ADMIN CHECK] No authenticated user found');
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    console.log(`[ADMIN CHECK] User ${req.user.username} has role ${req.user.role} - admin required`);
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  console.log(`[ADMIN CHECK] Admin access granted for ${req.user.username}`);
  next();
};

// Middleware to check if user is editor or admin
export const requireEditor = async (req: Request, res: Response, next: NextFunction) => {
  console.log('[EDITOR CHECK] Checking if user has editor permissions');
  
  // TEMPORARY DEBUG: Check headers
  console.log('[EDITOR CHECK] Auth header:', req.headers.authorization ? 'Present' : 'Not present');
  console.log('[EDITOR CHECK] Session userId:', req.session?.userId);
  
  // First, check if we have a user in the session
  if (req.session && req.session.userId) {
    console.log(`[EDITOR CHECK] Found userId in session: ${req.session.userId}`);
    const user = await storage.getUserById(req.session.userId);
    if (user) {
      console.log(`[EDITOR CHECK] Session user found: ${user.username} (${user.role})`);
      req.user = user;
    }
  }
  
  // If no user yet, check for Firebase token
  if (!req.user && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const token = req.headers.authorization.split('Bearer ')[1];
    try {
      // Check if this is a test token first
      if (token.startsWith('test-')) {
        console.log('[EDITOR CHECK] Found test token');
        const user = await storage.getUserByFirebaseUid(token);
        if (user) {
          console.log(`[EDITOR CHECK] Dev user found from token: ${user.username} (${user.role})`);
          req.user = user;
          
          // Set in session for future requests
          if (req.session) {
            req.session.userId = user.id;
            console.log(`[EDITOR CHECK] Set session userId to ${user.id}`);
          }
        }
      } else {
        // Normal Firebase token validation
        console.log('[EDITOR CHECK] Verifying Firebase token');
        const decodedToken = await admin.auth().verifyIdToken(token);
        const firebaseUid = decodedToken.uid;
        console.log(`[EDITOR CHECK] Token verified, Firebase UID: ${firebaseUid}`);
        
        // Get user from database by Firebase UID
        const user = await storage.getUserByFirebaseUid(firebaseUid);
        if (user) {
          console.log(`[EDITOR CHECK] Firebase user found: ${user.username} (${user.role})`);
          req.user = user;
          
          // Set in session for future requests
          if (req.session) {
            req.session.userId = user.id;
            console.log(`[EDITOR CHECK] Set session userId to ${user.id}`);
          }
        }
      }
    } catch (error) {
      console.error('[EDITOR CHECK] Token verification error:', error);
    }
  }
  
  // Final checks
  if (!req.user) {
    console.log('[EDITOR CHECK] No authenticated user found');
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'editor' && req.user.role !== 'admin') {
    console.log(`[EDITOR CHECK] User ${req.user.username} has role ${req.user.role} - editor required`);
    return res.status(403).json({ message: 'Editor access required' });
  }
  
  console.log(`[EDITOR CHECK] Editor access granted for ${req.user.username}`);
  next();
};

export const auth = {
  updateProfile: async (req: Request, res: Response) => {
    try {
      console.log('[UPDATE PROFILE] Request body:', JSON.stringify(req.body));
      console.log('[UPDATE PROFILE] Auth header:', req.headers.authorization ? 'Present' : 'Not present');
      console.log('[UPDATE PROFILE] Session user ID:', req.session?.userId);
      
      // If we don't have a user object yet, try to get it from the session
      if (!req.user && req.session?.userId) {
        console.log(`[UPDATE PROFILE] Attempting to get user from session ID ${req.session.userId}`);
        const user = await storage.getUserById(req.session.userId);
        if (user) {
          console.log(`[UPDATE PROFILE] Found user from session: ${user.username}`);
          req.user = user;
        }
      }
      
      // If still no user, try Firebase token
      if (!req.user && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
          console.log('[UPDATE PROFILE] Attempting to verify Firebase token');
          const token = req.headers.authorization.split('Bearer ')[1];
          
          // Special case for test tokens
          if (token.startsWith('test-')) {
            console.log('[UPDATE PROFILE] Found test token');
            const user = await storage.getUserByFirebaseUid(token);
            if (user) {
              console.log(`[UPDATE PROFILE] Found user with test token: ${user.username}`);
              req.user = user;
            }
          } else {
            // Regular Firebase token
            const decodedToken = await admin.auth().verifyIdToken(token);
            console.log(`[UPDATE PROFILE] Token verified, Firebase UID: ${decodedToken.uid}`);
            const user = await storage.getUserByFirebaseUid(decodedToken.uid);
            if (user) {
              console.log(`[UPDATE PROFILE] Found user with Firebase token: ${user.username}`);
              req.user = user;
            }
          }
        } catch (error) {
          console.error('[UPDATE PROFILE] Error verifying token:', error);
        }
      }
      
      // Check if user is authenticated
      if (!req.user) {
        console.error('[UPDATE PROFILE] No user found in request, session, or token');
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user.id;
      const { username, currentPassword, newPassword } = req.body;
      
      // If updating username, check if it's available
      if (username && username !== req.user.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: 'Username already taken' });
        }
      }
      
      // If updating password, verify current password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: 'Current password is required to set a new password' });
        }
        
        // For Firebase auth users, handle password updates through Firebase
        if (req.user.firebaseUid && !req.user.firebaseUid.startsWith('test-')) {
          try {
            // We can't verify Firebase passwords directly, so we'll trust the client verification
            // In a real production app, you might use Firebase Admin to update the password
            console.log('[UPDATE PROFILE] Updating password for Firebase user');
          } catch (error) {
            console.error('[UPDATE PROFILE] Firebase password update error:', error);
            return res.status(500).json({ message: 'Failed to update password' });
          }
        } else {
          // For local users, verify the current password (this is simplified as we don't have bcrypt)
          // In a real app, you'd use bcrypt.compare
          if (currentPassword !== req.user.password) {
            return res.status(400).json({ message: 'Current password is incorrect' });
          }
        }
      }
      
      // Update user in database
      const updateData: any = {};
      if (username && username !== req.user.username) {
        updateData.username = username;
      }
      if (newPassword) {
        updateData.password = newPassword;
      }
      
      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        return res.status(200).json({ 
          user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role,
            firebaseUid: req.user.firebaseUid
          }
        });
      }
      
      console.log('[UPDATE PROFILE] Updating user with data:', { ...updateData, password: updateData.password ? '[REDACTED]' : undefined });
      
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update user profile' });
      }
      
      res.status(200).json({
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          firebaseUid: updatedUser.firebaseUid
        }
      });
    } catch (error: any) {
      console.error('[UPDATE PROFILE] Error:', error);
      res.status(500).json({ message: 'Failed to update profile', error: error.message });
    }
  },
  
  register: async (req: Request, res: Response) => {
    try {
      console.log('[REGISTER] Request body:', JSON.stringify(req.body));
      const { email, password, username, firebaseUid } = req.body;
      
      if (!email || !username) {
        return res.status(400).json({ message: 'Email and username are required' });
      }
      
      let uid = firebaseUid;
      
      // If we have an auth header, verify the token to get the Firebase UID
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
          const token = req.headers.authorization.split('Bearer ')[1];
          console.log('[REGISTER] Verifying Firebase token');
          
          // Verify Firebase token
          const decodedToken = await admin.auth().verifyIdToken(token);
          console.log('[REGISTER] Token verified:', decodedToken);
          
          // Use the UID from the token
          uid = decodedToken.uid;
        } catch (error) {
          console.error('[REGISTER] Token verification error:', error);
        }
      }
      
      // Firebase UID is required - either from token or request body
      if (!uid) {
        return res.status(400).json({ message: 'Firebase UID is required' });
      }
      
      // Check if user with this firebaseUid already exists
      const existingUserById = await storage.getUserByFirebaseUid(uid);
      if (existingUserById) {
        console.log(`[REGISTER] User with firebaseUid ${uid} already exists`);
        return res.status(400).json({ message: 'User already exists with this authentication' });
      }
      
      // Check if email exists
      const existingUserEmail = await storage.getUserByEmail(email);
      if (existingUserEmail) {
        console.log(`[REGISTER] Email ${email} already in use`);
        return res.status(400).json({ message: 'Email already in use' });
      }
      
      // Check if username exists
      const existingUserName = await storage.getUserByUsername(username);
      if (existingUserName) {
        console.log(`[REGISTER] Username ${username} already in use`);
        return res.status(400).json({ message: 'Username already in use' });
      }
      
      console.log(`[REGISTER] Creating new user ${username} with email ${email}`);
      
      // Create user in our database
      const userData = {
        username,
        email,
        password: password || `firebase-auth-${Date.now()}`, // Use provided password or generate one
        firebaseUid: uid,
        role: 'user' // Default role
      };
      
      console.log('[REGISTER] User data:', { ...userData, password: '[REDACTED]' });
      
      const validatedData = insertUserSchema.parse(userData);
      const user = await storage.createUser(validatedData);
      
      console.log(`[REGISTER] User created with ID: ${user.id}`);
      
      // Set session for future requests
      if (req.session) {
        req.session.userId = user.id;
        console.log(`[REGISTER] Set session userId to ${user.id}`);
      }
      
      res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          firebaseUid: user.firebaseUid
        }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Failed to register user', error: error.message });
    }
  },

  googleAuth: async (req: Request, res: Response) => {
    try {
      console.log('[GOOGLE AUTH] Request body:', JSON.stringify(req.body));
      console.log('[GOOGLE AUTH] Authorization header:', req.headers.authorization);
      
      // Get data from either the request body or Firebase token
      let email = req.body.email;
      let firebaseUid = req.body.firebaseUid;
      let username = req.body.username;
      
      // Verify Firebase token if provided
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
          const token = req.headers.authorization.split('Bearer ')[1];
          console.log('[GOOGLE AUTH] Verifying Firebase token');
          
          // Check if it's a test token
          if (token.startsWith('test-')) {
            console.log('[GOOGLE AUTH] Using test token');
          } else {
            // Verify real Firebase token
            const decodedToken = await admin.auth().verifyIdToken(token);
            console.log('[GOOGLE AUTH] Token verified:', decodedToken);
            
            // Use token data if not provided in body
            firebaseUid = firebaseUid || decodedToken.uid;
            email = email || decodedToken.email;
            // Try to get user's name from Firebase
            try {
              const firebaseUser = await admin.auth().getUser(firebaseUid);
              username = username || firebaseUser.displayName || email.split('@')[0];
            } catch (error) {
              console.error('[GOOGLE AUTH] Error getting Firebase user details:', error);
              username = username || email.split('@')[0];
            }
          }
        } catch (error) {
          console.error('[GOOGLE AUTH] Token verification error:', error);
        }
      }
      
      if (!email || !firebaseUid) {
        console.log('[GOOGLE AUTH] Missing email or firebaseUid even after token verification');
        return res.status(400).json({ message: 'Email and Firebase UID are required' });
      }
      
      console.log(`[GOOGLE AUTH] Processing login for ${email} with UID ${firebaseUid}`);
      
      // Check if user exists in database
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        // Also check by email in case the firebaseUid changed
        const emailUser = await storage.getUserByEmail(email);
        
        if (emailUser) {
          // Update the Firebase UID for the existing user
          console.log(`[GOOGLE AUTH] User found with email ${email}, updating Firebase UID`);
          user = await storage.updateFirebaseUid(emailUser.id, firebaseUid);
        } else {
          console.log(`[GOOGLE AUTH] User not found, creating new user with UID ${firebaseUid}`);
          
          // Create new user in database
          const userData = {
            username: username || email.split('@')[0],
            email,
            firebaseUid,
            password: `firebase-auth-${Date.now()}`, // We need a password in the schema
            role: 'user' // Default role
          };
          
          console.log('[GOOGLE AUTH] Creating user with data:', JSON.stringify(userData));
          
          const validatedData = insertUserSchema.parse(userData);
          user = await storage.createUser(validatedData);
        }
      }
      
      // Make sure we have a user at this point
      if (!user) {
        console.error('[GOOGLE AUTH] Failed to retrieve or create user');
        return res.status(500).json({ message: 'Failed to retrieve or create user' });
      }
      
      // Set session for future requests
      if (req.session) {
        req.session.userId = user.id;
        console.log(`[GOOGLE AUTH] Set session userId to ${user.id}`);
      }
      
      // Update last login timestamp
      try {
        await storage.updateLastLogin(user.id);
        console.log(`[GOOGLE AUTH] Updated last login timestamp for user ${user.id}`);
      } catch (error) {
        console.error('[GOOGLE AUTH] Failed to update last login timestamp:', error);
      }
      
      res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          firebaseUid: user.firebaseUid
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
        const sessionUser = await storage.getUserById(req.session.userId);
        if (sessionUser) {
          console.log(`[AUTH] Found session user: ${sessionUser.username} (${sessionUser.role})`);
          return res.status(200).json({
            user: {
              id: sessionUser.id,
              username: sessionUser.username,
              email: sessionUser.email,
              role: sessionUser.role,
              firebaseUid: sessionUser.firebaseUid
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
        const testUser = await storage.getUserByFirebaseUid(token);
        if (testUser) {
          console.log(`[AUTH] Found dev token user: ${testUser.username} (${testUser.role})`);
          // Set in session for future requests
          if (req.session) {
            req.session.userId = testUser.id;
          }
          return res.status(200).json({
            user: {
              id: testUser.id,
              username: testUser.username,
              email: testUser.email,
              role: testUser.role,
              firebaseUid: testUser.firebaseUid
            }
          });
        }
      }
      
      // Normal Firebase token
      const decodedToken = await admin.auth().verifyIdToken(token);
      const firebaseUid = decodedToken.uid;
      const tokenUser = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!tokenUser) {
        return res.status(401).json({ message: 'User not found in database' });
      }
      
      // Set in session for future requests
      if (req.session) {
        req.session.userId = tokenUser.id;
      }
      
      return res.status(200).json({
        user: {
          id: tokenUser.id,
          username: tokenUser.username,
          email: tokenUser.email,
          role: tokenUser.role,
          firebaseUid: tokenUser.firebaseUid
        }
      });
    } catch (error) {
      console.error('[AUTH] getCurrentUser error:', error);
      return res.status(401).json({ message: 'Not authenticated' });
    }
  },
};