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
      
      // EMERGENCY: Try a direct SQL update for feature flags before anything else
      try {
        // Import required modules
        const { db } = await import('../db');
        const { sql } = await import('drizzle-orm');
        
        // Extract boolean values from form data - CRITICAL FIX: Handle both presence and actual value
        // This is crucial for checkboxes which may be omitted (undefined) when unchecked
        const organicVal = req.body.organic === 'true' || req.body.organic === true;
        const bpaFreeVal = req.body.bpaFree === 'true' || req.body.bpaFree === true;
        const phthalateFreeVal = req.body.phthalateFree === 'true' || req.body.phthalateFree === true;
        const parabenFreeVal = req.body.parabenFree === 'true' || req.body.parabenFree === true;
        const oxybenzoneFreeVal = req.body.oxybenzoneFree === 'true' || req.body.oxybenzoneFree === true;
        const formaldehydeFreeVal = req.body.formaldehydeFree === 'true' || req.body.formaldehydeFree === true;
        const sulfatesFreeVal = req.body.sulfatesFree === 'true' || req.body.sulfatesFree === true;
        const fdcFreeVal = req.body.fdcFree === 'true' || req.body.fdcFree === true;
        
        console.log('EMERGENCY: Direct boolean values extracted for update:', {
          organic: organicVal,
          bpaFree: bpaFreeVal,
          phthalateFree: phthalateFreeVal,
          parabenFree: parabenFreeVal,
          oxybenzoneFree: oxybenzoneFreeVal,
          formaldehydeFree: formaldehydeFreeVal,
          sulfatesFree: sulfatesFreeVal,
          fdcFree: fdcFreeVal
        });
        
        // CRITICAL: Need to include these fields in the form even if they're unchecked
      // In FormData, a checkbox that's unchecked typically doesn't get included in the payload
      // So let's check for each field's existence, and if it's missing, explicitly set it to false
      
      // Ensure all checkbox fields are represented in update
      // This is the key fix - we need to force all checkboxes to be included,
      // even when they're unchecked (which means they're missing from req.body)
      const organicFinal = 'organic' in req.body ? organicVal : false;
      const bpaFreeFinal = 'bpaFree' in req.body ? bpaFreeVal : false;
      const phthalateFreeFinal = 'phthalateFree' in req.body ? phthalateFreeVal : false;
      const parabenFreeFinal = 'parabenFree' in req.body ? parabenFreeVal : false;
      const oxybenzoneFreeFinal = 'oxybenzoneFree' in req.body ? oxybenzoneFreeVal : false;
      const formaldehydeFreeFinal = 'formaldehydeFree' in req.body ? formaldehydeFreeVal : false;
      const sulfatesFreeFinal = 'sulfatesFree' in req.body ? sulfatesFreeVal : false;
      const fdcFreeFinal = 'fdcFree' in req.body ? fdcFreeVal : false;
      
      console.log('CRITICAL FIX: Final boolean values after checking for presence in form data:', {
        organic: organicFinal,
        bpaFree: bpaFreeFinal,
        phthalateFree: phthalateFreeFinal,
        parabenFree: parabenFreeFinal, 
        oxybenzoneFree: oxybenzoneFreeFinal,
        formaldehydeFree: formaldehydeFreeFinal,
        sulfatesFree: sulfatesFreeFinal,
        fdcFree: fdcFreeFinal
      });
      
      // Execute a very simple direct update just for feature flags
      const emergencyUpdate = await db.execute(sql`
        UPDATE products 
        SET organic = ${organicFinal},
            bpa_free = ${bpaFreeFinal},
            phthalate_free = ${phthalateFreeFinal},
            paraben_free = ${parabenFreeFinal},
            oxybenzone_free = ${oxybenzoneFreeFinal},
            formaldehyde_free = ${formaldehydeFreeFinal},
            sulfates_free = ${sulfatesFreeFinal},
            fdc_free = ${fdcFreeFinal}
        WHERE id = ${id}
      `);
        
        console.log('EMERGENCY: Feature flag direct update completed');
        
        // Return success immediately
        const updatedProduct = await storage.getProductById(Number(id));
        if (updatedProduct) {
          console.log('EMERGENCY: Updated product retrieved:', updatedProduct);
          return res.json(updatedProduct);
        }
      } catch (error) {
        console.error('EMERGENCY: Direct feature flag update failed:', error);
        // Continue with normal flow if emergency update fails
      }
      
      // Build product update data (original flow continues below)
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
      console.log('Converting boolean fields:');
      if (productData.organic !== undefined) {
        productData.organic = productData.organic === 'true' || productData.organic === true;
        console.log('- organic converted to:', productData.organic);
      }
      if (productData.bpaFree !== undefined) {
        productData.bpaFree = productData.bpaFree === 'true' || productData.bpaFree === true;
        console.log('- bpaFree converted to:', productData.bpaFree);
      }
      if (productData.phthalateFree !== undefined) {
        productData.phthalateFree = productData.phthalateFree === 'true' || productData.phthalateFree === true;
        console.log('- phthalateFree converted to:', productData.phthalateFree);
      }
      if (productData.parabenFree !== undefined) {
        productData.parabenFree = productData.parabenFree === 'true' || productData.parabenFree === true;
        console.log('- parabenFree converted to:', productData.parabenFree);
      }
      if (productData.oxybenzoneFree !== undefined) {
        productData.oxybenzoneFree = productData.oxybenzoneFree === 'true' || productData.oxybenzoneFree === true;
        console.log('- oxybenzoneFree converted to:', productData.oxybenzoneFree);
      }
      if (productData.formaldehydeFree !== undefined) {
        productData.formaldehydeFree = productData.formaldehydeFree === 'true' || productData.formaldehydeFree === true;
        console.log('- formaldehydeFree converted to:', productData.formaldehydeFree);
      }
      if (productData.sulfatesFree !== undefined) {
        productData.sulfatesFree = productData.sulfatesFree === 'true' || productData.sulfatesFree === true;
        console.log('- sulfatesFree converted to:', productData.sulfatesFree);
      }
      if (productData.fdcFree !== undefined) {
        productData.fdcFree = productData.fdcFree === 'true' || productData.fdcFree === true;
        console.log('- fdcFree converted to:', productData.fdcFree);
      }
      if (productData.featured !== undefined) {
        productData.featured = productData.featured === 'true' || productData.featured === true;
        console.log('- featured converted to:', productData.featured);
      }
      
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
        console.log('productData for update:', JSON.stringify(productData, null, 2));
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
        
        // CRITICAL FIX: Always include ALL feature flags in the update
        // The client should now explicitly include all boolean fields, so we'll trust what we get
        // Instead of conditionally adding these, we'll force their inclusion with explicit boolean conversion
        
        // Convert these to true boolean values to guarantee correct SQL values
        const organicFinal = productData.organic === 'true' || productData.organic === true;
        const bpaFreeFinal = productData.bpaFree === 'true' || productData.bpaFree === true;
        const phthalateFreeFinal = productData.phthalateFree === 'true' || productData.phthalateFree === true;
        const parabenFreeFinal = productData.parabenFree === 'true' || productData.parabenFree === true;
        const oxybenzoneFreeFinal = productData.oxybenzoneFree === 'true' || productData.oxybenzoneFree === true;
        const formaldehydeFreeFinal = productData.formaldehydeFree === 'true' || productData.formaldehydeFree === true;
        const sulfatesFreeFinal = productData.sulfatesFree === 'true' || productData.sulfatesFree === true;
        const fdcFreeFinal = productData.fdcFree === 'true' || productData.fdcFree === true;
        
        // Log ALL feature flag values to debug
        console.log('FEATURE FLAGS for SQL update:', {
          organic: organicFinal,
          bpaFree: bpaFreeFinal,
          phthalateFree: phthalateFreeFinal,
          parabenFree: parabenFreeFinal,
          oxybenzoneFree: oxybenzoneFreeFinal,
          formaldehydeFree: formaldehydeFreeFinal,
          sulfatesFree: sulfatesFreeFinal,
          fdcFree: fdcFreeFinal
        });
        
        // Force-add ALL boolean fields to the SQL update
        updateFields.push(sql`organic = ${organicFinal}`);
        updateFields.push(sql`bpa_free = ${bpaFreeFinal}`);
        updateFields.push(sql`phthalate_free = ${phthalateFreeFinal}`);
        updateFields.push(sql`paraben_free = ${parabenFreeFinal}`);
        updateFields.push(sql`oxybenzone_free = ${oxybenzoneFreeFinal}`);
        updateFields.push(sql`formaldehyde_free = ${formaldehydeFreeFinal}`);
        updateFields.push(sql`sulfates_free = ${sulfatesFreeFinal}`);
        updateFields.push(sql`fdc_free = ${fdcFreeFinal}`);
        
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

        // Log the raw SQL statement
        const rawSql = `UPDATE products SET ${updateFields.map(f => f.toString()).join(', ')} WHERE id = ${id} RETURNING *`;
        console.log('Raw SQL about to execute:', rawSql);
        
        // Execute a direct SQL update for all fields
        const result = await db.execute(
          sql`UPDATE products SET ${sql.join(updateFields, sql`, `)} WHERE id = ${id} RETURNING *`
        );
        console.log('SQL update result:', result);
        
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

  updateProductFeatures: [requireEditor, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Add more detailed logging for debugging
      console.log('FEATURE UPDATE ONLY: Starting specialized feature flag update for product', id);
      console.log(`FEATURE UPDATE ONLY: Request headers:`, {
        contentType: req.headers['content-type'],
        authorization: req.headers.authorization ? 'Present' : 'Missing'
      });
      console.log('FEATURE UPDATE ONLY: Request body:', req.body);
      
      // CRITICAL FIX: JSON direct handling with simpler extraction
      // Just use the double bang (!!value) operator to force boolean conversion
      const featureFlags = {
        organic: !!req.body.organic,
        bpaFree: !!req.body.bpaFree, 
        phthalateFree: !!req.body.phthalateFree,
        parabenFree: !!req.body.parabenFree,
        oxybenzoneFree: !!req.body.oxybenzoneFree,
        formaldehydeFree: !!req.body.formaldehydeFree,
        sulfatesFree: !!req.body.sulfatesFree,
        fdcFree: !!req.body.fdcFree
      };
      
      console.log('FEATURE UPDATE ONLY: Direct boolean conversion results:', featureFlags);
      
      // Use these as our source values
      const organicVal = featureFlags.organic;
      const bpaFreeVal = featureFlags.bpaFree;
      const phthalateFreeVal = featureFlags.phthalateFree;
      const parabenFreeVal = featureFlags.parabenFree;
      const oxybenzoneFreeVal = featureFlags.oxybenzoneFree;
      const formaldehydeFreeVal = featureFlags.formaldehydeFree;
      const sulfatesFreeVal = featureFlags.sulfatesFree;
      const fdcFreeVal = featureFlags.fdcFree;
      
      console.log('FEATURE UPDATE ONLY: Values extracted (types):', {
        organic: `${organicVal} (${typeof organicVal})`,
        bpaFree: `${bpaFreeVal} (${typeof bpaFreeVal})`,
        phthalateFree: `${phthalateFreeVal} (${typeof phthalateFreeVal})`,
        parabenFree: `${parabenFreeVal} (${typeof parabenFreeVal})`,
        oxybenzoneFree: `${oxybenzoneFreeVal} (${typeof oxybenzoneFreeVal})`,
        formaldehydeFree: `${formaldehydeFreeVal} (${typeof formaldehydeFreeVal})`,
        sulfatesFree: `${sulfatesFreeVal} (${typeof sulfatesFreeVal})`,
        fdcFree: `${fdcFreeVal} (${typeof fdcFreeVal})`
      });
      
      // Get product before update to compare values
      const productBeforeUpdate = await storage.getProductById(Number(id));
      console.log('FEATURE UPDATE ONLY: Product before update:', {
        id: productBeforeUpdate?.id,
        organic: productBeforeUpdate?.organic,
        bpaFree: productBeforeUpdate?.bpaFree,
      });
      
      // Execute direct SQL update for just feature flags
      const { db } = await import('../db');
      const { sql } = await import('drizzle-orm');
      
      // Get current feature values to check if they're actually changing
      const currentFeatures = {
        organic: productBeforeUpdate?.organic || false,
        bpaFree: productBeforeUpdate?.bpaFree || false,
        phthalateFree: productBeforeUpdate?.phthalateFree || false,
        parabenFree: productBeforeUpdate?.parabenFree || false, 
        oxybenzoneFree: productBeforeUpdate?.oxybenzoneFree || false,
        formaldehydeFree: productBeforeUpdate?.formaldehydeFree || false,
        sulfatesFree: productBeforeUpdate?.sulfatesFree || false,
        fdcFree: productBeforeUpdate?.fdcFree || false
      };
      
      const newFeatures = {
        organic: !!organicVal,
        bpaFree: !!bpaFreeVal,
        phthalateFree: !!phthalateFreeVal,
        parabenFree: !!parabenFreeVal,
        oxybenzoneFree: !!oxybenzoneFreeVal,
        formaldehydeFree: !!formaldehydeFreeVal,
        sulfatesFree: !!sulfatesFreeVal,
        fdcFree: !!fdcFreeVal
      };
      
      // Log exactly what changed for debugging
      console.log('FEATURE UPDATE ONLY: Changes:', {
        organic: `${currentFeatures.organic} -> ${newFeatures.organic}`,
        bpaFree: `${currentFeatures.bpaFree} -> ${newFeatures.bpaFree}`,
        phthalateFree: `${currentFeatures.phthalateFree} -> ${newFeatures.phthalateFree}`,
        parabenFree: `${currentFeatures.parabenFree} -> ${newFeatures.parabenFree}`,
        oxybenzoneFree: `${currentFeatures.oxybenzoneFree} -> ${newFeatures.oxybenzoneFree}`,
        formaldehydeFree: `${currentFeatures.formaldehydeFree} -> ${newFeatures.formaldehydeFree}`,
        sulfatesFree: `${currentFeatures.sulfatesFree} -> ${newFeatures.sulfatesFree}`,
        fdcFree: `${currentFeatures.fdcFree} -> ${newFeatures.fdcFree}`
      });
      
      // Force boolean type casting to ensure proper SQL handling
      // Use ::boolean PostgreSQL type casting to ensure proper conversion
      const result = await db.execute(sql`
        UPDATE products 
        SET organic = ${newFeatures.organic}::boolean,
            bpa_free = ${newFeatures.bpaFree}::boolean,
            phthalate_free = ${newFeatures.phthalateFree}::boolean,
            paraben_free = ${newFeatures.parabenFree}::boolean,
            oxybenzone_free = ${newFeatures.oxybenzoneFree}::boolean,
            formaldehyde_free = ${newFeatures.formaldehydeFree}::boolean,
            sulfates_free = ${newFeatures.sulfatesFree}::boolean,
            fdc_free = ${newFeatures.fdcFree}::boolean,
            updated_at = NOW()
        WHERE id = ${Number(id)}
        RETURNING *
      `);
      
      console.log('FEATURE UPDATE ONLY: Direct SQL update result rows:', result.length);
      
      // Verify the raw SQL result first
      if (result && result.length > 0) {
        const rawResult = result[0];
        console.log('FEATURE UPDATE ONLY: First row of raw SQL result:', {
          id: rawResult.id,
          organic: rawResult.organic,
          bpa_free: rawResult.bpa_free,
          updated_at: rawResult.updated_at
        });
      }
      
      // Add a small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Re-fetch product with our enhanced direct SQL method
      const updatedProduct = await storage.getProductById(Number(id));
      if (!updatedProduct) {
        console.error('FEATURE UPDATE ONLY: Product not found after update');
        return res.status(404).json({ message: 'Product not found after update' });
      }
      
      console.log('FEATURE UPDATE ONLY: Updated product features from storage:', {
        id: updatedProduct.id,
        organic: updatedProduct.organic,
        bpaFree: updatedProduct.bpaFree,
        phthalateFree: updatedProduct.phthalateFree,
        parabenFree: updatedProduct.parabenFree,
        oxybenzoneFree: updatedProduct.oxybenzoneFree,
        formaldehydeFree: updatedProduct.formaldehydeFree,
        sulfatesFree: updatedProduct.sulfatesFree,
        fdcFree: updatedProduct.fdcFree
      });
      
      res.json(updatedProduct);
    } catch (error: any) {
      console.error('FEATURE UPDATE ONLY: Error updating product features:', error);
      res.status(500).json({ message: 'Failed to update product features', error: error.message });
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