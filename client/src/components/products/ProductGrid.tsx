import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, ShieldCheck } from 'lucide-react';

// Product interface that matches the server response
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  organic: boolean;
  bpaFree: boolean;
  category: {
    id: number;
    name: string;
    slug: string;
  };
}

interface ProductGridProps {
  products: Product[];
}

const ProductGrid = ({ products }: ProductGridProps) => {
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  
  const handleImageError = (productId: number) => {
    setImageError(prev => ({
      ...prev,
      [productId]: true
    }));
  };

  return (
    <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <Link href={`/products/${product.id}`}>
            <div className="cursor-pointer relative aspect-square overflow-hidden bg-gray-100">
              {imageError[product.id] ? (
                <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
                  <span className="text-sm">Image unavailable</span>
                </div>
              ) : (
                <img
                  src={product.image}
                  alt={product.name}
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  onError={() => handleImageError(product.id)}
                />
              )}
              <div className="absolute top-2 right-2 flex flex-col gap-2">
                {product.organic && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                    <Leaf className="h-3 w-3 mr-1" /> Organic
                  </Badge>
                )}
                {product.bpaFree && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                    <ShieldCheck className="h-3 w-3 mr-1" /> BPA-Free
                  </Badge>
                )}
              </div>
            </div>
          </Link>
          
          <CardContent className="p-4">
            <Link href={`/products/${product.id}`}>
              <h3 className="text-lg font-medium text-gray-900 cursor-pointer hover:text-primary transition-colors">
                {product.name}
              </h3>
            </Link>
            <Link href={`/products?category=${product.category.slug}`}>
              <span className="text-xs text-primary hover:underline cursor-pointer">
                {product.category.name}
              </span>
            </Link>
            <p className="mt-2 text-sm text-gray-500 line-clamp-2">
              {product.description}
            </p>
          </CardContent>
          
          <CardFooter className="p-4 pt-0 flex items-center justify-between">
            <div className="font-medium text-gray-900">${parseFloat(product.price).toFixed(2)}</div>
            <Link href={`/products/${product.id}`}>
              <Badge className="cursor-pointer">View Details</Badge>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default ProductGrid;