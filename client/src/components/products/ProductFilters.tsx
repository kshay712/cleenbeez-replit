import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { ShoppingBasket, RollerCoaster, CircleDashed } from 'lucide-react';

// Category interface to match server response
interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ProductFiltersProps {
  filters: {
    categories: string[];
    organic: boolean;
    bpaFree: boolean;
    minPrice: number;
    maxPrice: number;
  };
  onChange: (filters: ProductFiltersProps['filters']) => void;
}

const ProductFilters = ({ filters, onChange }: ProductFiltersProps) => {
  // Local state for price range
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice,
    filters.maxPrice
  ]);
  
  // Query to fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  // Update parent component with debounced price filters
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (priceRange[0] !== filters.minPrice || priceRange[1] !== filters.maxPrice) {
        onChange({
          ...filters,
          minPrice: priceRange[0],
          maxPrice: priceRange[1]
        });
      }
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [priceRange]);
  
  // Handle category checkbox change
  const handleCategoryChange = (categorySlug: string, checked: boolean) => {
    let newCategories;
    
    if (checked) {
      newCategories = [...filters.categories, categorySlug];
    } else {
      newCategories = filters.categories.filter(c => c !== categorySlug);
    }
    
    onChange({
      ...filters,
      categories: newCategories
    });
  };
  
  // Handle organic checkbox change
  const handleOrganicChange = (checked: boolean) => {
    onChange({
      ...filters,
      organic: checked
    });
  };
  
  // Handle BPA-free checkbox change
  const handleBpaFreeChange = (checked: boolean) => {
    onChange({
      ...filters,
      bpaFree: checked
    });
  };
  
  // Reset all filters
  const resetFilters = () => {
    onChange({
      categories: [],
      organic: false,
      bpaFree: false,
      minPrice: 0,
      maxPrice: 100
    });
    setPriceRange([0, 100]);
  };
  
  // Check if any filter is active
  const isFilterActive = 
    filters.categories.length > 0 || 
    filters.organic || 
    filters.bpaFree || 
    filters.minPrice > 0 || 
    filters.maxPrice < 100;
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-neutral-900 flex items-center">
          <ShoppingBasket className="mr-2 h-5 w-5" />
          Filters
        </h3>
        <p className="text-sm text-neutral-500">
          Narrow down your results.
        </p>
      </div>
      
      <Separator />
      
      <Accordion type="multiple" defaultValue={["categories", "price", "features"]}>
        <AccordionItem value="categories">
          <AccordionTrigger className="font-medium">
            Categories
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-1">
              {categories ? (
                categories.map(category => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`category-${category.slug}`} 
                      checked={filters.categories.includes(category.slug)}
                      onCheckedChange={(checked) => 
                        handleCategoryChange(category.slug, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`category-${category.slug}`}
                      className="text-sm cursor-pointer"
                    >
                      {category.name}
                    </Label>
                  </div>
                ))
              ) : (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-5 bg-neutral-100 rounded animate-pulse"></div>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="price">
          <AccordionTrigger className="font-medium">
            Price Range
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <Slider
                min={0}
                max={100}
                step={1}
                value={priceRange}
                onValueChange={(values) => setPriceRange(values as [number, number])}
                className="mt-4"
              />
              
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-neutral-500">Min: </span>
                  <span className="font-medium">${priceRange[0]}</span>
                </div>
                <div className="text-sm">
                  <span className="text-neutral-500">Max: </span>
                  <span className="font-medium">${priceRange[1]}</span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="features">
          <AccordionTrigger className="font-medium">
            Features
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-1">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="organic" 
                  checked={filters.organic}
                  onCheckedChange={(checked) => handleOrganicChange(checked as boolean)}
                />
                <Label 
                  htmlFor="organic"
                  className="text-sm cursor-pointer flex items-center"
                >
                  <RollerCoaster className="mr-1 h-4 w-4 text-green-600" /> Organic
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="bpa-free" 
                  checked={filters.bpaFree}
                  onCheckedChange={(checked) => handleBpaFreeChange(checked as boolean)}
                />
                <Label 
                  htmlFor="bpa-free"
                  className="text-sm cursor-pointer flex items-center"
                >
                  <CircleDashed className="mr-1 h-4 w-4 text-blue-600" /> BPA-Free
                </Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      {isFilterActive && (
        <div className="pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetFilters}
            className="w-full text-sm"
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;