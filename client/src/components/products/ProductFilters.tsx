import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { 
  Filter as FilterIcon, 
  RollerCoaster, 
  CircleDashed,
  Leaf,
  Droplets,
  Zap,
  Heart,
  ShieldAlert,
  Flame,
  Hammer
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

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
    phthalateFree: boolean;
    parabenFree: boolean;
    oxybenzoneFree: boolean;
    formaldehydeFree: boolean;
    sulfatesFree: boolean;
    fdcFree: boolean;
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
  
  // Feature filter change handler
  const handleFeatureChange = (feature: string, checked: boolean) => {
    onChange({
      ...filters,
      [feature]: checked
    });
  };
  
  // Reset all filters
  const resetFilters = () => {
    onChange({
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
      maxPrice: 500
    });
    setPriceRange([0, 500]);
  };
  
  // Check if any filter is active
  const isFilterActive = 
    filters.categories.length > 0 || 
    filters.organic || 
    filters.bpaFree || 
    filters.phthalateFree || 
    filters.parabenFree || 
    filters.oxybenzoneFree || 
    filters.formaldehydeFree || 
    filters.sulfatesFree || 
    filters.fdcFree || 
    filters.minPrice > 0 || 
    filters.maxPrice < 500;
    
  // Count active filters  
  const activeFiltersCount = (
    filters.categories.length + 
    (filters.organic ? 1 : 0) + 
    (filters.bpaFree ? 1 : 0) + 
    (filters.phthalateFree ? 1 : 0) + 
    (filters.parabenFree ? 1 : 0) + 
    (filters.oxybenzoneFree ? 1 : 0) + 
    (filters.formaldehydeFree ? 1 : 0) + 
    (filters.sulfatesFree ? 1 : 0) + 
    (filters.fdcFree ? 1 : 0) + 
    ((filters.minPrice > 0 || filters.maxPrice < 500) ? 1 : 0)
  );
  
  // Features with better icons for mobile
  const featureFilters = [
    { id: 'organic', label: 'Organic', icon: <Leaf className="h-5 w-5 text-green-600" />, checked: filters.organic, color: 'bg-green-100 border-green-200 text-green-800' },
    { id: 'bpaFree', label: 'BPA-Free', icon: <ShieldAlert className="h-5 w-5 text-blue-600" />, checked: filters.bpaFree, color: 'bg-blue-100 border-blue-200 text-blue-800' },
    { id: 'phthalateFree', label: 'Phthalate-Free', icon: <Droplets className="h-5 w-5 text-purple-600" />, checked: filters.phthalateFree, color: 'bg-purple-100 border-purple-200 text-purple-800' },
    { id: 'parabenFree', label: 'Paraben-Free', icon: <Zap className="h-5 w-5 text-indigo-600" />, checked: filters.parabenFree, color: 'bg-indigo-100 border-indigo-200 text-indigo-800' },
    { id: 'oxybenzoneFree', label: 'Oxybenzone-Free', icon: <Heart className="h-5 w-5 text-red-600" />, checked: filters.oxybenzoneFree, color: 'bg-red-100 border-red-200 text-red-800' },
    { id: 'formaldehydeFree', label: 'Formaldehyde-Free', icon: <Flame className="h-5 w-5 text-amber-600" />, checked: filters.formaldehydeFree, color: 'bg-amber-100 border-amber-200 text-amber-800' },
    { id: 'sulfatesFree', label: 'Sulfates-Free', icon: <Droplets className="h-5 w-5 text-teal-600" />, checked: filters.sulfatesFree, color: 'bg-teal-100 border-teal-200 text-teal-800' },
    { id: 'fdcFree', label: 'FD&C-Free', icon: <Hammer className="h-5 w-5 text-orange-600" />, checked: filters.fdcFree, color: 'bg-orange-100 border-orange-200 text-orange-800' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-neutral-900 flex items-center">
            <FilterIcon className="mr-2 h-5 w-5" />
            Filters
          </h3>
          <p className="text-sm text-neutral-500">
            Narrow down your results
          </p>
        </div>
        
        {activeFiltersCount > 0 && (
          <Badge className="bg-primary-100 text-primary-800 border-primary-200 px-2.5 py-1">
            {activeFiltersCount} active
          </Badge>
        )}
      </div>
      
      <Separator />
      
      <Accordion type="multiple" defaultValue={["categories", "price", "features"]}>
        <AccordionItem value="categories">
          <AccordionTrigger className="font-medium text-base py-3">
            Categories
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-1">
              {categories ? (
                categories.map(category => (
                  <div key={category.id} className="flex items-center space-x-3">
                    <Checkbox 
                      id={`category-${category.slug}`} 
                      checked={filters.categories.includes(category.slug)}
                      onCheckedChange={(checked) => 
                        handleCategoryChange(category.slug, checked as boolean)
                      }
                      className="h-5 w-5"
                    />
                    <Label 
                      htmlFor={`category-${category.slug}`}
                      className="text-base cursor-pointer py-1"
                    >
                      {category.name}
                    </Label>
                  </div>
                ))
              ) : (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-6 bg-neutral-100 rounded animate-pulse"></div>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="price">
          <AccordionTrigger className="font-medium text-base py-3">
            Price Range
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-5 pt-2 px-1">
              <Slider
                min={0}
                max={500}
                step={5}
                value={priceRange}
                onValueChange={(values) => setPriceRange(values as [number, number])}
                className="mt-6"
                showSecondThumb={true}
              />
              
              <div className="flex items-center justify-between mt-4">
                <div className="px-4 py-2 border border-neutral-200 rounded-md w-24 text-center">
                  <div className="text-xs text-neutral-500">Min</div>
                  <div className="font-medium">${priceRange[0]}</div>
                </div>
                
                <div className="px-4 py-2 border border-neutral-200 rounded-md w-24 text-center">
                  <div className="text-xs text-neutral-500">Max</div>
                  <div className="font-medium">${priceRange[1]}</div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="features">
          <AccordionTrigger className="font-medium text-base py-3">
            Features
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-1">
              {/* List of feature checkboxes with better tap targets */}
              {featureFilters.map(feature => (
                <div 
                  key={feature.id}
                  className={`flex items-center p-2 rounded-md border ${feature.checked ? feature.color : 'border-neutral-200'}`}
                >
                  <Checkbox 
                    id={feature.id} 
                    checked={feature.checked}
                    onCheckedChange={(checked) => handleFeatureChange(feature.id, checked as boolean)}
                    className="h-5 w-5"
                  />
                  <Label 
                    htmlFor={feature.id}
                    className="text-base cursor-pointer flex items-center ml-3 flex-grow py-1"
                  >
                    {feature.icon}
                    <span className="ml-2">{feature.label}</span>
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Clear Filters button at the bottom of all filters */}
      {isFilterActive && (
        <div className="pt-4 mt-4 border-t border-neutral-200">
          <Button 
            variant="default" 
            size="lg" 
            onClick={resetFilters}
            className="w-full font-medium flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-6 rounded-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
            Reset All Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;