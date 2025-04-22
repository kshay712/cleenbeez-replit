import { useState } from "react";
import { Link } from "wouter";
import { Heart, Check, X, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CategoryBadge from "@/components/ui/CategoryBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Product {
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
  const [showDebug, setShowDebug] = useState(false); // Set to false by default in production
  
  // Count active features for badge
  const featureCount = [
    product.organic,
    product.bpaFree,
    product.phthalateFree, 
    product.parabenFree,
    product.oxybenzoneFree,
    product.formaldehydeFree,
    product.sulfatesFree, 
    product.fdcFree
  ].filter(Boolean).length;

  // Create array of feature objects for rendering
  const features = [
    { enabled: product.organic, name: "Organic", className: "bg-green-100 text-green-800" },
    { enabled: product.bpaFree, name: "BPA-Free", className: "bg-blue-100 text-blue-800" },
    { enabled: product.phthalateFree, name: "Phthalate-Free", className: "bg-purple-100 text-purple-800" },
    { enabled: product.parabenFree, name: "Paraben-Free", className: "bg-indigo-100 text-indigo-800" },
    { enabled: product.oxybenzoneFree, name: "Oxybenzone-Free", className: "bg-red-100 text-red-800" },
    { enabled: product.formaldehydeFree, name: "Formaldehyde-Free", className: "bg-amber-100 text-amber-800" },
    { enabled: product.sulfatesFree, name: "Sulfates-Free", className: "bg-teal-100 text-teal-800" },
    { enabled: product.fdcFree, name: "FDC-Free", className: "bg-pink-100 text-pink-800" }
  ];

  // Get active features only
  const activeFeatures = features.filter(f => f.enabled);

  // For mobile we'll only show the first 2 features directly
  const visibleFeatures = activeFeatures.slice(0, 2);
  const hiddenFeatures = activeFeatures.slice(2);
  const hasHiddenFeatures = hiddenFeatures.length > 0;
  
  return (
    <Link href={`/products/${product.id}`} className="block group">
      <div className="group relative product-card bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-4px]">
        {/* Debug panel that shows all feature statuses */}
        {showDebug && (
          <div className="absolute top-0 left-0 right-0 z-10 bg-amber-100 text-amber-800 p-2 text-sm font-medium">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="flex items-center gap-1">
                {product.organic ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-500" />}
                <span>Organic</span>
              </div>
              <div className="flex items-center gap-1">
                {product.bpaFree ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-500" />}
                <span>BPA-Free</span>
              </div>
              <div className="flex items-center gap-1">
                {product.phthalateFree ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-500" />}
                <span>Phthalate-Free</span>
              </div>
              <div className="flex items-center gap-1">
                {product.parabenFree ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-500" />}
                <span>Paraben-Free</span>
              </div>
              <div className="flex items-center gap-1">
                {product.oxybenzoneFree ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-500" />}
                <span>Oxybenzone-Free</span>
              </div>
              <div className="flex items-center gap-1">
                {product.formaldehydeFree ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-500" />}
                <span>Formaldehyde-Free</span>
              </div>
              <div className="flex items-center gap-1">
                {product.sulfatesFree ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-500" />}
                <span>Sulfates-Free</span>
              </div>
              <div className="flex items-center gap-1">
                {product.fdcFree ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-500" />}
                <span>FDC-Free</span>
              </div>
            </div>
          </div>
        )}

        {/* Product image section */}
        <div className="w-full bg-neutral-100 aspect-square sm:aspect-w-16 sm:aspect-h-9 overflow-hidden">
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
        
        {/* Feature badges section - show directly on desktop, limited with tooltip on mobile */}
        <div className="absolute top-0 right-0 flex flex-wrap justify-end p-2 max-w-full bg-gradient-to-l from-white/90 to-transparent">
          <div className="flex flex-wrap gap-1">
            {/* Always visible features */}
            {visibleFeatures.map((feature, idx) => (
              <Badge 
                key={idx} 
                className={`px-1.5 py-px text-xs font-normal ${feature.className}`}
              >
                {feature.name}
              </Badge>
            ))}
            
            {/* Extra features shown in tooltip on mobile */}
            {hasHiddenFeatures && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="px-1.5 py-px text-xs font-normal bg-primary-100 text-primary-800 cursor-pointer">
                      <Plus className="h-3 w-3 inline-block mr-0.5" />
                      {hiddenFeatures.length}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="flex flex-wrap gap-1 max-w-xs">
                    {hiddenFeatures.map((feature, idx) => (
                      <Badge 
                        key={idx} 
                        className={`px-1.5 py-px text-xs font-normal ${feature.className}`}
                      >
                        {feature.name}
                      </Badge>
                    ))}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        
        {/* Product details section */}
        <div className="p-3 sm:p-4">
          <div className="flex justify-between items-center mb-2">
            <CategoryBadge category={product.category.name} className="px-2 py-1 bg-neutral-100 rounded-full text-xs" />
            <div className="flex items-center">
              <span className="text-sm font-medium text-neutral-900">${parseFloat(product.price).toFixed(2)}</span>
            </div>
          </div>
          
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-2 line-clamp-2">
            {product.name}
          </h3>
          
          <p className="text-sm text-neutral-600 line-clamp-2 sm:line-clamp-3">
            {product.description}
          </p>
          
          <div className="mt-3 pt-3 border-t border-neutral-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-primary-600 group-hover:text-primary-700 flex items-center">
                View details
                <ChevronRight className="h-4 w-4 ml-0.5" />
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:inline-flex bg-amber-50 border-amber-200">
                {featureCount} features
              </Badge>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full text-neutral-400 hover:text-primary-500 hover:bg-primary-50"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Add to wishlist functionality would go here
                }}
              >
                <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Add to wishlist</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
