import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Product interface that matches the server response
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  organic: boolean | null;
  bpaFree: boolean | null;
  phthalateFree: boolean | null;
  parabenFree: boolean | null;
  oxybenzoneFree: boolean | null;
  formaldehydeFree: boolean | null;
  sulfatesFree: boolean | null;
  fdcFree: boolean | null;
}

interface ProductGridProps {
  products: Product[];
  viewMode?: 'grid' | 'list';
}

const ProductGrid = ({ products, viewMode = 'grid' }: ProductGridProps) => {
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  
  const handleImageError = (productId: number) => {
    setImageError(prev => ({
      ...prev,
      [productId]: true
    }));
  };

  // Create feature map for each product
  const getProductFeatures = (product: Product) => {
    return [
      { enabled: product.organic, name: "Organic", className: "bg-green-100 text-green-800" },
      { enabled: product.bpaFree, name: "BPA-Free", className: "bg-blue-100 text-blue-800" },
      { enabled: product.phthalateFree, name: "Phthalate-Free", className: "bg-purple-100 text-purple-800" },
      { enabled: product.parabenFree, name: "Paraben-Free", className: "bg-indigo-100 text-indigo-800" },
      { enabled: product.oxybenzoneFree, name: "Oxybenzone-Free", className: "bg-red-100 text-red-800" },
      { enabled: product.formaldehydeFree, name: "Formaldehyde-Free", className: "bg-amber-100 text-amber-800" },
      { enabled: product.sulfatesFree, name: "Sulfates-Free", className: "bg-teal-100 text-teal-800" },
      { enabled: product.fdcFree, name: "FDC-Free", className: "bg-pink-100 text-pink-800" }
    ].filter(f => f.enabled);
  };

  // Count features for a product
  const countFeatures = (product: Product) => {
    return [
      product.organic,
      product.bpaFree,
      product.phthalateFree, 
      product.parabenFree,
      product.oxybenzoneFree,
      product.formaldehydeFree,
      product.sulfatesFree, 
      product.fdcFree
    ].filter(Boolean).length;
  };

  // Render Grid View
  if (viewMode === 'grid') {
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
                    loading="lazy"
                  />
                )}
                {/* Feature badges */}
                <div className="absolute top-0 right-0 flex flex-wrap gap-1 justify-end p-2 max-w-full bg-gradient-to-l from-white/90 to-transparent">
                  {getProductFeatures(product).map((feature, idx) => (
                    <Badge 
                      key={idx} 
                      className={`px-1.5 py-px text-xs font-normal ${feature.className}`}
                    >
                      {feature.name}
                    </Badge>
                  ))}
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
              <div className="flex items-center gap-2">
                <div className="font-medium text-gray-900">${parseFloat(product.price.toString()).toFixed(2)}</div>
                <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-800">
                  {countFeatures(product)} features
                </Badge>
              </div>
              <Link href={`/products/${product.id}`}>
                <Badge className="cursor-pointer">View Details</Badge>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
  
  // Render List View
  return (
    <div className="flex flex-col space-y-4">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row">
            <Link href={`/products/${product.id}`} className="md:w-1/4 max-w-[250px]">
              <div className="cursor-pointer relative aspect-square md:h-full overflow-hidden bg-gray-100">
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
                    loading="lazy"
                  />
                )}
              </div>
            </Link>
            
            <div className="flex-1 p-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div>
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
                  <p className="mt-2 text-sm text-gray-500">
                    {product.description.length > 200 
                      ? `${product.description.substring(0, 200)}...` 
                      : product.description}
                  </p>
                </div>
                
                <div className="mt-4 md:mt-0 md:ml-4 flex flex-col items-start md:items-end space-y-2">
                  <div className="font-medium text-xl text-gray-900">
                    ${parseFloat(product.price.toString()).toFixed(2)}
                  </div>
                  <Link href={`/products/${product.id}`}>
                    <Badge className="cursor-pointer">View Details</Badge>
                  </Link>
                </div>
              </div>
              
              {/* Feature badges - horizontal in list view */}
              <div className="mt-4 flex flex-wrap gap-1">
                {getProductFeatures(product).map((feature, idx) => (
                  <Badge 
                    key={idx} 
                    className={`px-2 py-1 text-xs font-normal ${feature.className}`}
                  >
                    {feature.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ProductGrid;