import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { requireAdmin, requireAuth } from "./auth";

// Validation Schemas
const updateUserRoleSchema = z.object({
  role: z.enum(["user", "editor", "admin"])
});

// Users Controller
export const users = {
  // Get all users (admin only)
  getUsers: [requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords from the response
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.status(200).json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  }],
  
  // Update user role (admin only)
  updateUserRole: [requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = updateUserRoleSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent self-demotion for admins
      if (req.user?.id === userId && req.user?.role === 'admin' && role !== 'admin') {
        return res.status(403).json({ message: "Admins cannot demote themselves" });
      }
      
      // Update the user's role
      const updatedUser = await storage.updateUserRole(userId, role);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid role", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user role" });
    }
  }],
  
  // Delete a user (admin only)
  deleteUser: [requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent self-deletion for admins
      if (req.user?.id === userId) {
        return res.status(403).json({ message: "Users cannot delete themselves" });
      }
      
      // Delete the user
      const result = await storage.deleteUser(userId);
      
      if (!result) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  }],
};
