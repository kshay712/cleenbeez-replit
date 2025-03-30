import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLocation } from 'wouter';

// Types
interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  image: string;
  organic: boolean;
  bpaFree: boolean;
  createdAt: string;
  updatedAt: string;
  affiliateLink?: string;
}

const AdminProductsPage = () => {
  const { isEditor, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Fetch products
  const { data, isLoading, error } = useQuery<{ products: Product[], total: number }>({
    queryKey: ['/api/products/admin'],
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/products/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Product deleted',
        description: 'The product has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products/admin'] });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete product',
      });
    },
  });

  // Handle create new product
  const handleCreateProduct = () => {
    navigate('/admin/products/new');
  };

  // Handle edit product
  const handleEditProduct = (id: number) => {
    navigate(`/admin/products/edit/${id}`);
  };

  // Handle delete product
  const handleDeleteProduct = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  if (!isEditor) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-5">Access Denied</h1>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Products</h1>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/categories')}
          >
            Manage Categories
          </Button>
          <Button onClick={handleCreateProduct}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading products...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-700">
          <p>Failed to load products. Please try again.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Features</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data && data.products && data.products.length > 0 ? (
                data.products.map((product: Product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="w-16 h-16 rounded overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/png?text=No+Image';
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-neutral-100">
                        {product.category.name}
                      </Badge>
                    </TableCell>
                    <TableCell>${parseFloat(product.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {product.organic && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                            Organic
                          </Badge>
                        )}
                        {product.bpaFree && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                            BPA-Free
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product.id)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <p className="text-neutral-500">No products found</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={handleCreateProduct}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add your first product
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this product
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProductsPage;