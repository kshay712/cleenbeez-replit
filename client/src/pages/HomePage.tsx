import Hero from "@/components/home/Hero";
import Benefits from "@/components/home/Benefits";
import ProductGrid from "@/components/products/ProductGrid";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

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

const HomePage = () => {
  const { data: featuredProducts, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <>
      <Hero />
      <Benefits />
      
      <section className="py-12 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl">
              Recommended Products
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-neutral-600 mx-auto">
              Clean and healthy products that we've carefully selected for you.
            </p>
          </div>
          
          <div className="mt-12">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
                    <Skeleton className="w-full h-64 rounded-md" />
                    <Skeleton className="w-1/4 h-4 mt-4" />
                    <Skeleton className="w-full h-6 mt-2" />
                    <Skeleton className="w-3/4 h-4 mt-2" />
                  </div>
                ))}
              </div>
            ) : (
              <ProductGrid products={featuredProducts ?? []} />
            )}
          </div>
          
          <div className="mt-12 text-center">
            <Button asChild size="lg">
              <Link href="/products" className="flex items-center">
                Explore All Products <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
