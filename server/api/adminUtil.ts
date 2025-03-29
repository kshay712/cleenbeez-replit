import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertUserSchema } from '@shared/schema';

/**
 * Admin utility functions for development environment only
 * These endpoints should NOT be exposed in production
 */
export const adminUtil = {
  // Direct login without password or Firebase
  directLogin: async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.status(200).json(user);
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