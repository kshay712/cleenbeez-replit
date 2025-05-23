import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

// Flag to enable the simplified API endpoints for product updates
const USE_SIMPLIFIED_API = true;

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CardContent, Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Define schema for product form
const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.string().min(1, 'Price is required'),
  categoryId: z.coerce.number().positive('Category is required'),
  // Product features
  organic: z.boolean().default(false),
  bpaFree: z.boolean().default(false),
  phthalateFree: z.boolean().default(false),
  parabenFree: z.boolean().default(false),
  oxybenzoneFree: z.boolean().default(false),
  formaldehydeFree: z.boolean().default(false),
  sulfatesFree: z.boolean().default(false),
  fdcFree: z.boolean().default(false),
  whyRecommend: z.string().min(1, 'Why we recommend this product is required'),
  ingredients: z.array(z.string()).min(1, 'At least one ingredient is required'),
  affiliateLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  image: z.any().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  productId?: string;
}

const ProductForm = ({ productId }: ProductFormProps) => {
  const isEditMode = !!productId;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // State for ingredients
  const [ingredientsList, setIngredientsList] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState<string>('');

  // Create form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '0.00',
      categoryId: 0,
      // Product features
      organic: false,
      bpaFree: false,
      phthalateFree: false,
      parabenFree: false,
      oxybenzoneFree: false,
      formaldehydeFree: false,
      sulfatesFree: false,
      fdcFree: false,
      whyRecommend: '',
      ingredients: [],
      affiliateLink: '',
      image: undefined,
    },
  });

  // Handle adding an ingredient
  const addIngredient = () => {
    if (newIngredient.trim().length > 0) {
      setIngredientsList(prev => [...prev, newIngredient.trim()]);
      form.setValue('ingredients', [...ingredientsList, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  // Handle removing an ingredient
  const removeIngredient = (index: number) => {
    const updatedIngredients = [...ingredientsList];
    updatedIngredients.splice(index, 1);
    setIngredientsList(updatedIngredients);
    form.setValue('ingredients', updatedIngredients);
  };

  // Fetch categories for dropdown
  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery<any[]>({
    queryKey: ['/api/categories'] as const,
    onSuccess: (data) => {
      console.log("Categories loaded:", data);
    },
    onError: (error) => {
      console.error("Error loading categories:", error);
    }
  } as any);

  // Fetch product data in edit mode
  const { data: productData, isLoading: isProductLoading } = useQuery({
    queryKey: [`/api/products/${productId}`] as const,
    enabled: isEditMode,
  } as any);

  // Update form with product data in edit mode
  useEffect(() => {
    if (isEditMode && productData) {
      // Process the data safely using type assertions for TypeScript
      try {
        // TypeScript type assertion to access properties
        const typedProduct = productData as any;
        
        console.log("Product data loaded:", typedProduct);
        
        // Extract ingredients safely
        let ingredients: string[] = [];
        if (typedProduct.ingredients) {
          if (Array.isArray(typedProduct.ingredients)) {
            ingredients = typedProduct.ingredients;
          } else if (typeof typedProduct.ingredients === 'string') {
            try {
              const parsed = JSON.parse(typedProduct.ingredients);
              ingredients = Array.isArray(parsed) ? parsed : [];
            } catch {
              // If parsing fails, use empty array
              ingredients = [];
            }
          }
        }
        
        // Set ingredients list
        setIngredientsList(ingredients);
        
        // Extract the categoryId properly
        const categoryId = typedProduct.categoryId !== undefined ? Number(typedProduct.categoryId) : 0;
        
        console.log("Setting categoryId in form:", categoryId, "Original value:", typedProduct.categoryId);
        
        // Build the form data with safe fallbacks
        const formData = {
          name: typedProduct.name || '',
          description: typedProduct.description || '',
          price: typeof typedProduct.price === 'string' ? typedProduct.price : '0.00',
          categoryId: categoryId,
          // Product features
          organic: Boolean(typedProduct.organic),
          bpaFree: Boolean(typedProduct.bpaFree),
          phthalateFree: Boolean(typedProduct.phthalateFree),
          parabenFree: Boolean(typedProduct.parabenFree),
          oxybenzoneFree: Boolean(typedProduct.oxybenzoneFree),
          formaldehydeFree: Boolean(typedProduct.formaldehydeFree),
          sulfatesFree: Boolean(typedProduct.sulfatesFree),
          fdcFree: Boolean(typedProduct.fdcFree),
          whyRecommend: typedProduct.whyRecommend || '',
          ingredients: ingredients,
          affiliateLink: typedProduct.affiliateLink || '',
          image: undefined,
        };
        
        console.log("Form data prepared:", formData);
        
        // Reset form with the prepared data
        form.reset(formData);
        
        // Set image preview if available
        if (typedProduct.image) {
          setImagePreview(typedProduct.image);
        }
      } catch (error) {
        console.error("Error while setting product data in form:", error);
      }
    }
  }, [isEditMode, productData, form]);

  // Standard product mutation (original approach)
  const saveProductMutation = useMutation({
    mutationFn: async (values: ProductFormValues & { image?: File }) => {
      const formData = new FormData();
      
      // ULTRA SIMPLIFIED: Convert categoryId to number and ensure it's in formData
      const categoryIdValue = Number(values.categoryId) || 0;
      
      console.log('\n=== ULTRA SIMPLIFIED CATEGORY HANDLING ===');
      console.log('Adding categoryId to FormData as a clean number:', categoryIdValue);
      
      // Add it as both camelCase and snake_case to ensure it's properly processed
      formData.append('categoryId', categoryIdValue.toString());
      formData.append('category_id', categoryIdValue.toString());
      
      console.log('=== END ULTRA SIMPLIFIED CATEGORY HANDLING ===\n');

      // CRITICAL FIX: Always include ALL boolean feature flags
      // This is the key problem - we need to ensure all these fields are in the formData
      // whether they're true or false
      const booleanFields = [
        'organic', 'bpaFree', 'phthalateFree', 'parabenFree', 
        'oxybenzoneFree', 'formaldehydeFree', 'sulfatesFree', 'fdcFree', 'featured'
      ];
      
      // Set all boolean fields explicitly to ensure they're included
      booleanFields.forEach(field => {
        // Get value from values, or default to false if undefined
        const boolValue = values[field as keyof ProductFormValues] === true;
        const stringValue = boolValue ? 'true' : 'false';
        
        console.log(`FIXING: Explicitly setting ${field} to`, stringValue);
        formData.append(field, stringValue);
      });

      // Process other fields
      Object.entries(values).forEach(([key, value]) => {
        if (key === 'categoryId' || booleanFields.includes(key)) {
          // Skip categoryId and boolean fields as we've already handled them
          return;
        } else if (key === 'ingredients') {
          // Ensure ingredients is always serialized as an array
          const ingredientsArray = Array.isArray(value) ? value : [];
          formData.append('ingredients', JSON.stringify(ingredientsArray));
        } else if (key !== 'image' && value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      // Add image if provided
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      if (isEditMode) {
        return apiRequest('PATCH', `/api/products/${productId}`, formData, true);
      } else {
        return apiRequest('POST', '/api/products', formData, true);
      }
    },
    onSuccess: () => {
      toast({
        title: `Product ${isEditMode ? 'updated' : 'created'} successfully`,
        description: `The product has been ${isEditMode ? 'updated' : 'created'}.`,
      });
      
      // Invalidate ALL product-related cache entries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/products/admin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      
      // Invalidate specific product cache if in edit mode
      if (isEditMode && productId) {
        queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
      }
      
      // Force immediate refetch of crucial data
      queryClient.fetchQuery({ queryKey: ['/api/products'] });
      
      // Redirect to the products list
      navigate('/admin/products');
    },
    onError: (error: any) => {
      console.error("Form submission error:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || `Failed to ${isEditMode ? 'update' : 'create'} product`,
      });
    },
  });
  
  // New simplified product update mutation that uses the new simplified API
  const simplifiedUpdateMutation = useMutation({
    mutationFn: async (values: ProductFormValues & { image?: File }) => {
      console.log('\n=== SIMPLIFIED UPDATE API ===');
      console.log('Using new simplified product update endpoint');
      
      if (!isEditMode) {
        // For new products, still use FormData to handle the image upload
        const formData = new FormData();
        
        // Convert categoryId to number
        const categoryIdValue = Number(values.categoryId) || 0;
        formData.append('categoryId', categoryIdValue.toString());
        
        // Handle ingredients 
        const ingredientsArray = Array.isArray(values.ingredients) ? values.ingredients : [];
        formData.append('ingredients', JSON.stringify(ingredientsArray));
        
        // Add all other fields
        Object.entries(values).forEach(([key, value]) => {
          if (key !== 'categoryId' && key !== 'ingredients' && key !== 'image' && value !== undefined) {
            formData.append(key, String(value));
          }
        });
        
        // Add image if provided
        if (imageFile) {
          formData.append('image', imageFile);
        }
        
        console.log('Creating new product with FormData');
        return apiRequest('POST', '/api/products', formData, true);
      } else {
        // For updates, we need to handle image uploads differently
        if (imageFile) {
          // If there's an image, we need to use FormData
          console.log('Update with image: Using FormData approach');
          
          const formData = new FormData();
          
          // Convert categoryId to number
          const categoryIdValue = Number(values.categoryId) || 0;
          formData.append('categoryId', categoryIdValue.toString());
          
          // Handle boolean fields explicitly
          const booleanFields = [
            'organic', 'bpaFree', 'phthalateFree', 'parabenFree', 
            'oxybenzoneFree', 'formaldehydeFree', 'sulfatesFree', 'fdcFree'
          ];
          
          booleanFields.forEach(field => {
            const boolValue = values[field as keyof ProductFormValues] === true;
            formData.append(field, boolValue ? 'true' : 'false');
          });
          
          // Handle ingredients 
          const ingredientsArray = Array.isArray(values.ingredients) ? values.ingredients : [];
          formData.append('ingredients', JSON.stringify(ingredientsArray));
          
          // Add all other fields
          Object.entries(values).forEach(([key, value]) => {
            if (!booleanFields.includes(key) && key !== 'categoryId' && key !== 'ingredients' && key !== 'image' && value !== undefined) {
              formData.append(key, String(value));
            }
          });
          
          // Add the image
          formData.append('image', imageFile);
          
          // Use the simplified update endpoint
          return apiRequest('PATCH', `/api/products/${productId}/simplified`, formData, true);
        } else {
          // No image - we can use JSON for simpler handling
          console.log('Update without image: Using JSON approach for cleaner data handling');
          
          // Create a clean data object
          const updateData = {
            ...values,
            // Ensure categoryId is a number
            categoryId: Number(values.categoryId) || 0,
            // Ensure ingredients is an array
            ingredients: Array.isArray(values.ingredients) ? values.ingredients : [],
            // Make sure all boolean flags are actually booleans
            organic: values.organic === true,
            bpaFree: values.bpaFree === true,
            phthalateFree: values.phthalateFree === true,
            parabenFree: values.parabenFree === true,
            oxybenzoneFree: values.oxybenzoneFree === true,
            formaldehydeFree: values.formaldehydeFree === true,
            sulfatesFree: values.sulfatesFree === true,
            fdcFree: values.fdcFree === true
          };
          
          // Remove the image field as we're not uploading one
          delete updateData.image;
          
          console.log('Simplified update data:', updateData);
          
          // Use the simplified update endpoint with JSON data
          return apiRequest('PATCH', `/api/products/${productId}/simplified`, updateData, false);
        }
      }
    },
    onSuccess: () => {
      toast({
        title: `Product ${isEditMode ? 'updated' : 'created'} successfully`,
        description: `The product has been ${isEditMode ? 'updated' : 'created'} using the simplified API.`,
      });
      
      // Invalidate ALL product-related cache entries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/products/admin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      
      // Invalidate specific product cache if in edit mode
      if (isEditMode && productId) {
        queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
      }
      
      // Force immediate refetch of crucial data
      queryClient.fetchQuery({ queryKey: ['/api/products'] });
      
      // Redirect to the products list
      navigate('/admin/products');
    },
    onError: (error: any) => {
      console.error("Simplified update error:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || `Failed to ${isEditMode ? 'update' : 'create'} product using simplified API`,
      });
    },
  });

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear image selection
  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Create a specialized category update mutation
  const categoryUpdateMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      console.log('CATEGORY UPDATE ONLY: Starting specialized category update with ID:', categoryId);
      console.log('CATEGORY UPDATE ONLY: Product ID:', productId);
      
      // Using our dedicated endpoint for category updates
      const endpoint = `/api/products/${productId}/category/${categoryId}`;
      console.log('CATEGORY UPDATE ONLY: Using dedicated category update endpoint:', endpoint);
      
      try {
        console.log('CATEGORY UPDATE ONLY: Making API request...');
        const response = await apiRequest(
          'PATCH', // Using PATCH to match server endpoint
          endpoint,
          {}, // No body needed as categoryId is in the URL
          false // Not using FormData
        );
        
        console.log('CATEGORY UPDATE ONLY: Response status:', response.status);
        const responseData = await response.json();
        console.log('CATEGORY UPDATE ONLY: Response data:', responseData);
        return responseData;
      } catch (error) {
        console.error('CATEGORY UPDATE ONLY: API request failed with error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('CATEGORY UPDATE ONLY: Success, updated product category:', data);
      
      // Invalidate ALL product-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/admin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] }); 
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
    },
    onError: (error: any) => {
      console.error('CATEGORY UPDATE ONLY: Error updating category:', error);
      toast({
        variant: 'destructive',
        title: 'Category Update Failed',
        description: error.message || 'Failed to update product category',
      });
    }
  });

  // Create a separate feature update mutation with enhanced logging
  const featureUpdateMutation = useMutation({
    mutationFn: async (features: any) => {
      console.log('FEATURE UPDATE ONLY: Starting specialized feature update with data:', features);

      // CRITICAL FIX: Switch to direct JSON approach instead of FormData
      // This ensures cleaner boolean handling
      
      console.log('FEATURE UPDATE ONLY: Using direct JSON update method');
      
      // Make a deep copy to ensure we're not modifying the original
      const featuresCopy = { ...features };
      
      // Force all values to be explicit booleans using !! operator
      Object.keys(featuresCopy).forEach(key => {
        featuresCopy[key] = !!featuresCopy[key];
        console.log(`FEATURE UPDATE ONLY: JSON approach - ${key}=${featuresCopy[key]} (forced boolean type: ${typeof featuresCopy[key]})`);
      });
      
      // Using apiRequest with JSON instead of FormData
      console.log('FEATURE UPDATE ONLY: Sending direct JSON update with explicit boolean values');
      const response = await apiRequest(
        'PATCH',
        `/api/products/${productId}/features`,
        featuresCopy, // direct JSON object with proper booleans
        false // <- NOT using form-data, using JSON
      );
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('FEATURE UPDATE ONLY: Success, updated product:', data);
      
      // Invalidate ALL product-related queries to ensure fresh data throughout the app
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/admin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] }); // Main products list
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] }); // Featured products
      
      // Force refetch of key queries to update the UI immediately 
      if (productId) {
        console.log('FEATURE UPDATE ONLY: Force refetching all product data');
        queryClient.fetchQuery({ queryKey: [`/api/products/${productId}`] });
        queryClient.fetchQuery({ queryKey: ['/api/products'] });
      }
    },
    onError: (error) => {
      console.error('FEATURE UPDATE ONLY: Error updating features:', error);
      toast({
        variant: 'destructive',
        title: 'Feature update failed',
        description: 'Could not update product features. Please try again.',
      });
    }
  });

  // Submit form
  const onSubmit = (values: ProductFormValues) => {
    console.log("\n\n*** FORM SUBMISSION STARTED ***");
    console.log("Raw form values:", values);
    
    // Make sure ingredients are correctly set
    const submitData = { 
      ...values,
      ingredients: ingredientsList
    };
    
    // Always ensure categoryId is a number and is explicitly included
    const categoryId = values.categoryId !== undefined ? Number(values.categoryId) : (
      isEditMode && productData?.categoryId !== undefined ? Number(productData.categoryId) : 0
    );
    
    console.log("*** CRITICAL FIX: Explicitly setting categoryId in submit data:", categoryId, 
                "Type:", typeof categoryId, 
                "Original value:", values.categoryId);
    
    // Save initial category ID for comparison
    const initialCategoryId = isEditMode && productData?.categoryId !== undefined 
      ? Number(productData.categoryId) 
      : 0;
      
    console.log("*** CATEGORY DEBUG: Initial category ID:", initialCategoryId, "New category ID:", categoryId);
    
    // Determine if category has changed
    const categoryChanged = initialCategoryId !== categoryId && categoryId > 0;
    console.log("*** CATEGORY DEBUG: Has category changed?", categoryChanged);
    
    // DIRECT APPROACH: Always include categoryId in the main update
    // Always FORCE categoryId to be a number
    submitData.categoryId = categoryId;
    console.log('*** SIMPLIFIED APPROACH: Always including categoryId in main payload as', categoryId);
    
    // Log the full submit data
    console.log("Final submit data:", submitData);
    
    // CRITICAL: Extract feature flags into their own object for targeted update
    // Log the raw values first
    console.log("DEBUG: Raw form values for features:", {
      organic: values.organic,
      bpaFree: values.bpaFree,
      phthalateFree: values.phthalateFree,
      parabenFree: values.parabenFree,
      oxybenzoneFree: values.oxybenzoneFree,
      formaldehydeFree: values.formaldehydeFree,
      sulfatesFree: values.sulfatesFree,
      fdcFree: values.fdcFree
    });
    
    // Ensure ALL values are explicitly converted to booleans
    const featureData = {
      organic: values.organic === true,
      bpaFree: values.bpaFree === true,
      phthalateFree: values.phthalateFree === true,
      parabenFree: values.parabenFree === true,
      oxybenzoneFree: values.oxybenzoneFree === true,
      formaldehydeFree: values.formaldehydeFree === true,
      sulfatesFree: values.sulfatesFree === true,
      fdcFree: values.fdcFree === true
    };
    
    // Log the converted values for debugging
    console.log("DEBUG: Converted boolean values:", featureData);
    
    // Also include in main form data
    submitData.organic = featureData.organic;
    submitData.bpaFree = featureData.bpaFree;
    submitData.phthalateFree = featureData.phthalateFree;
    submitData.parabenFree = featureData.parabenFree;
    submitData.oxybenzoneFree = featureData.oxybenzoneFree;
    submitData.formaldehydeFree = featureData.formaldehydeFree;
    submitData.sulfatesFree = featureData.sulfatesFree;
    submitData.fdcFree = featureData.fdcFree;
    
    // Add image to values if provided
    if (imageFile) {
      (submitData as any).image = imageFile;
    }
    
    console.log("Submitting product with data:", submitData);
    
    if (isEditMode && productId) {
      if (USE_SIMPLIFIED_API) {
        console.log("Using SIMPLIFIED API for product update");
        
        // Use the new simplified update mutation
        simplifiedUpdateMutation.mutate(submitData as any);
      } else {
        console.log("Using STANDARD API for product update");
        
        // RADICALLY SIMPLIFIED APPROACH: Just perform a single update with all the data
        // No more multi-stage updates - just a single comprehensive update
        saveProductMutation.mutate(submitData as any, {
          onSuccess: () => {
            console.log("Product update successful in single operation");
            
            toast({
              title: 'Product updated successfully',
              description: 'The product has been updated.',
            });
            
            // Invalidate ALL product-related cache entries to ensure fresh data
            queryClient.invalidateQueries({ queryKey: ['/api/products/admin'] });
            queryClient.invalidateQueries({ queryKey: ['/api/products'] });
            queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
            
            // Invalidate specific product cache if in edit mode
            if (isEditMode && productId) {
              queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
            }
            
            // Force immediate refetch of crucial data
            queryClient.fetchQuery({ queryKey: ['/api/products'] });
            
            // Navigate back to products list
            navigate('/admin/products');
          },
          onError: (error) => {
            console.error("Product update failed:", error);
            
            toast({
              variant: 'destructive',
              title: 'Update failed',
              description: 'Could not update product. Please try again.',
            });
          }
        });
      }
    } else {
      // For new products
      if (USE_SIMPLIFIED_API) {
        console.log("Using SIMPLIFIED API for product creation");
        // Use the simplified mutation for new products too
        simplifiedUpdateMutation.mutate(submitData as any);
      } else {
        console.log("Using STANDARD API for product creation");
        // Use the original mutation
        saveProductMutation.mutate(submitData as any);
      }
    }
  };
  
  // Helper function to update features as the final step
  const updateFeatures = (featureData: any) => {
    console.log("Now updating features with data:", featureData);
    
    // Update the features with the dedicated endpoint
    featureUpdateMutation.mutate(featureData, {
      onSuccess: () => {
        console.log("Feature update successful!");
        
        toast({
          title: 'Product updated successfully',
          description: 'The product and its features have been updated.',
        });
        
        // After successful update, navigate back to products list
        navigate('/admin/products');
      },
      onError: (error) => {
        console.error("Feature update failed after other updates succeeded:", error);
        
        toast({
          variant: 'destructive',
          title: 'Partial update',
          description: 'Product saved but feature update failed. Please try again.',
        });
        
        // Still navigate away as the main update was successful
        navigate('/admin/products');
      }
    });
  };
  
  // Cancel editing
  const handleCancel = () => {
    navigate('/admin/products');
  };

  const isLoading = isCategoriesLoading || isProductLoading || 
    saveProductMutation.isPending || 
    simplifiedUpdateMutation.isPending || 
    categoryUpdateMutation.isPending || 
    featureUpdateMutation.isPending;

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardContent className="pt-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">
              {isEditMode ? 'Edit Product' : 'Create New Product'}
            </h1>
            <p className="text-neutral-500">
              {isEditMode
                ? 'Update the details of an existing product'
                : 'Add a new product to your catalog'}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Image upload */}
              <div className="space-y-2">
                <FormLabel>Product Image</FormLabel>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative w-32 h-32 border rounded-md overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 w-6 h-6 rounded-full"
                        onClick={handleClearImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-32 h-32 border border-dashed rounded-md bg-neutral-50 hover:bg-neutral-100 cursor-pointer">
                      <Label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center h-full w-full">
                        <ImagePlus className="h-10 w-10 text-neutral-400" />
                        <span className="text-xs text-neutral-500 mt-2">Upload Image</span>
                      </Label>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </div>
                  )}
                  <div className="text-sm text-neutral-500">
                    <p>Recommended size: 800x800px</p>
                    <p>Max file size: 5MB</p>
                    <p>Formats: JPG, PNG, GIF</p>
                  </div>
                </div>
              </div>

              {/* Product name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Product description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter product description..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a detailed description of the product including benefits and usage.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Why We Recommend */}
              <FormField
                control={form.control}
                name="whyRecommend"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Why We Recommend</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Why is this product recommended by Clean Bee?"
                        className="min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Explain why you're recommending this product to your audience.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Ingredients */}
              <div className="space-y-2">
                <FormLabel>Ingredients</FormLabel>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add ingredient"
                    value={newIngredient}
                    onChange={(e) => setNewIngredient(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addIngredient();
                      }
                    }}
                  />
                  <Button type="button" onClick={addIngredient} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                {ingredientsList.length === 0 && (
                  <p className="text-sm text-destructive mt-1">At least one ingredient is required</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {ingredientsList.map((ingredient, i) => (
                    <Badge key={i} variant="secondary" className="flex gap-1 items-center">
                      {ingredient}
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => removeIngredient(i)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        // Directly update the form with the number value
                        const numberValue = Number(value);
                        console.log("CATEGORY SELECTION EVENT: Category selected:", numberValue, "Original:", value);
                        
                        // Log the form state before change
                        console.log("CATEGORY SELECTION EVENT: Form values before change:", form.getValues());
                        
                        // Update the field via onChange
                        field.onChange(numberValue);
                        
                        // Explicitly force the value to be a number in form state
                        form.setValue("categoryId", numberValue);
                        
                        // Log the form state after change to confirm it worked
                        console.log("CATEGORY SELECTION EVENT: Form values after change:", form.getValues());
                        console.log("CATEGORY SELECTION EVENT: Field value is now:", field.value);
                      }}
                      value={field.value?.toString() || ""}
                      disabled={isCategoriesLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Hardcoded categories as a fallback */}
                        {!Array.isArray(categoriesData) || categoriesData.length === 0 ? (
                          <>
                            <SelectItem value="1">Bath</SelectItem>
                            <SelectItem value="2">Beauty</SelectItem>
                            <SelectItem value="3">Children</SelectItem>
                            <SelectItem value="4">Household</SelectItem>
                            <SelectItem value="5">Cleaning</SelectItem>
                            <SelectItem value="6">Kitchen</SelectItem>
                            <SelectItem value="7">Vitamins and Supplements</SelectItem>
                            <SelectItem value="8">Food and Beverage</SelectItem>
                          </>
                        ) : (
                          // Map from API data when available
                          categoriesData.map((category: any) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Features */}
              <div className="space-y-4">
                <FormLabel>Features</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Original features */}
                  <FormField
                    control={form.control}
                    name="organic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              console.log("DEBUG: Organic checkbox changed to:", checked);
                              field.onChange(checked);
                              // Force update the form state with the correct boolean value
                              form.setValue("organic", !!checked);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Organic</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bpaFree"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              console.log("DEBUG: bpaFree checkbox changed to:", checked);
                              field.onChange(checked);
                              // Force update the form state with the correct boolean value
                              form.setValue("bpaFree", !!checked);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">BPA-Free</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  {/* New features */}
                  <FormField
                    control={form.control}
                    name="phthalateFree"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Phthalate-Free</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="parabenFree"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Paraben-Free</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="oxybenzoneFree"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Oxybenzone-Free</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="formaldehydeFree"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Formaldehyde-Free</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sulfatesFree"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Sulfates-Free</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fdcFree"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">FD&C-Free</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Affiliate Link */}
              <FormField
                control={form.control}
                name="affiliateLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Affiliate Link</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/product"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the affiliate link where users can purchase this product.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form actions */}
              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductForm;