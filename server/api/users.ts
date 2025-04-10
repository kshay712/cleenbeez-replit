import { Request, Response } from 'express';
import { storage } from '../storage';
import { requireAdmin } from './auth';

export const users = {
  getUsers: [requireAdmin, async (req: Request, res: Response) => {
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

  updateUserRole: [requireAdmin, async (req: Request, res: Response) => {
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

  deleteUser: [requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Prevent self-deletion
      if (req.user && req.user.id === Number(id)) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }
      
      const success = await storage.deleteUser(Number(id));
      
      if (!success) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  }],
};