import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, ImagePlus } from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

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

// Define schema for product form
const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().positive('Price must be a positive number'),
  categoryId: z.string().min(1, 'Category is required'),
  organic: z.boolean().default(false),
  bpaFree: z.boolean().default(false),
  affiliateLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
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
  
  // Create form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      categoryId: '',
      organic: false,
      bpaFree: false,
      affiliateLink: '',
    },
  });

  // Fetch categories for dropdown
  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery<any[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch product data in edit mode
  const { data: productData, isLoading: isProductLoading } = useQuery<{ product: any }>({
    queryKey: [`/api/products/${productId}`],
    enabled: isEditMode,
  });

  // Update form with product data in edit mode
  useEffect(() => {
    if (isEditMode && productData) {
      const product = productData.product;
      
      form.reset({
        name: product.name,
        description: product.description,
        price: product.price,
        categoryId: product.category?.id.toString() || '',
        organic: product.organic,
        bpaFree: product.bpaFree,
        affiliateLink: product.affiliateLink || '',
      });
      
      if (product.image) {
        setImagePreview(product.image);
      }
    }
  }, [isEditMode, productData, form]);

  // Save product mutation
  const saveProductMutation = useMutation({
    mutationFn: async (values: ProductFormValues & { image?: File }) => {
      const formData = new FormData();
      
      // Add all form values
      Object.entries(values).forEach(([key, value]) => {
        if (key !== 'image' && value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      // Add image if provided
      if (values.image) {
        formData.append('image', values.image);
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
      
      // Invalidate both admin product list and regular product list
      queryClient.invalidateQueries({ queryKey: ['/api/products/admin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      // Redirect to the products list
      navigate('/admin/products');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || `Failed to ${isEditMode ? 'update' : 'create'} product`,
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

  // Submit form
  const onSubmit = (values: ProductFormValues) => {
    // Add image to values if provided
    const submitData = { ...values };
    if (imageFile) {
      (submitData as any).image = imageFile;
    }
    
    saveProductMutation.mutate(submitData as any);
  };
  
  // Cancel editing
  const handleCancel = () => {
    navigate('/admin/products');
  };

  const isLoading = isCategoriesLoading || isProductLoading || saveProductMutation.isPending;

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
                      Provide a detailed description of the product including benefits, ingredients, and usage.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(categoriesData) ? categoriesData.map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        )) : null}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Features */}
              <div className="space-y-4">
                <FormLabel>Features</FormLabel>
                <div className="flex flex-col gap-3">
                  <FormField
                    control={form.control}
                    name="organic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
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
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">BPA-Free</FormLabel>
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