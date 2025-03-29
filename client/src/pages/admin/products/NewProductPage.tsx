import { useAuth } from '@/hooks/useAuth';
import ProductForm from './ProductForm';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

const NewProductPage = () => {
  const { isEditor } = useAuth();
  const [, navigate] = useLocation();

  if (!isEditor) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-5">Access Denied</h1>
        <p className="mb-4">You do not have permission to access this page.</p>
        <Button onClick={() => navigate('/')}>Go Back to Home</Button>
      </div>
    );
  }

  return <ProductForm />;
};

export default NewProductPage;