import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Leaf, Heart, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

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

const Hero = () => {
  const { data: featuredProducts, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <section className="bg-gradient-to-b from-amber-50 via-primary-50 to-white overflow-hidden relative pt-8">
      {/* Decorative hexagons */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-primary-200"
            style={{
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: 0.2 + Math.random() * 0.3
            }}
          />
        ))}
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
              <span className="block">Discover products</span>
              <span className="block text-primary-600">that are good for you</span>
            </h1>
            
            <p className="mt-5 text-base text-neutral-600 sm:text-lg md:text-xl">
              Clean Bee helps you find health-conscious products with transparent ingredients, organic options, and eco-friendly alternatives – all in one place.
            </p>
            
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center text-sm font-medium text-neutral-700">
                <ShieldCheck className="h-5 w-5 text-primary-600 mr-1.5" />
                <span>Verified ingredients</span>
              </div>
              <div className="flex items-center text-sm font-medium text-neutral-700">
                <Leaf className="h-5 w-5 text-green-600 mr-1.5" />
                <span>Eco-friendly options</span>
              </div>
              <div className="flex items-center text-sm font-medium text-neutral-700">
                <Heart className="h-5 w-5 text-red-500 mr-1.5" />
                <span>Health-focused</span>
              </div>
            </div>
            
            <div className="mt-8">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/products">
                  Discover More
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="mt-10 lg:mt-0 lg:pl-8">
            <h3 className="text-xl font-bold text-primary-700 mb-4">Popular Products</h3>
            <div className="grid grid-cols-1 gap-4">
              {isLoading ? (
                // Loading skeleton
                [...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-4 flex items-center space-x-4">
                    <Skeleton className="h-16 w-16 rounded-md" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))
              ) : featuredProducts && featuredProducts.length > 0 ? (
                // Display featured products
                featuredProducts.slice(0, 3).map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <div className="bg-white rounded-lg shadow-sm p-4 flex items-center space-x-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="h-16 w-16 bg-neutral-100 rounded-md overflow-hidden">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ShieldCheck className="h-8 w-8 text-primary-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-900">{product.name}</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600">{product.category.name}</span>
                          <span className="text-sm font-medium text-primary-700">${product.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-neutral-400" />
                    </div>
                  </Link>
                ))
              ) : (
                // No products found
                <div className="bg-white rounded-lg shadow-sm p-4 flex items-center space-x-4">
                  <div className="h-16 w-16 bg-neutral-100 rounded-md overflow-hidden flex items-center justify-center">
                    <ShieldCheck className="h-8 w-8 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900">No products found</h4>
                    <p className="text-sm text-neutral-600">Check back soon for new products</p>
                  </div>
                </div>
              )}
              
              <Link href="/products" className="flex items-center justify-end text-sm font-medium text-primary-600 hover:text-primary-500 mt-1">
                See all products <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
