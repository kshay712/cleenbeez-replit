import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertUserSchema } from '@shared/schema';

/**
 * Admin utility functions for development environment only
 * These endpoints should NOT be exposed in production
 */
export const adminUtil = {
  // Direct login without Firebase authentication (for development only)
  directLogin: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      // In development, we're not validating the password for simplicity
      // But we need to at least have a password field
      if (!password) {
        return res.status(400).json({ message: 'Password is required' });
      }
      
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found with this email' });
      }
      
      // Make sure we have a test firebaseUid for development login
      if (!user.firebaseUid || !user.firebaseUid.startsWith('test-')) {
        // Update the user with a test firebaseUid if it doesn't exist
        const testUid = `test-${Date.now()}`;
        try {
          // This is a simplified update - in a real system you'd use a proper update method
          const updatedUser = await storage.updateUserRole(user.id, user.role); 
          // We're reusing updateUserRole as a way to touch the user record
          if (updatedUser) {
            // Now add the firebaseUid directly
            await storage.updateFirebaseUid(user.id, testUid);
            user = await storage.getUserById(user.id); // Get fresh user data
          }
        } catch (err) {
          console.error('Failed to update test firebaseUid:', err);
        }
      }
      
      // Set the user in the session for authentication
      if (user && req.session) {
        req.session.userId = user.id;
        // Force session save
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      
      // Add user to request
      if (user) {
        req.user = user;
      }
      
      if (user) {
        console.log('Successfully logged in user:', user.username);
        res.status(200).json(user);
      } else {
        console.error('Failed to log in: user is undefined');
        res.status(500).json({ message: 'Login failed due to server error' });
      }
    } catch (error: any) {
      console.error('Direct login error:', error);
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
        return res.status(400).json({ message: 'Email already in use' });
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
  }
};