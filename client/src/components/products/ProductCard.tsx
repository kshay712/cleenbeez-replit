import { Link } from "wouter";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeatureBadge from "@/components/ui/FeatureBadge";
import CategoryBadge from "@/components/ui/CategoryBadge";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  image: string;
  organic: boolean;
  bpaFree: boolean;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="group relative product-card bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="w-full min-h-64 bg-neutral-200 aspect-w-4 aspect-h-3 overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-center object-cover transform group-hover:scale-105 transition-transform duration-300 ease-in-out"
        />
      </div>
      
      <div className="absolute top-2 right-2 flex space-x-1">
        {product.organic && <FeatureBadge type="organic" />}
        {product.bpaFree && <FeatureBadge type="bpafree" />}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between">
          <CategoryBadge category={product.category.name} />
          <div className="flex items-center">
            <span className="text-sm font-medium text-neutral-900">${product.price.toFixed(2)}</span>
          </div>
        </div>
        
        <h3 className="mt-1 text-lg font-semibold text-neutral-900">
          <Link href={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        
        <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{product.description}</p>
        
        <div className="mt-4 flex justify-between items-center">
          <Link href={`/products/${product.id}`} className="text-sm font-medium text-primary-600 hover:text-primary-500">
            View details
          </Link>
          <Button variant="ghost" size="icon" className="rounded-full text-primary-600 hover:text-primary-500 hover:bg-primary-50">
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
