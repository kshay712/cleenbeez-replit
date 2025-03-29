import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

const promoteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "editor", "user"]),
});

export const adminUtil = {
  // Direct login endpoint that bypasses Firebase
  // This should be removed in production
  directLogin: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Find the user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, we would hash and check the password
      // But for this development utility, we'll just compare the plain text
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Return the user
      res.status(200).json(user);
    } catch (error: any) {
      console.error("Error during direct login:", error);
      res.status(500).json({ 
        message: error.message || "Failed to login" 
      });
    }
  },
  
  // Utility endpoint to promote a user to admin or editor without authentication
  // This should be removed in production
  promoteUser: async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const { email, role } = promoteUserSchema.parse(req.body);
      
      // Find the user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update the user's role
      const updatedUser = await storage.updateUserRole(user.id, role);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user role" });
      }
      
      res.status(200).json({ 
        message: `User has been promoted to ${role}`, 
        user: updatedUser 
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      
      console.error("Error promoting user:", error);
      res.status(500).json({ 
        message: error.message || "Failed to promote user" 
      });
    }
  },
  
  // Utility endpoint to create a test user with specified role
  createTestUser: async (req: Request, res: Response) => {
    try {
      const { email, username, password, role } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Create user
      const user = await storage.createUser({
        email,
        username,
        password,  // Normally this would be hashed
        role: role || "user",
        firebaseUid: "test-" + Date.now(),  // Generate a fake UID for testing
      });
      
      res.status(201).json({
        message: "Test user created successfully",
        user,
      });
    } catch (error: any) {
      console.error("Error creating test user:", error);
      res.status(500).json({
        message: error.message || "Failed to create test user"
      });
    }
  }
};