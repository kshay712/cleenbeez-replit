import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertUserSchema } from '@shared/schema';
import admin from 'firebase-admin';

/**
 * Admin utility functions for development environment only
 * These endpoints should NOT be exposed in production
 *
 * BUGFIX: Added directDeleteUser function to bypass complex auth layers
 */
export const adminUtil = {
  // Direct login without Firebase authentication (for development only)
  directLogin: async (req: Request, res: Response) => {
    try {
      console.log('[DEV LOGIN] Received login request:', { email: req.body.email });
      
      const { email, password } = req.body;
      
      if (!email) {
        console.log('[DEV LOGIN] Error: Email is required');
        return res.status(400).json({ message: 'Email is required' });
      }
      
      // In development, we're not validating the password for simplicity
      // But we need to at least have a password field
      if (!password) {
        console.log('[DEV LOGIN] Error: Password is required');
        return res.status(400).json({ message: 'Password is required' });
      }
      
      // Special case for admin3@cleanbee.com
      if (email === 'admin3@cleanbee.com') {
        console.log('[DEV LOGIN] Special case for admin3@cleanbee.com');
        let user = await storage.getUserByEmail(email);
        
        if (!user) {
          console.log('[DEV LOGIN] Creating admin3@cleanbee.com account');
          // Create the account with admin role
          const userData = {
            username: 'admin3',
            email: 'admin3@cleanbee.com',
            password: 'password123',
            role: 'admin',
            firebaseUid: `test-admin3-${Date.now()}`
          };
          
          const validatedData = insertUserSchema.parse(userData);
          user = await storage.createUser(validatedData);
          console.log('[DEV LOGIN] Created admin3 account with ID:', user.id);
        } else {
          // Ensure admin role
          if (user.role !== 'admin') {
            console.log('[DEV LOGIN] Updating admin3@cleanbee.com to admin role');
            user = await storage.updateUserRole(user.id, 'admin');
          }
        }
        
        // At this point, user must be defined
        if (user && req.session) {
          req.session.userId = user.id;
          console.log('[DEV LOGIN] Set session userId to:', user.id);
          
          await new Promise<void>((resolve, reject) => {
            req.session.save((err) => {
              if (err) {
                console.error('[DEV LOGIN] Session save error:', err);
                reject(err);
              } else {
                console.log('[DEV LOGIN] Session saved successfully');
                resolve();
              }
            });
          });
        }
        
        if (!user) {
          console.error('[DEV LOGIN] Failed to create or update admin3 user');
          return res.status(500).json({ message: 'Failed to create or update admin3 user' });
        }
        
        console.log('[DEV LOGIN] Successfully logged in admin3 with role:', user.role);
        return res.status(200).json(user);
      }
      
      // Regular flow
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log('[DEV LOGIN] Error: User not found with email:', email);
        return res.status(404).json({ message: 'User not found with this email' });
      }
      
      console.log('[DEV LOGIN] Found user:', { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role,
        hasFirebaseUid: !!user.firebaseUid 
      });
      
      // If the user has a Firebase UID that doesn't start with 'test-', 
      // we'll preserve it instead of replacing it with a test UID
      // This allows users created with real Firebase auth to still use direct login
      if (!user.firebaseUid) {
        // Only generate a test UID if one doesn't exist at all
        const testUid = `test-${Date.now()}`;
        console.log('[DEV LOGIN] User has no firebaseUid, creating:', testUid);
        
        try {
          // Update the user with a test firebaseUid
          await storage.updateFirebaseUid(user.id, testUid);
          user = await storage.getUserById(user.id); // Get fresh user data
          console.log('[DEV LOGIN] Updated user with test firebaseUid:', testUid);
        } catch (err) {
          console.error('[DEV LOGIN] Failed to update test firebaseUid:', err);
        }
      } else {
        console.log('[DEV LOGIN] User already has firebaseUid:', user.firebaseUid, '- keeping it');
      }
      
      // Set the user in the session for authentication
      if (user && req.session) {
        req.session.userId = user.id;
        console.log('[DEV LOGIN] Set session userId to:', user.id);
        
        // Force session save
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) {
              console.error('[DEV LOGIN] Session save error:', err);
              reject(err);
            } else {
              console.log('[DEV LOGIN] Session saved successfully');
              resolve();
            }
          });
        });
      }
      
      // Add user to request
      if (user) {
        req.user = user;
        console.log('[DEV LOGIN] Set req.user to:', user.username);
        
        // Update last login timestamp
        try {
          await storage.updateLastLogin(user.id);
          console.log(`[DEV LOGIN] Updated last login timestamp for user ${user.id}`);
        } catch (error) {
          console.error('[DEV LOGIN] Failed to update last login timestamp:', error);
        }
        
        console.log('[DEV LOGIN] Successfully logged in user:', user.username, 'with role:', user.role);
        console.log('[DEV LOGIN] Sending user data back to client');
        res.status(200).json(user);
      } else {
        console.error('[DEV LOGIN] Failed to log in: user is undefined');
        res.status(500).json({ message: 'Login failed due to server error' });
      }
    } catch (error: any) {
      console.error('[DEV LOGIN] Direct login error:', error);
      res.status(500).json({ message: 'Failed to login', error: error.message });
    }
  },
  
  // Promote a user to admin or editor role
  promoteUser: async (req: Request, res: Response) => {
    try {
      const { userId, role } = req.body;
      
      if (!userId || !role) {
        return res.status(400).json({ message: 'User ID and role are required' });
      }
      
      if (role !== 'admin' && role !== 'editor' && role !== 'user') {
        return res.status(400).json({ message: 'Invalid role. Must be "admin", "editor", or "user"' });
      }
      
      const user = await storage.updateUserRole(userId, role);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.status(200).json(user);
    } catch (error: any) {
      console.error('Promote user error:', error);
      res.status(500).json({ message: 'Failed to promote user', error: error.message });
    }
  },
  
  // Create a test user with specified role
  createTestUser: async (req: Request, res: Response) => {
    try {
      const { email, username, password, role } = req.body;
      
      if (!email || !username || !password) {
        return res.status(400).json({ message: 'Email, username, and password are required' });
      }
      
      // Check if email exists
      const existingUserEmail = await storage.getUserByEmail(email);
      if (existingUserEmail) {
        console.log(`[CREATE USER] Email ${email} already in use, updating role to ${role || 'user'}`);
        
        // Update the role for the existing user
        const updatedUser = await storage.updateUserRole(existingUserEmail.id, role || 'user');
        
        if (!updatedUser) {
          return res.status(500).json({ message: 'Failed to update user role' });
        }
        
        return res.status(200).json({
          user: updatedUser,
          message: 'User already exists, updated role'
        });
      }
      
      // Check if username exists
      const existingUserName = await storage.getUserByUsername(username);
      if (existingUserName) {
        return res.status(400).json({ message: 'Username already in use' });
      }
      
      // Validate role if provided
      const userRole = role && ['admin', 'editor', 'user'].includes(role) ? role : 'user';
      
      const userData = {
        email,
        username,
        password,
        role: userRole
      };
      
      const validatedData = insertUserSchema.parse(userData);
      const user = await storage.createUser(validatedData);
      
      res.status(201).json(user);
    } catch (error: any) {
      console.error('Create test user error:', error);
      res.status(500).json({ message: 'Failed to create test user', error: error.message });
    }
  },
  
  // Direct deletion method that bypasses the auth layers
  directDeleteUser: async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      console.log(`[DIRECT DELETE] Starting direct deletion of user ID ${userId}`);
      
      if (!userId) {
        console.log('[DIRECT DELETE] Error: userId is required');
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      // Check if the user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        console.log(`[DIRECT DELETE] Error: User ${userId} not found`);
        return res.status(404).json({ message: 'User not found' });
      }
      
      console.log(`[DIRECT DELETE] Found user to delete: ${user.username} (${user.email}, role: ${user.role})`);
      
      // Don't allow deleting the user who made the request
      if (req.user && req.user.id === user.id) {
        console.log(`[DIRECT DELETE] Preventing self-deletion for user ${userId}`);
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }
      
      // Store Firebase UID before deletion
      const firebaseUid = user.firebaseUid;
      console.log(`[DIRECT DELETE] User's Firebase UID: ${firebaseUid || 'none'}`);
      
      // First, attempt to delete the Firebase user if there's a Firebase UID
      if (firebaseUid && !firebaseUid.startsWith('test-')) {
        try {
          console.log(`[DIRECT DELETE] Attempting to delete Firebase user: ${firebaseUid}`);
          await admin.auth().deleteUser(firebaseUid);
          console.log(`[DIRECT DELETE] Successfully deleted Firebase user: ${firebaseUid}`);
        } catch (firebaseError: any) {
          if (firebaseError.code === 'auth/user-not-found') {
            console.log(`[DIRECT DELETE] Firebase user not found: ${firebaseUid}`);
          } else {
            console.error(`[DIRECT DELETE] Error deleting Firebase user:`, firebaseError);
          }
        }
      }
      
      // After Firebase deletion attempt (or if no Firebase UID), delete from our database
      try {
        console.log(`[DIRECT DELETE] Executing database delete for user ${userId}`);
        const result = await storage.deleteUser(userId);
        
        if (result.success) {
          console.log(`[DIRECT DELETE] Successfully deleted user ${userId} from database`);
          return res.status(200).json({ 
            message: 'User deleted successfully', 
            firebaseDeleted: !!firebaseUid && !firebaseUid.startsWith('test-')
          });
        } else {
          console.log(`[DIRECT DELETE] Database delete operation failed for user ${userId}`);
          return res.status(500).json({ message: 'Failed to delete user from database' });
        }
      } catch (dbError: any) {
        console.error(`[DIRECT DELETE] Error with database delete:`, dbError);
        return res.status(500).json({ message: 'Error deleting user from database', error: dbError.message });
      }
    } catch (error: any) {
      console.error('[DIRECT DELETE] Error:', error);
      res.status(500).json({ message: 'Failed to delete user', error: error.message });
    }
  }
};