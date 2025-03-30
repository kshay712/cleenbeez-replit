import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ProductGrid from "@/components/products/ProductGrid";
import ProductFilters from "@/components/products/ProductFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Filter, 
  ChevronDown, 
  Search, 
  LayoutGrid, 
  List, 
  SlidersHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal 
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";

// Pagination component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const renderPageButtons = () => {
    const pages = [];
    const maxDisplayedPages = 5; // Max number of page buttons to show

    // Always show first page
    pages.push(
      <Button
        key={1}
        variant={currentPage === 1 ? "default" : "outline"}
        size="sm"
        onClick={() => onPageChange(1)}
        className="w-10"
      >
        1
      </Button>
    );

    // Show ellipsis if there are pages before the current range
    if (currentPage > 3) {
      pages.push(
        <Button key="start-ellipsis" variant="outline" size="sm" disabled className="w-10">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      );
    }

    // Calculate range of pages to show around current page
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    // Adjust range if we're near the start or end
    if (currentPage <= 3) {
      endPage = Math.min(totalPages - 1, maxDisplayedPages - 1);
    } else if (currentPage >= totalPages - 2) {
      startPage = Math.max(2, totalPages - maxDisplayedPages + 2);
    }

    // Add the range of page buttons
    for (let page = startPage; page <= endPage; page++) {
      pages.push(
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
          className="w-10"
        >
          {page}
        </Button>
      );
    }

    // Show ellipsis if there are pages after the current range
    if (currentPage < totalPages - 2 && totalPages > maxDisplayedPages) {
      pages.push(
        <Button key="end-ellipsis" variant="outline" size="sm" disabled className="w-10">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      );
    }

    // Always show last page if we have more than one page
    if (totalPages > 1) {
      pages.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(totalPages)}
          className="w-10"
        >
          {totalPages}
        </Button>
      );
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center space-x-2 py-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="w-10 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center space-x-2">
        {renderPageButtons()}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="w-10 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Product interface to match the data structure
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
  phthalateFree: boolean;
  parabenFree: boolean;
  oxybenzoneFree: boolean;
  formaldehydeFree: boolean;
  sulfatesFree: boolean;
  fdcFree: boolean;
}

// Response interface for the products API
interface ProductsResponse {
  products: Product[];
  pagination: {
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

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
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { toast } = useToast();
  
  const [filters, setFilters] = useState({
    categories: [] as string[],
    organic: false,
    bpaFree: false,
    phthalateFree: false,
    parabenFree: false,
    oxybenzoneFree: false,
    formaldehydeFree: false,
    sulfatesFree: false,
    fdcFree: false,
    minPrice: 0,
    maxPrice: 500,
  });

  // Parse query params
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const categoryFromUrl = searchParams.get('category');
  
  // Set initial category filter if provided in URL
  useEffect(() => {
    if (categoryFromUrl && !filters.categories.includes(categoryFromUrl)) {
      setFilters({
        ...filters,
        categories: [...filters.categories, categoryFromUrl],
      });
    }
  }, []);

  // Add search term to query params when needed
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1); // Reset to first page on new search
    }
  }, [debouncedSearchTerm, searchTerm]);

  // Handle view mode toggle
  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      categories: [],
      organic: false,
      bpaFree: false,
      phthalateFree: false,
      parabenFree: false,
      oxybenzoneFree: false,
      formaldehydeFree: false,
      sulfatesFree: false,
      fdcFree: false,
      minPrice: 0,
      maxPrice: 500,
    });
    setSearchTerm('');
    setSortBy('recommended');
    setCurrentPage(1);
    toast({
      title: "Filters cleared",
      description: "All product filters have been reset",
    });
  };

  // Build query params
  const queryParams = new URLSearchParams();
  if (currentPage > 1) queryParams.set('page', currentPage.toString());
  if (sortBy !== 'recommended') queryParams.set('sort', sortBy);
  
  // Add all feature filters to query params
  if (filters.organic) queryParams.set('organic', 'true');
  if (filters.bpaFree) queryParams.set('bpaFree', 'true');
  if (filters.phthalateFree) queryParams.set('phthalateFree', 'true');
  if (filters.parabenFree) queryParams.set('parabenFree', 'true');
  if (filters.oxybenzoneFree) queryParams.set('oxybenzoneFree', 'true');
  if (filters.formaldehydeFree) queryParams.set('formaldehydeFree', 'true');
  if (filters.sulfatesFree) queryParams.set('sulfatesFree', 'true');
  if (filters.fdcFree) queryParams.set('fdcFree', 'true');
  
  // Add categories and price range
  if (filters.categories.length > 0) {
    filters.categories.forEach(cat => queryParams.append('category', cat));
  }
  if (filters.minPrice > 0) queryParams.set('minPrice', filters.minPrice.toString());
  if (filters.maxPrice < 500) queryParams.set('maxPrice', filters.maxPrice.toString());
  if (debouncedSearchTerm) queryParams.set('search', debouncedSearchTerm);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: [`/api/products${queryString}`],
    staleTime: 0, // Always fetch fresh data 
    refetchOnWindowFocus: true, // Refetch when window regains focus
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
            
            {/* Search bar and desktop controls */}
            <div className="mb-6">
              <div className="relative flex gap-3 mb-4">
                <div className="relative flex-grow">
                  <Input
                    type="search"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                </div>
                <div className="hidden lg:flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleViewMode}
                    className="h-10 w-10"
                    title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
                  >
                    {viewMode === 'grid' ? (
                      <List className="h-4 w-4" />
                    ) : (
                      <LayoutGrid className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-sm"
                  >
                    Clear filters
                  </Button>
                </div>
              </div>
              
              {/* Active filters */}
              {(filters.categories.length > 0 || 
                filters.organic || 
                filters.bpaFree || 
                filters.phthalateFree || 
                filters.parabenFree || 
                filters.oxybenzoneFree || 
                filters.formaldehydeFree || 
                filters.sulfatesFree || 
                filters.fdcFree || 
                filters.minPrice > 0 || 
                filters.maxPrice < 500) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {/* Categories */}
                  {filters.categories.length > 0 && filters.categories.map(cat => (
                    <Badge key={cat} variant="secondary" className="bg-primary-50 text-primary-700 hover:bg-primary-100">
                      Category: {cat}
                      <button 
                        className="ml-1 text-primary-500 hover:text-primary-700" 
                        onClick={() => handleFilterChange({
                          ...filters, 
                          categories: filters.categories.filter(c => c !== cat)
                        })}
                      >
                        &times;
                      </button>
                    </Badge>
                  ))}
                  
                  {/* Feature filters */}
                  {filters.organic && (
                    <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
                      Organic
                      <button 
                        className="ml-1 text-green-500 hover:text-green-700" 
                        onClick={() => handleFilterChange({...filters, organic: false})}
                      >
                        &times;
                      </button>
                    </Badge>
                  )}
                  {filters.bpaFree && (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                      BPA-Free
                      <button 
                        className="ml-1 text-blue-500 hover:text-blue-700" 
                        onClick={() => handleFilterChange({...filters, bpaFree: false})}
                      >
                        &times;
                      </button>
                    </Badge>
                  )}
                  {filters.phthalateFree && (
                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
                      Phthalate-Free
                      <button 
                        className="ml-1 text-purple-500 hover:text-purple-700" 
                        onClick={() => handleFilterChange({...filters, phthalateFree: false})}
                      >
                        &times;
                      </button>
                    </Badge>
                  )}
                  {filters.parabenFree && (
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                      Paraben-Free
                      <button 
                        className="ml-1 text-indigo-500 hover:text-indigo-700" 
                        onClick={() => handleFilterChange({...filters, parabenFree: false})}
                      >
                        &times;
                      </button>
                    </Badge>
                  )}
                  {filters.oxybenzoneFree && (
                    <Badge variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100">
                      Oxybenzone-Free
                      <button 
                        className="ml-1 text-pink-500 hover:text-pink-700" 
                        onClick={() => handleFilterChange({...filters, oxybenzoneFree: false})}
                      >
                        &times;
                      </button>
                    </Badge>
                  )}
                  {filters.formaldehydeFree && (
                    <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100">
                      Formaldehyde-Free
                      <button 
                        className="ml-1 text-red-500 hover:text-red-700" 
                        onClick={() => handleFilterChange({...filters, formaldehydeFree: false})}
                      >
                        &times;
                      </button>
                    </Badge>
                  )}
                  {filters.sulfatesFree && (
                    <Badge variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-100">
                      Sulfates-Free
                      <button 
                        className="ml-1 text-orange-500 hover:text-orange-700" 
                        onClick={() => handleFilterChange({...filters, sulfatesFree: false})}
                      >
                        &times;
                      </button>
                    </Badge>
                  )}
                  {filters.fdcFree && (
                    <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100">
                      FD&C-Free
                      <button 
                        className="ml-1 text-yellow-500 hover:text-yellow-700" 
                        onClick={() => handleFilterChange({...filters, fdcFree: false})}
                      >
                        &times;
                      </button>
                    </Badge>
                  )}
                  
                  {/* Price range */}
                  {(filters.minPrice > 0 || filters.maxPrice < 500) && (
                    <Badge variant="secondary" className="bg-neutral-50 text-neutral-700 hover:bg-neutral-100">
                      Price: ${filters.minPrice} - ${filters.maxPrice}
                      <button 
                        className="ml-1 text-neutral-500 hover:text-neutral-700" 
                        onClick={() => handleFilterChange({...filters, minPrice: 0, maxPrice: 500})}
                      >
                        &times;
                      </button>
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Desktop sorting */}
              <div className="hidden lg:flex lg:items-center lg:justify-end">
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