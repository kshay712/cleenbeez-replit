import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Filter as FilterIcon, RollerCoaster, CircleDashed } from 'lucide-react';

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
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-neutral-900 flex items-center">
          <FilterIcon className="mr-2 h-5 w-5" />
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
            <div className="space-y-3 pt-1">
              <Slider
                min={0}
                max={500}
                step={5}
                value={priceRange}
                onValueChange={(values) => setPriceRange(values as [number, number])}
                className="mt-2"
                showSecondThumb={true}
              />
              
              <div className="flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-neutral-500">Min: </span>
                  <span className="font-medium">${priceRange[0]}</span>
                </div>
                <div className="text-xs">
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
                  onCheckedChange={(checked) => handleFeatureChange('organic', checked as boolean)}
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
                  onCheckedChange={(checked) => handleFeatureChange('bpaFree', checked as boolean)}
                />
                <Label 
                  htmlFor="bpa-free"
                  className="text-sm cursor-pointer flex items-center"
                >
                  <CircleDashed className="mr-1 h-4 w-4 text-blue-600" /> BPA-Free
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="phthalate-free" 
                  checked={filters.phthalateFree}
                  onCheckedChange={(checked) => handleFeatureChange('phthalateFree', checked as boolean)}
                />
                <Label 
                  htmlFor="phthalate-free"
                  className="text-sm cursor-pointer flex items-center"
                >
                  <CircleDashed className="mr-1 h-4 w-4 text-purple-600" /> Phthalate-Free
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="paraben-free" 
                  checked={filters.parabenFree}
                  onCheckedChange={(checked) => handleFeatureChange('parabenFree', checked as boolean)}
                />
                <Label 
                  htmlFor="paraben-free"
                  className="text-sm cursor-pointer flex items-center"
                >
                  <CircleDashed className="mr-1 h-4 w-4 text-red-600" /> Paraben-Free
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="oxybenzone-free" 
                  checked={filters.oxybenzoneFree}
                  onCheckedChange={(checked) => handleFeatureChange('oxybenzoneFree', checked as boolean)}
                />
                <Label 
                  htmlFor="oxybenzone-free"
                  className="text-sm cursor-pointer flex items-center"
                >
                  <CircleDashed className="mr-1 h-4 w-4 text-yellow-600" /> Oxybenzone-Free
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="formaldehyde-free" 
                  checked={filters.formaldehydeFree}
                  onCheckedChange={(checked) => handleFeatureChange('formaldehydeFree', checked as boolean)}
                />
                <Label 
                  htmlFor="formaldehyde-free"
                  className="text-sm cursor-pointer flex items-center"
                >
                  <CircleDashed className="mr-1 h-4 w-4 text-pink-600" /> Formaldehyde-Free
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="sulfates-free" 
                  checked={filters.sulfatesFree}
                  onCheckedChange={(checked) => handleFeatureChange('sulfatesFree', checked as boolean)}
                />
                <Label 
                  htmlFor="sulfates-free"
                  className="text-sm cursor-pointer flex items-center"
                >
                  <CircleDashed className="mr-1 h-4 w-4 text-teal-600" /> Sulfates-Free
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="fdc-free" 
                  checked={filters.fdcFree}
                  onCheckedChange={(checked) => handleFeatureChange('fdcFree', checked as boolean)}
                />
                <Label 
                  htmlFor="fdc-free"
                  className="text-sm cursor-pointer flex items-center"
                >
                  <CircleDashed className="mr-1 h-4 w-4 text-orange-600" /> FD&C-Free
                </Label>
              </div>
              
              {/* Removed clear button from here */}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Clear Filters button at the bottom of all filters */}
      {isFilterActive && (
        <div className="pt-4 mt-4 border-t border-neutral-200">
          <Button 
            variant="default" 
            size="default" 
            onClick={resetFilters}
            className="w-full text-sm font-medium flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white"
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