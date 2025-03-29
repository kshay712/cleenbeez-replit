import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ProductGrid from "@/components/products/ProductGrid";
import ProductFilters from "@/components/products/ProductFilters";
import Pagination from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: Low to high" },
  { value: "price-desc", label: "Price: High to low" },
  { value: "newest", label: "Newest" },
];

const ProductsPage = () => {
  const [location] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("recommended");
  const [filters, setFilters] = useState({
    categories: [] as string[],
    organic: false,
    bpaFree: false,
    minPrice: 0,
    maxPrice: 100,
  });

  // Parse query params
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const categoryFromUrl = searchParams.get('category');
  
  // Set initial category filter if provided in URL
  useState(() => {
    if (categoryFromUrl && !filters.categories.includes(categoryFromUrl)) {
      setFilters({
        ...filters,
        categories: [...filters.categories, categoryFromUrl],
      });
    }
  });

  // Build query params
  const queryParams = new URLSearchParams();
  if (currentPage > 1) queryParams.set('page', currentPage.toString());
  if (sortBy !== 'recommended') queryParams.set('sort', sortBy);
  if (filters.organic) queryParams.set('organic', 'true');
  if (filters.bpaFree) queryParams.set('bpaFree', 'true');
  if (filters.categories.length > 0) {
    filters.categories.forEach(cat => queryParams.append('category', cat));
  }
  if (filters.minPrice > 0) queryParams.set('minPrice', filters.minPrice.toString());
  if (filters.maxPrice < 100) queryParams.set('maxPrice', filters.maxPrice.toString());

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  const { data, isLoading } = useQuery({
    queryKey: [`/api/products${queryString}`],
  });

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1); // Reset to first page when sort changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return (
    <section className="py-12 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl">Discover Clean Products</h1>
          <p className="mt-4 max-w-2xl text-xl text-neutral-600 mx-auto">
            Browse our curated selection of health-conscious products.
          </p>
        </div>
        
        <div className="mt-12 lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Filters sidebar - Desktop */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24">
              <ProductFilters filters={filters} onChange={handleFilterChange} />
            </div>
          </div>
          
          {/* Product grid */}
          <div className="mt-6 lg:mt-0 lg:col-span-9">
            {/* Mobile filters button */}
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>
                      Refine your product search
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4">
                    <ProductFilters filters={filters} onChange={handleFilterChange} />
                  </div>
                </SheetContent>
              </Sheet>
              
              <div>
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Desktop sorting */}
            <div className="hidden lg:flex lg:items-center lg:justify-end mb-6">
              <span className="text-sm font-medium text-neutral-700 mr-2">Sort by</span>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Products */}
            {isLoading ? (
              <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
                    <Skeleton className="w-full h-64 rounded-md" />
                    <Skeleton className="w-1/4 h-4 mt-4" />
                    <Skeleton className="w-full h-6 mt-2" />
                    <Skeleton className="w-3/4 h-4 mt-2" />
                  </div>
                ))}
              </div>
            ) : data?.products && data.products.length > 0 ? (
              <ProductGrid products={data.products} />
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-neutral-900">No products found</h3>
                <p className="mt-1 text-neutral-500">Try adjusting your filters or search term</p>
              </div>
            )}
            
            {/* Pagination */}
            {data?.pagination && (
              <Pagination 
                currentPage={currentPage}
                totalPages={data.pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductsPage;
