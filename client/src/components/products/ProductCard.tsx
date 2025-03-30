import { Link } from "wouter";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CategoryBadge from "@/components/ui/CategoryBadge";
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
        
        <div className="absolute top-0 right-0 flex flex-wrap gap-1 justify-end p-2 max-w-full bg-gradient-to-l from-white/90 to-transparent">
          {/* Direct rendering of badges for maximum control */}
          {product.organic && (
            <Badge className="bg-green-100 text-green-800 px-1.5 py-px text-xs font-normal">
              Organic
            </Badge>
          )}
          {product.bpaFree && (
            <Badge className="bg-blue-100 text-blue-800 px-1.5 py-px text-xs font-normal">
              BPA-Free
            </Badge>
          )}
          {product.phthalateFree && (
            <Badge className="bg-purple-100 text-purple-800 px-1.5 py-px text-xs font-normal">
              Phthalate-Free
            </Badge>
          )}
          {product.parabenFree && (
            <Badge className="bg-indigo-100 text-indigo-800 px-1.5 py-px text-xs font-normal">
              Paraben-Free
            </Badge>
          )}
          {product.oxybenzoneFree && (
            <Badge className="bg-red-100 text-red-800 px-1.5 py-px text-xs font-normal">
              Oxybenzone-Free
            </Badge>
          )}
          {product.formaldehydeFree && (
            <Badge className="bg-amber-100 text-amber-800 px-1.5 py-px text-xs font-normal">
              Formaldehyde-Free
            </Badge>
          )}
          {product.sulfatesFree && (
            <Badge className="bg-teal-100 text-teal-800 px-1.5 py-px text-xs font-normal">
              Sulfates-Free
            </Badge>
          )}
          {product.fdcFree && (
            <Badge className="bg-pink-100 text-pink-800 px-1.5 py-px text-xs font-normal">
              FDC-Free
            </Badge>
          )}
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
