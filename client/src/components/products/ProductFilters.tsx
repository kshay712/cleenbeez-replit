import { useQuery } from "@tanstack/react-query";
import { CheckIcon, Leaf, ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface FiltersProps {
  filters: {
    categories: string[];
    organic: boolean;
    bpaFree: boolean;
    minPrice: number;
    maxPrice: number;
  };
  onChange: (filters: any) => void;
}

const ProductFilters: React.FC<FiltersProps> = ({ filters, onChange }) => {
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["/api/categories"],
  });
  
  // Ensure categories is an array of Category objects
  const categories: Category[] = Array.isArray(categoriesData) ? categoriesData as Category[] : [];

  const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice);

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    let newCategories;
    if (checked) {
      newCategories = [...filters.categories, categoryId];
    } else {
      newCategories = filters.categories.filter(id => id !== categoryId);
    }
    
    onChange({ ...filters, categories: newCategories });
  };

  const handleFeatureChange = (feature: 'organic' | 'bpaFree', checked: boolean) => {
    onChange({ ...filters, [feature]: checked });
  };

  const handlePriceSliderChange = (value: number[]) => {
    setLocalMinPrice(value[0]);
    setLocalMaxPrice(value[1]);
  };

  const handlePriceInputChange = (type: 'min' | 'max', value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;
    
    if (type === 'min') {
      setLocalMinPrice(numValue);
    } else {
      setLocalMaxPrice(numValue);
    }
  };

  const applyPriceFilter = () => {
    onChange({ 
      ...filters, 
      minPrice: localMinPrice, 
      maxPrice: localMaxPrice 
    });
  };

  const getProductCountByCategory = (categoryId: string) => {
    // This would ideally come from the API but for now we'll return a placeholder
    return Math.floor(Math.random() * 30) + 1; // Mock count for demo purposes
  };

  return (
    <div className="filter-panel w-full">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Categories</h3>
        <ScrollArea className="h-60 pr-4">
          <ul className="space-y-3">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <li key={i} className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-3" />
                  <Skeleton className="h-4 w-24" />
                </li>
              ))
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <li key={category.id} className="flex items-center justify-between group hover:bg-neutral-50 p-1 rounded-md">
                  <div className="flex items-center">
                    <Checkbox 
                      id={`category-${category.id}`}
                      checked={filters.categories.includes(category.id.toString())}
                      onCheckedChange={(checked) => handleCategoryChange(category.id.toString(), checked === true)}
                      className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300 rounded"
                    />
                    <Label 
                      htmlFor={`category-${category.id}`} 
                      className="ml-3 text-sm text-neutral-700 cursor-pointer"
                    >
                      {category.name}
                    </Label>
                  </div>
                  <span className="text-xs text-neutral-500 group-hover:text-neutral-700">
                    ({getProductCountByCategory(category.id.toString())})
                  </span>
                </li>
              ))
            ) : (
              <li>No categories found</li>
            )}
          </ul>
        </ScrollArea>
      </div>
      
      <div className="mb-6 border-t border-neutral-200 pt-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Features</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between hover:bg-neutral-50 p-2 rounded-md cursor-pointer group">
            <div className="flex items-center">
              <Checkbox 
                id="filter-organic"
                checked={filters.organic}
                onCheckedChange={(checked) => handleFeatureChange('organic', checked === true)}
                className="h-4 w-4 text-secondary-500 focus:ring-secondary-500 border-neutral-300 rounded"
              />
              <Label 
                htmlFor="filter-organic" 
                className="ml-3 text-sm text-neutral-700 cursor-pointer flex items-center"
              >
                <Leaf className="h-4 w-4 text-secondary-500 mr-2" />
                Organic
              </Label>
            </div>
          </div>
          
          <div className="flex items-center justify-between hover:bg-neutral-50 p-2 rounded-md cursor-pointer group">
            <div className="flex items-center">
              <Checkbox 
                id="filter-bpa-free"
                checked={filters.bpaFree}
                onCheckedChange={(checked) => handleFeatureChange('bpaFree', checked === true)}
                className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300 rounded"
              />
              <Label 
                htmlFor="filter-bpa-free" 
                className="ml-3 text-sm text-neutral-700 cursor-pointer flex items-center"
              >
                <ShieldCheck className="h-4 w-4 text-primary-500 mr-2" />
                BPA-Free
              </Label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-neutral-200 pt-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Price Range</h3>
        <div>
          <div className="relative mb-6">
            <Slider 
              value={[localMinPrice, localMaxPrice]} 
              max={100} 
              step={1}
              onValueChange={handlePriceSliderChange}
              className="w-full h-2"
            />
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-1/2">
              <Label htmlFor="min-price" className="text-sm text-neutral-700 mb-1 block">
                Min ($)
              </Label>
              <Input 
                id="min-price"
                type="number" 
                value={localMinPrice}
                onChange={(e) => handlePriceInputChange('min', e.target.value)}
                className="w-full"
                min={0}
                max={localMaxPrice}
              />
            </div>
            <div className="w-1/2">
              <Label htmlFor="max-price" className="text-sm text-neutral-700 mb-1 block">
                Max ($)
              </Label>
              <Input 
                id="max-price"
                type="number" 
                value={localMaxPrice}
                onChange={(e) => handlePriceInputChange('max', e.target.value)}
                className="w-full"
                min={localMinPrice}
                max={100}
              />
            </div>
          </div>
          
          <Button 
            onClick={applyPriceFilter}
            className="w-full"
          >
            Apply Filter
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
