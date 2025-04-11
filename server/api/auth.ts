import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { insertUserSchema } from '@shared/schema';
import admin from 'firebase-admin';
import { UserRecord } from 'firebase-admin/auth';

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
        console.log('[AUTH] Detected development test token');
        const userId = parseInt(token.split('test-')[1]);
        console.log(`[AUTH] Extracted user ID from test token: ${userId}`);
        
        const user = await storage.getUserById(userId);
        if (user) {
          console.log(`[AUTH] Dev user found by ID: ${user.username} (${user.role})`);
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
      } else if (token.indexOf('t2fSkTqSvLPBCFcB7bTRTCgYmKm2') !== -1) {
        // Special case for admin token from direct login
        console.log('[AUTH] Detected admin token for direct login');
        const user = await storage.getUserByFirebaseUid(token);
        if (user) {
          console.log(`[AUTH] Admin user found: ${user.username} (${user.role})`);
          req.user = user;
          if (req.session) {
            req.session.userId = user.id; 
            console.log(`[AUTH] Set session userId to ${user.id}`);
          }
          return next();
        }
        
        // Try looking up admin by firebaseUid
        const adminUser = await storage.getUserByFirebaseUid('t2fSkTqSvLPBCFcB7bTRTCgYmKm2');
        if (adminUser) {
          console.log(`[AUTH] Admin user found by static UID: ${adminUser.username} (${adminUser.role})`);
          req.user = adminUser;
          if (req.session) {
            req.session.userId = adminUser.id;
            console.log(`[AUTH] Set session userId to ${adminUser.id}`);
          }
          return next();
        } else {
          console.log('[AUTH] Admin token recognized but admin user not found in database');
          return res.status(401).json({ message: 'Admin user not found' });
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
  console.log('[ADMIN CHECK] Method and Path:', req.method, req.path);
  
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
        const userId = parseInt(token.split('test-')[1]);
        console.log(`[ADMIN CHECK] Extracted user ID from test token: ${userId}`);
        
        const user = await storage.getUserById(userId);
        if (user) {
          console.log(`[ADMIN CHECK] Dev user found by ID: ${user.username} (${user.role})`);
          req.user = user;
          
          // Set in session for future requests
          if (req.session) {
            req.session.userId = user.id;
            console.log(`[ADMIN CHECK] Set session userId to ${user.id}`);
          }
        }
      } else if (token.indexOf('t2fSkTqSvLPBCFcB7bTRTCgYmKm2') !== -1) {
        // Special case for admin token from direct login
        console.log('[ADMIN CHECK] Detected admin token');
        // Try looking up directly by this admin UID
        const adminUser = await storage.getUserByFirebaseUid('t2fSkTqSvLPBCFcB7bTRTCgYmKm2');
        if (adminUser) {
          console.log(`[ADMIN CHECK] Admin user found by UID: ${adminUser.username} (${adminUser.role})`);
          req.user = adminUser;
          
          // Set in session for future requests
          if (req.session) {
            req.session.userId = adminUser.id;
            console.log(`[ADMIN CHECK] Set session userId to ${adminUser.id}`);
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
        const userId = parseInt(token.split('test-')[1]);
        console.log(`[EDITOR CHECK] Extracted user ID from test token: ${userId}`);
        
        const user = await storage.getUserById(userId);
        if (user) {
          console.log(`[EDITOR CHECK] Dev user found by ID: ${user.username} (${user.role})`);
          req.user = user;
          
          // Set in session for future requests
          if (req.session) {
            req.session.userId = user.id;
            console.log(`[EDITOR CHECK] Set session userId to ${user.id}`);
          }
        }
      } else if (token.indexOf('t2fSkTqSvLPBCFcB7bTRTCgYmKm2') !== -1) {
        // Special case for admin token from direct login
        console.log('[EDITOR CHECK] Detected admin token');
        const adminUser = await storage.getUserByFirebaseUid('t2fSkTqSvLPBCFcB7bTRTCgYmKm2');
        if (adminUser) {
          console.log(`[EDITOR CHECK] Admin user found by UID: ${adminUser.username} (${adminUser.role})`);
          req.user = adminUser;
          
          // Set in session for future requests
          if (req.session) {
            req.session.userId = adminUser.id;
            console.log(`[EDITOR CHECK] Set session userId to ${adminUser.id}`);
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

// Helper function to find a Firebase user by email
const findFirebaseUserByEmail = async (email: string): Promise<UserRecord | null> => {
  try {
    console.log(`[FIREBASE] Looking up user with email: ${email}`);
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`[FIREBASE] Found user with email ${email}, UID: ${userRecord.uid}`);
    return userRecord;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.log(`[FIREBASE] No user found with email: ${email}`);
      return null;
    }
    console.error(`[FIREBASE] Error looking up user by email:`, error);
    throw error;
  }
};

export const auth = {
  // Endpoint to check email verification status directly from Firebase
  checkVerification: async (req: Request, res: Response) => {
    try {
      const { email, uid } = req.query;
      
      // Security check - make sure we have a valid request
      if (!email || !uid) {
        console.log(`Verification check missing parameters: email=${email}, uid=${uid}`);
        return res.status(400).json({ message: 'Missing required parameters' });
      }
      
      // Get the user ID from the headers
      const userId = req.headers['x-dev-user-id'];
      console.log(`Verification check requested for email: ${email}, uid: ${uid}, userId: ${userId}`);
      
      // Try to verify the user exists in our database only if the ID is provided
      let userInDb = null;
      if (userId) {
        userInDb = await storage.getUserById(Number(userId));
        if (!userInDb) {
          console.log(`User with ID ${userId} not found in database`);
          
          // Try finding user by email instead of failing immediately
          userInDb = await storage.getUserByEmail(email as string);
          if (!userInDb) {
            console.log(`User with email ${email} not found in database either`);
            // Continue with verification check but let the client know user wasn't found
          }
        }
      } else {
        // No userId provided, try to find by email
        userInDb = await storage.getUserByEmail(email as string);
        if (!userInDb) {
          console.log(`User with email ${email} not found in database without userId`);
          // Continue with verification check but let the client know user wasn't found
        }
      }
      
      // If we found a user, make sure the email matches
      if (userInDb && userInDb.email !== email) {
        console.log(`Email mismatch: ${userInDb.email} (db) vs ${email} (request)`);
        return res.status(403).json({ message: 'Email mismatch with account' });
      }
      
      // Regardless of database presence, check with Firebase Admin SDK
      try {
        const firebaseUser = await admin.auth().getUser(uid as string);
        console.log(`Firebase user found, email verified: ${firebaseUser.emailVerified}`);
        
        // If verification status changes from false to true in Firebase,
        // and we have a user record, update it
        if (firebaseUser.emailVerified && userInDb && userInDb.firebaseUid) {
          console.log(`Email verification confirmed for user ${userInDb.id}, updating status...`);
          // For debugging we don't actually need to update any status in our DB as it's not stored
        }
        
        // Return the verification status
        return res.status(200).json({ 
          emailVerified: firebaseUser.emailVerified,
          userFound: !!userInDb,
          user: {
            email: firebaseUser.email,
            uid: firebaseUser.uid
          }
        });
      } catch (firebaseError: any) {
        console.error('Error getting Firebase user:', firebaseError);
        
        // Try looking up by email as a backup
        try {
          if (email) {
            console.log(`Trying to find Firebase user by email instead: ${email}`);
            const userByEmail = await findFirebaseUserByEmail(email as string);
            
            if (userByEmail) {
              console.log(`Found Firebase user by email, ID: ${userByEmail.uid}, verified: ${userByEmail.emailVerified}`);
              
              return res.status(200).json({
                emailVerified: userByEmail.emailVerified,
                userFound: !!userInDb,
                user: {
                  email: userByEmail.email,
                  uid: userByEmail.uid
                },
                uidMismatch: userByEmail.uid !== uid
              });
            }
          }
        } catch (emailLookupError) {
          console.error('Error finding Firebase user by email:', emailLookupError);
        }
        
        return res.status(404).json({ 
          message: 'Firebase user not found', 
          error: firebaseError.message || 'Unknown Firebase error' 
        });
      }
    } catch (error: any) {
      console.error('Error in checkVerification:', error);
      return res.status(500).json({ message: 'Server error', error: error.message || 'Unknown server error' });
    }
  },
  
  publicCleanupFirebaseUser: async (req: Request, res: Response) => {
    try {
      console.log('[PUBLIC CLEANUP FIREBASE] Request received:', JSON.stringify(req.body));
      
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      // IMPORTANT SECURITY CHECK: This is a public endpoint, so we need to make sure it's not abused
      // Only allow cleaning up users during registration who actually exist in Firebase but not in our DB
      
      // Look up the user in Firebase by email
      const firebaseUser = await findFirebaseUserByEmail(email);
      
      if (!firebaseUser) {
        return res.status(404).json({ message: 'No Firebase user found with this email' });
      }
      
      console.log(`[PUBLIC CLEANUP FIREBASE] Found Firebase user: ${firebaseUser.uid} (${firebaseUser.email})`);
      
      // Check our database
      const dbUser = await storage.getUserByEmail(email);
      
      // SECURITY CHECK: If user exists in our database and Firebase, don't allow public cleanup
      // This prevents someone from maliciously deleting a valid user's account
      if (dbUser && dbUser.firebaseUid === firebaseUser.uid) {
        return res.status(403).json({
          message: 'User exists in the system and cannot be cleaned up using the public endpoint',
          userExists: true
        });
      }
      
      // Delete the Firebase user
      try {
        console.log(`[PUBLIC CLEANUP FIREBASE] Deleting Firebase user with UID: ${firebaseUser.uid}`);
        await admin.auth().deleteUser(firebaseUser.uid);
        console.log(`[PUBLIC CLEANUP FIREBASE] Successfully deleted Firebase user: ${firebaseUser.uid}`);
        
        // If user exists in our database but has a different Firebase UID, we should clean that up too
        if (dbUser) {
          console.log(`[PUBLIC CLEANUP FIREBASE] Also removing inconsistent user entry from our database: ${dbUser.id}`);
          const result = await storage.deleteUser(dbUser.id);
          if (result.success) {
            console.log(`[PUBLIC CLEANUP FIREBASE] Successfully deleted user from database: ${dbUser.id}`);
          } else {
            console.log(`[PUBLIC CLEANUP FIREBASE] Failed to delete user from database: ${dbUser.id}`);
          }
        }
        
        return res.status(200).json({ 
          message: 'User deleted successfully from Firebase', 
          firebaseUid: firebaseUser.uid,
          databaseUserDeleted: dbUser ? true : false
        });
      } catch (deleteError: any) {
        console.error(`[PUBLIC CLEANUP FIREBASE] Error deleting Firebase user:`, deleteError);
        return res.status(500).json({ 
          message: 'Failed to delete Firebase user', 
          error: deleteError.message, 
          code: deleteError.code
        });
      }
    } catch (error: any) {
      console.error('[PUBLIC CLEANUP FIREBASE] Error:', error);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },
  
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
        console.log(`[REGISTER] User with firebaseUid ${uid} already exists, returning existing user`);
        
        // Set session for the existing user
        if (req.session) {
          req.session.userId = existingUserById.id;
          console.log(`[REGISTER] Set session userId to ${existingUserById.id} for existing user`);
        }
        
        return res.status(200).json({
          user: {
            id: existingUserById.id,
            username: existingUserById.username,
            email: existingUserById.email,
            role: existingUserById.role,
            firebaseUid: existingUserById.firebaseUid
          },
          message: 'User already exists, login successful'
        });
      }
      
      // Check if email exists and update the Firebase UID if it does
      const existingUserEmail = await storage.getUserByEmail(email);
      if (existingUserEmail) {
        console.log(`[REGISTER] Email ${email} already in use, updating Firebase UID`);
        
        // Update the Firebase UID for the existing user
        const updatedUser = await storage.updateFirebaseUid(existingUserEmail.id, uid);
        
        if (!updatedUser) {
          return res.status(500).json({ message: 'Failed to update user with new Firebase UID' });
        }
        
        // Set session for the existing user
        if (req.session) {
          req.session.userId = updatedUser.id;
          console.log(`[REGISTER] Set session userId to ${updatedUser.id} for existing user`);
        }
        
        return res.status(200).json({
          user: {
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            firebaseUid: updatedUser.firebaseUid
          },
          message: 'User already exists, updated with new authentication'
        });
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
          
          // Check if this is an admin@cleanbee.com account and make it admin
          if (email === 'admin@cleanbee.com' && emailUser.role !== 'admin') {
            console.log(`[GOOGLE AUTH] Updating user ${email} to admin role`);
            user = await storage.updateUserRole(emailUser.id, 'admin');
          }
        } else {
          // User doesn't exist - instead of automatically creating, return a not found response
          console.log(`[GOOGLE AUTH] User not found with UID ${firebaseUid} or email ${email}`);
          return res.status(404).json({ 
            message: 'User not found',
            needsRegistration: true,
            email,
            firebaseUid
          });
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
        console.log(`[AUTH] Firebase user ${firebaseUid} found but not registered in our database`);
        return res.status(404).json({ 
          message: 'User needs registration', 
          needsRegistration: true,
          firebaseUid,
          email: decodedToken.email
        });
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
  

  
  // Method to clean up Firebase users by email - only accessible to admins
  cleanupFirebaseUser: [requireAdmin, async (req: Request, res: Response) => {
    try {
      console.log('[CLEANUP FIREBASE] Request received:', JSON.stringify(req.body));
      
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      // Look up the user in Firebase by email
      const firebaseUser = await findFirebaseUserByEmail(email);
      
      if (!firebaseUser) {
        return res.status(404).json({ message: 'No Firebase user found with this email' });
      }
      
      console.log(`[CLEANUP FIREBASE] Found Firebase user: ${firebaseUser.uid} (${firebaseUser.email})`);
      
      // Also check our database
      const dbUser = await storage.getUserByEmail(email);
      
      // Delete the Firebase user
      try {
        console.log(`[CLEANUP FIREBASE] Deleting Firebase user with UID: ${firebaseUser.uid}`);
        await admin.auth().deleteUser(firebaseUser.uid);
        console.log(`[CLEANUP FIREBASE] Successfully deleted Firebase user: ${firebaseUser.uid}`);
        
        // If user exists in our database, also clean it up
        if (dbUser) {
          console.log(`[CLEANUP FIREBASE] Also deleting user from our database: ${dbUser.id}`);
          const result = await storage.deleteUser(dbUser.id);
          if (result.success) {
            console.log(`[CLEANUP FIREBASE] Successfully deleted user from database: ${dbUser.id}`);
          } else {
            console.log(`[CLEANUP FIREBASE] Failed to delete user from database: ${dbUser.id}`);
          }
        }
        
        return res.status(200).json({ 
          message: 'User deleted successfully from Firebase', 
          firebaseUid: firebaseUser.uid,
          databaseUserDeleted: dbUser ? true : false
        });
      } catch (deleteError: any) {
        console.error(`[CLEANUP FIREBASE] Error deleting Firebase user:`, deleteError);
        return res.status(500).json({ 
          message: 'Failed to delete Firebase user', 
          error: deleteError.message, 
          code: deleteError.code
        });
      }
    } catch (error: any) {
      console.error('[CLEANUP FIREBASE] Error:', error);
      res.status(500).json({ message: 'Failed to cleanup Firebase user', error: error.message });
    }
  }],
};