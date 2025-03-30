import { Request, Response } from 'express';
import { storage } from '../storage';
import { upload, getFileUrl } from '../middleware/multer';
import { insertProductSchema, insertCategorySchema, insertVendorSchema } from '@shared/schema';
import { requireEditor } from './auth';

export const products = {
  // Public endpoints
  getProducts: async (req: Request, res: Response) => {
    try {
      const { 
        page = 1, 
        limit = 12, 
        category, 
        organic, 
        bpaFree, 
        minPrice, 
        maxPrice, 
        sortBy = 'recommended',
        search 
      } = req.query;
      
      // Parse category array
      let categories: string[] = [];
      if (category) {
        categories = Array.isArray(category) 
          ? category as string[] 
          : [category as string];
      }
      
      const options = {
        page: Number(page),
        limit: Number(limit),
        category: categories,
        organic: organic === 'true',
        bpaFree: bpaFree === 'true',
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sortBy: sortBy as string,
        search: search as string
      };
      
      const { products, total } = await storage.getProducts(options);
      
      // Calculate pagination data
      const totalPages = Math.ceil(total / Number(limit));
      const currentPage = Number(page);
      
      res.json({
        products,
        pagination: {
          currentPage,
          totalPages,
          totalItems: total
        }
      });
    } catch (error: any) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  },

  getFeaturedProducts: async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 3;
      const products = await storage.getFeaturedProducts(limit);
      res.json(products);
    } catch (error: any) {
      console.error('Error fetching featured products:', error);
      res.status(500).json({ message: 'Failed to fetch featured products' });
    }
  },

  getProductById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const product = await storage.getProductById(Number(id));
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json(product);
    } catch (error: any) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: 'Failed to fetch product' });
    }
  },

  getRelatedProducts: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? Number(req.query.limit) : 4;
      
      const relatedProducts = await storage.getRelatedProducts(Number(id), limit);
      res.json(relatedProducts);
    } catch (error: any) {
      console.error('Error fetching related products:', error);
      res.status(500).json({ message: 'Failed to fetch related products' });
    }
  },

  getProductVendors: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const vendors = await storage.getVendorsByProductId(Number(id));
      res.json(vendors);
    } catch (error: any) {
      console.error('Error fetching product vendors:', error);
      res.status(500).json({ message: 'Failed to fetch product vendors' });
    }
  },

  // Admin endpoints
  getAdminProducts: [requireEditor, async (req: Request, res: Response) => {
    try {
      const { products, total } = await storage.getProducts();
      res.json({ products, total });
    } catch (error: any) {
      console.error('Error fetching admin products:', error);
      res.status(500).json({ message: 'Failed to fetch admin products' });
    }
  }],

  createProduct: [requireEditor, upload.single('image'), async (req: Request, res: Response) => {
    try {
      const image = req.file ? getFileUrl(req.file.filename) : null;
      
      if (!image) {
        return res.status(400).json({ message: 'Product image is required' });
      }
      
      // Parse price and other numeric fields
      const productData = {
        ...req.body,
        price: req.body.price.toString(), // Convert to string to match schema
        categoryId: parseInt(req.body.categoryId),
        organic: req.body.organic === 'true',
        bpaFree: req.body.bpaFree === 'true',
        featured: req.body.featured === 'true',
        image
      };
      
      // Validate product data
      const validatedData = insertProductSchema.parse(productData);
      const product = await storage.createProduct(validatedData);
      
      res.status(201).json(product);
    } catch (error: any) {
      console.error('Error creating product:', error);
      res.status(400).json({ message: 'Failed to create product', error: error.message });
    }
  }],

  updateProduct: [requireEditor, upload.single('image'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Build product update data
      let productData: any = { ...req.body };
      
      // Handle image upload if provided
      if (req.file) {
        productData.image = getFileUrl(req.file.filename);
      }
      
      // Parse numeric and boolean fields if they exist in the request
      if (productData.price) productData.price = productData.price.toString(); // Convert to string to match schema
      if (productData.categoryId) productData.categoryId = parseInt(productData.categoryId);
      if (productData.organic !== undefined) productData.organic = productData.organic === 'true';
      if (productData.bpaFree !== undefined) productData.bpaFree = productData.bpaFree === 'true';
      if (productData.featured !== undefined) productData.featured = productData.featured === 'true';
      
      const product = await storage.updateProduct(Number(id), productData);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json(product);
    } catch (error: any) {
      console.error('Error updating product:', error);
      res.status(400).json({ message: 'Failed to update product', error: error.message });
    }
  }],

  deleteProduct: [requireEditor, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteProduct(Number(id));
      
      if (!success) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Failed to delete product' });
    }
  }],

  getCategories: async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  },

  createCategory: [requireEditor, async (req: Request, res: Response) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error: any) {
      console.error('Error creating category:', error);
      res.status(400).json({ message: 'Failed to create category', error: error.message });
    }
  }],

  updateCategory: [requireEditor, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const category = await storage.updateCategory(Number(id), req.body);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(category);
    } catch (error: any) {
      console.error('Error updating category:', error);
      res.status(400).json({ message: 'Failed to update category', error: error.message });
    }
  }],

  deleteCategory: [requireEditor, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCategory(Number(id));
      
      if (!success) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: 'Failed to delete category' });
    }
  }],

  createVendor: [requireEditor, async (req: Request, res: Response) => {
    try {
      const validatedData = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(validatedData);
      res.status(201).json(vendor);
    } catch (error: any) {
      console.error('Error creating vendor:', error);
      res.status(400).json({ message: 'Failed to create vendor', error: error.message });
    }
  }],

  updateVendor: [requireEditor, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const vendor = await storage.updateVendor(Number(id), req.body);
      
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
      
      res.json(vendor);
    } catch (error: any) {
      console.error('Error updating vendor:', error);
      res.status(400).json({ message: 'Failed to update vendor', error: error.message });
    }
  }],

  deleteVendor: [requireEditor, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteVendor(Number(id));
      
      if (!success) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
      
      res.status(200).json({ message: 'Vendor deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      res.status(500).json({ message: 'Failed to delete vendor' });
    }
  }],
};