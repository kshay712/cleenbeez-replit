import { useAuth } from '@/hooks/useAuth';
import ProductForm from './ProductForm';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const EditProductPage = () => {
  const { isEditor } = useAuth();
  const [, navigate] = useLocation();
  const [match, params] = useRoute<{ id: string }>('/admin/products/edit/:id');
  const productId = params?.id;

  // Verify the product exists
  const { isLoading, error } = useQuery({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });

  if (!isEditor) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-5">Access Denied</h1>
        <p className="mb-4">You do not have permission to access this page.</p>
        <Button onClick={() => navigate('/')}>Go Back to Home</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-5">Product Not Found</h1>
        <p className="mb-4">The product you are trying to edit could not be found.</p>
        <Button onClick={() => navigate('/admin/products')}>Go Back to Products</Button>
      </div>
    );
  }

  return <ProductForm productId={productId} />;
};

export default EditProductPage;