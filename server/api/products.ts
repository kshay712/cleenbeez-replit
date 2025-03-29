import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertProductSchema, insertCategorySchema, insertVendorSchema } from "@shared/schema";
import { requireAdmin, requireEditor, requireAuth } from "./auth";

// Validation schemas
const productQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  category: z.union([z.string(), z.array(z.string())]).optional().transform(val => {
    if (typeof val === 'string') {
      return [val];
    }
    return val;
  }),
  organic: z.coerce.boolean().optional(),
  bpaFree: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sortBy: z.string().optional(),
  search: z.string().optional(),
});

// Product Controller
export const products = {
  // Get all products with filtering
  getProducts: async (req: Request, res: Response) => {
    try {
      const params = productQuerySchema.parse(req.query);
      
      const result = await storage.getProducts(params);
      
      // Calculate pagination info
      const page = params.page || 1;
      const limit = params.limit || 12;
      const totalPages = Math.ceil(result.total / limit);
      
      res.status(200).json({
        products: result.products,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: result.total,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to fetch products" });
    }
  },
  
  // Get featured products
  getFeaturedProducts: async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const featuredProducts = await storage.getFeaturedProducts(limit);
      res.status(200).json(featuredProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  },
  
  // Get single product by ID
  getProductById: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Get vendors for this product
      const vendors = await storage.getVendorsByProductId(id);
      
      res.status(200).json({
        ...product,
        vendors
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  },
  
  // Get related products
  getRelatedProducts: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      
      const relatedProducts = await storage.getRelatedProducts(id, limit);
      res.status(200).json(relatedProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch related products" });
    }
  },
  
  // Get vendors for a product
  getProductVendors: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const vendors = await storage.getVendorsByProductId(id);
      res.status(200).json(vendors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product vendors" });
    }
  },
  
  // Get all products for admin
  getAdminProducts: [requireEditor, async (req: Request, res: Response) => {
    try {
      const result = await storage.getProducts({ limit: 100 });
      res.status(200).json(result.products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products for admin" });
    }
  }],
  
  // Create a new product
  createProduct: [requireEditor, async (req: Request, res: Response) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      
      const newProduct = await storage.createProduct(productData);
      res.status(201).json(newProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  }],
  
  // Update a product
  updateProduct: [requireEditor, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      
      const updatedProduct = await storage.updateProduct(id, productData);
      
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(200).json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  }],
  
  // Delete a product
  deleteProduct: [requireEditor, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteProduct(id);
      
      if (!result) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  }],
  
  // Get all categories
  getCategories: async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  },
  
  // Create a new category
  createCategory: [requireEditor, async (req: Request, res: Response) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      
      // Check if category with same slug already exists
      const existingCategory = await storage.getCategoryBySlug(categoryData.slug);
      if (existingCategory) {
        return res.status(409).json({ message: "Category with this slug already exists" });
      }
      
      const newCategory = await storage.createCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  }],
  
  // Update a category
  updateCategory: [requireEditor, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      
      // If slug is being updated, check if it already exists and isn't this category's slug
      if (categoryData.slug) {
        const existingCategory = await storage.getCategoryBySlug(categoryData.slug);
        if (existingCategory && existingCategory.id !== id) {
          return res.status(409).json({ message: "Category with this slug already exists" });
        }
      }
      
      const updatedCategory = await storage.updateCategory(id, categoryData);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(200).json(updatedCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update category" });
    }
  }],
  
  // Delete a category
  deleteCategory: [requireEditor, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if there are products using this category before deleting
      const productsInCategory = await storage.getProductsByCategory(id);
      if (productsInCategory && productsInCategory.length > 0) {
        return res.status(409).json({ 
          message: "Cannot delete category that has associated products",
          count: productsInCategory.length
        });
      }
      
      const result = await storage.deleteCategory(id);
      
      if (!result) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  }],
  
  // Create a new vendor
  createVendor: [requireEditor, async (req: Request, res: Response) => {
    try {
      const vendorData = insertVendorSchema.parse(req.body);
      
      const newVendor = await storage.createVendor(vendorData);
      res.status(201).json(newVendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vendor data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create vendor" });
    }
  }],
  
  // Update a vendor
  updateVendor: [requireEditor, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const vendorData = insertVendorSchema.partial().parse(req.body);
      
      const updatedVendor = await storage.updateVendor(id, vendorData);
      
      if (!updatedVendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      res.status(200).json(updatedVendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vendor data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update vendor" });
    }
  }],
  
  // Delete a vendor
  deleteVendor: [requireEditor, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteVendor(id);
      
      if (!result) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      res.status(200).json({ message: "Vendor deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete vendor" });
    }
  }],
};
