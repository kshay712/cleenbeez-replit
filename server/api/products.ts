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
        phthalateFree,
        parabenFree,
        oxybenzoneFree,
        formaldehydeFree,
        sulfatesFree,
        fdcFree,
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
        // Boolean feature filters
        organic: organic === 'true',
        bpaFree: bpaFree === 'true',
        phthalateFree: phthalateFree === 'true',
        parabenFree: parabenFree === 'true',
        oxybenzoneFree: oxybenzoneFree === 'true',
        formaldehydeFree: formaldehydeFree === 'true',
        sulfatesFree: sulfatesFree === 'true',
        fdcFree: fdcFree === 'true',
        // Price range filters
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
      
      // Log the product data format
      console.log('Product data being returned:', {
        type: typeof product,
        hasIngredients: product.hasOwnProperty('ingredients'),
        ingredientsType: typeof product.ingredients,
        product: JSON.stringify(product)
      });
      
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
      let ingredients = [];
      if (req.body.ingredients) {
        try {
          ingredients = JSON.parse(req.body.ingredients);
        } catch (e) {
          console.error('Failed to parse ingredients JSON:', e);
          // If parsing fails, use the raw string
          ingredients = req.body.ingredients;
        }
      }
      
      const productData = {
        ...req.body,
        price: req.body.price.toString(), // Convert to string to match schema
        categoryId: parseInt(req.body.categoryId),
        // Convert boolean fields
        organic: req.body.organic === 'true',
        bpaFree: req.body.bpaFree === 'true',
        phthalateFree: req.body.phthalateFree === 'true',
        parabenFree: req.body.parabenFree === 'true',
        oxybenzoneFree: req.body.oxybenzoneFree === 'true',
        formaldehydeFree: req.body.formaldehydeFree === 'true',
        sulfatesFree: req.body.sulfatesFree === 'true',
        fdcFree: req.body.fdcFree === 'true',
        featured: req.body.featured === 'true',
        ingredients,
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
      
      // Enhanced debug logging for the incoming request
      console.log('Update product request body:', JSON.stringify(req.body));
      console.log('Product update feature flags (RAW):');
      console.log('- organic:', req.body.organic, 'type:', typeof req.body.organic);
      console.log('- bpaFree:', req.body.bpaFree, 'type:', typeof req.body.bpaFree);
      console.log('- phthalateFree:', req.body.phthalateFree, 'type:', typeof req.body.phthalateFree);
      console.log('- parabenFree:', req.body.parabenFree, 'type:', typeof req.body.parabenFree);
      console.log('- oxybenzoneFree:', req.body.oxybenzoneFree, 'type:', typeof req.body.oxybenzoneFree);
      console.log('- formaldehydeFree:', req.body.formaldehydeFree, 'type:', typeof req.body.formaldehydeFree);
      console.log('- sulfatesFree:', req.body.sulfatesFree, 'type:', typeof req.body.sulfatesFree);
      console.log('- fdcFree:', req.body.fdcFree, 'type:', typeof req.body.fdcFree);
      
      // Build product update data
      let productData: any = { ...req.body };
      
      // Handle image upload if provided
      if (req.file) {
        productData.image = getFileUrl(req.file.filename);
      }
      
      // Parse ingredients if provided
      if (productData.ingredients) {
        try {
          productData.ingredients = JSON.parse(productData.ingredients);
        } catch (e) {
          console.error('Failed to parse ingredients JSON:', e);
          // If parsing fails, use the raw string
        }
      }
      
      // Parse numeric and boolean fields if they exist in the request
      if (productData.price) productData.price = productData.price.toString(); // Convert to string to match schema
      if (productData.categoryId) {
        console.log('Original categoryId:', productData.categoryId, 'Type:', typeof productData.categoryId);
        productData.categoryId = parseInt(productData.categoryId);
        console.log('Parsed categoryId:', productData.categoryId);
      }
      // Convert all boolean fields
      if (productData.organic !== undefined) productData.organic = productData.organic === 'true';
      if (productData.bpaFree !== undefined) productData.bpaFree = productData.bpaFree === 'true';
      if (productData.phthalateFree !== undefined) productData.phthalateFree = productData.phthalateFree === 'true';
      if (productData.parabenFree !== undefined) productData.parabenFree = productData.parabenFree === 'true';
      if (productData.oxybenzoneFree !== undefined) productData.oxybenzoneFree = productData.oxybenzoneFree === 'true';
      if (productData.formaldehydeFree !== undefined) productData.formaldehydeFree = productData.formaldehydeFree === 'true';
      if (productData.sulfatesFree !== undefined) productData.sulfatesFree = productData.sulfatesFree === 'true';
      if (productData.fdcFree !== undefined) productData.fdcFree = productData.fdcFree === 'true';
      if (productData.featured !== undefined) productData.featured = productData.featured === 'true';
      
      console.log('Final productData to update:', productData);
      
      // Critical workaround: Store the categoryId for direct update
      const categoryIdToUpdate = productData.categoryId !== undefined ? productData.categoryId : null;
      
      // If we're updating the category, remove it from the main update operation
      // We'll handle it separately with a direct SQL approach
      if (categoryIdToUpdate !== null) {
        delete productData.categoryId;
      }
      
      try {
        console.log('Using direct SQL update for feature flags and all fields');
        // Get the database client and SQL
        const { db } = await import('../db');
        const { sql } = await import('drizzle-orm');
        
        // Build SQL statement for all fields
        let updateFields = [];
        
        // Basic fields
        if (productData.name !== undefined) updateFields.push(sql`name = ${productData.name}`);
        if (productData.description !== undefined) updateFields.push(sql`description = ${productData.description}`);
        if (productData.price !== undefined) updateFields.push(sql`price = ${productData.price}`);
        if (productData.whyRecommend !== undefined) updateFields.push(sql`why_recommend = ${productData.whyRecommend}`);
        if (productData.affiliateLink !== undefined) updateFields.push(sql`affiliate_link = ${productData.affiliateLink}`);
        if (productData.image !== undefined) updateFields.push(sql`image = ${productData.image}`);
        
        // Process ingredients array
        if (productData.ingredients) {
          const ingredientsJson = JSON.stringify(productData.ingredients);
          updateFields.push(sql`ingredients = ${ingredientsJson}`);
        }
        
        // Add feature flags
        if (productData.organic !== undefined) updateFields.push(sql`organic = ${productData.organic}`);
        if (productData.bpaFree !== undefined) updateFields.push(sql`bpa_free = ${productData.bpaFree}`);
        if (productData.phthalateFree !== undefined) updateFields.push(sql`phthalate_free = ${productData.phthalateFree}`);
        if (productData.parabenFree !== undefined) updateFields.push(sql`paraben_free = ${productData.parabenFree}`);
        if (productData.oxybenzoneFree !== undefined) updateFields.push(sql`oxybenzone_free = ${productData.oxybenzoneFree}`);
        if (productData.formaldehydeFree !== undefined) updateFields.push(sql`formaldehyde_free = ${productData.formaldehydeFree}`);
        if (productData.sulfatesFree !== undefined) updateFields.push(sql`sulfates_free = ${productData.sulfatesFree}`);
        if (productData.fdcFree !== undefined) updateFields.push(sql`fdc_free = ${productData.fdcFree}`);
        
        // Add categoryId if it exists
        if (categoryIdToUpdate !== null) {
          updateFields.push(sql`category_id = ${categoryIdToUpdate}`);
        }
        
        // Combine all field updates
        if (updateFields.length === 0) {
          console.log('No fields to update');
          return res.status(400).json({ message: 'No valid fields provided for update' });
        }
        
        // Debug the SQL we're building
        console.log('Direct SQL update fields:', updateFields.map(f => f.toString()).join(', '));

        // Execute a direct SQL update for all fields
        await db.execute(
          sql`UPDATE products SET ${sql.join(updateFields, sql`, `)} WHERE id = ${id} RETURNING *`
        );
        
        // Re-fetch the product with latest data
        const updatedProduct = await storage.getProductById(Number(id));
        if (updatedProduct) {
          console.log('Product successfully updated with direct SQL:', updatedProduct);
          return res.json(updatedProduct);
        } else {
          return res.status(404).json({ message: 'Product not found after update' });
        }
      } catch (error: any) {
        console.error('Direct SQL update failed:', error);
        res.status(500).json({ message: 'Failed to update product with SQL', error: error.message });
      }
      
      // This point should never be reached because we're now using direct SQL
      // but if it does, return an appropriate error
      return res.status(500).json({ message: 'Failed to update product via direct SQL method' });
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