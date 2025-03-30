import { Link } from "wouter";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import CategoryBadge from "@/components/ui/CategoryBadge";
import ProductFeatures from "@/components/products/ProductFeatures";
import { useState } from "react";

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
  organic: boolean | null;
  bpaFree: boolean | null;
  phthalateFree: boolean | null;
  parabenFree: boolean | null;
  oxybenzoneFree: boolean | null;
  formaldehydeFree: boolean | null;
  sulfatesFree: boolean | null;
  fdcFree: boolean | null;
}

interface ProductCardProps {
  product: Product;
}

const PlaceholderImage = () => (
  <div className="w-full h-full bg-gradient-to-r from-neutral-200 to-neutral-300 flex items-center justify-center">
    <span className="text-neutral-400 text-xs">Image loading...</span>
  </div>
);

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <Link href={`/products/${product.id}`} className="block group">
      <div className="group relative product-card bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-4px]">
        <div className="w-full bg-neutral-100 aspect-w-16 aspect-h-9 overflow-hidden">
          {!imageLoaded && !imageError && <PlaceholderImage />}
          {!imageError ? (
            <img 
              src={product.image} 
              alt={product.name} 
              className={`w-full h-full object-center object-cover transform group-hover:scale-105 transition-transform duration-300 ease-in-out ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
              <span className="text-neutral-500 text-sm">No image available</span>
            </div>
          )}
        </div>
        
        <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end max-w-[80%]">
          <ProductFeatures 
            features={{
              organic: !!product.organic,
              bpaFree: !!product.bpaFree,
              phthalateFree: !!product.phthalateFree,
              parabenFree: !!product.parabenFree,
              oxybenzoneFree: !!product.oxybenzoneFree,
              formaldehydeFree: !!product.formaldehydeFree,
              sulfatesFree: !!product.sulfatesFree,
              fdcFree: !!product.fdcFree
            }}
            displayMode="badge"
            maxDisplay={8} /* Show all features */
            small={true}
          />
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <CategoryBadge category={product.category.name} className="px-2 py-1 bg-neutral-100 rounded-full text-xs" />
            <div className="flex items-center">
              <span className="text-sm font-medium text-neutral-900">${parseFloat(product.price).toFixed(2)}</span>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-neutral-900 mb-2 line-clamp-2 min-h-[3.5rem]">
            {product.name}
          </h3>
          
          <p className="text-sm text-neutral-600 line-clamp-3 min-h-[4.5rem]">
            {product.description}
          </p>
          
          <div className="mt-3 pt-3 border-t border-neutral-100 flex justify-between items-center">
            <span className="text-sm font-medium text-primary-600 group-hover:text-primary-700">
              View details
            </span>
            <Button variant="ghost" size="icon" className="rounded-full text-neutral-400 hover:text-primary-500 hover:bg-primary-50"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Add to wishlist functionality would go here
              }}
            >
              <Heart className="h-5 w-5" />
              <span className="sr-only">Add to wishlist</span>
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
