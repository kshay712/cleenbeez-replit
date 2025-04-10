import { Request, Response } from 'express';
import type { NextFunction } from 'express';
import { storage } from '../storage';
import { requireAdmin } from './auth';
import * as admin from 'firebase-admin';

// Special middleware for admin users endpoint - handles direct login tokens
const adminUserCheck = async (req: Request, res: Response, next: NextFunction) => {
  console.log('[ADMIN USERS] Checking admin credentials');
  
  // First check session
  if (req.session && req.session.userId) {
    console.log(`[ADMIN USERS] Found userId in session: ${req.session.userId}`);
    const user = await storage.getUserById(req.session.userId);
    if (user) {
      console.log(`[ADMIN USERS] Session user found: ${user.username} (${user.role})`);
      req.user = user;
      if (user.role === 'admin') {
        return next();
      }
    }
  }
  
  // Then check auth header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const token = req.headers.authorization.split('Bearer ')[1];
    
    // Special case for admin direct login token
    if (token === 't2fSkTqSvLPBCFcB7bTRTCgYmKm2') {
      console.log('[ADMIN USERS] Found admin direct login token');
      const adminUser = await storage.getUserByFirebaseUid('t2fSkTqSvLPBCFcB7bTRTCgYmKm2');
      if (adminUser) {
        console.log(`[ADMIN USERS] Admin user found: ${adminUser.username}`);
        req.user = adminUser;
        
        // Also set in session
        if (req.session) {
          req.session.userId = adminUser.id;
        }
        
        return next();
      }
    }
    
    // Continue with normal admin check
    try {
      return requireAdmin(req, res, next);
    } catch (error) {
      return res.status(401).json({ message: 'Authentication required' });
    }
  }
  
  // No valid credentials
  return res.status(401).json({ message: 'Admin authentication required' });
};

export const users = {
  getUsers: [adminUserCheck, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // Ensure lastLogin is properly formatted as ISO string for consistent client-side parsing
      const formattedUsers = users.map(user => ({
        ...user,
        // If lastLogin exists, ensure it's a proper Date object and convert to ISO string
        lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : null
      }));
      
      res.json(formattedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  }],

  updateUserRole: [adminUserCheck, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!role || !['admin', 'editor', 'user'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Must be "admin", "editor", or "user"' });
      }
      
      const user = await storage.updateUserRole(Number(id), role);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error: any) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Failed to update user role' });
    }
  }],

  deleteUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = Number(id);
      
      console.log(`[DELETE USER] Attempt to delete user ID: ${userId}`);
      console.log(`[DELETE USER] Current user is: ${req.user?.username} (ID: ${req.user?.id}, Role: ${req.user?.role}, Email: ${req.user?.email})`);
      
      // Prevent self-deletion
      if (req.user && req.user.id === userId) {
        console.log(`[DELETE USER] Self-deletion prevented for user ID: ${userId}`);
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }
      
      // Get the user before deleting to verify it exists
      const userToDelete = await storage.getUserById(userId);
      if (!userToDelete) {
        console.log(`[DELETE USER] User ID ${userId} not found`);
        return res.status(404).json({ message: 'User not found' });
      }
      
      console.log(`[DELETE USER] Found user to delete: ${userToDelete.username} (Role: ${userToDelete.role})`);
      
      // Special handling for deleting admin users
      // Only admin3@cleanbee.com can delete other admin users
      if (userToDelete.role === 'admin' && req.user?.email !== 'admin3@cleanbee.com') {
        console.log(`[DELETE USER] Attempted to delete admin user by non-admin3 account`);
        return res.status(403).json({ message: 'Only the super admin can delete other admin accounts' });
      }
      
      console.log(`[DELETE USER] Deleting user ID: ${userId}`);
      const result = await storage.deleteUser(userId);
      
      if (!result.success) {
        console.log(`[DELETE USER] Database delete operation failed for user ID: ${userId}`);
        return res.status(500).json({ message: 'Failed to delete user from database' });
      }
      
      // If the user had a Firebase account, also delete it
      if (result.firebaseUid) {
        try {
          console.log(`[DELETE USER] Attempting to delete Firebase user with UID: ${result.firebaseUid}`);
          await admin.auth().deleteUser(result.firebaseUid);
          console.log(`[DELETE USER] Firebase user deleted: ${result.firebaseUid}`);
        } catch (firebaseError: any) {
          // If we get a user-not-found error, that's okay - it means the user doesn't exist in Firebase anymore
          if (firebaseError.code === 'auth/user-not-found') {
            console.log(`[DELETE USER] Firebase user ${result.firebaseUid} already doesn't exist`);
          } else {
            // For other errors, just log them but continue (we already deleted from our DB)
            console.error(`[DELETE USER] Error deleting Firebase user: ${firebaseError.message}`, firebaseError);
          }
        }
      }
      
      console.log(`[DELETE USER] User ID ${userId} deleted successfully`);
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user', error: error.message });
    }
  }
};