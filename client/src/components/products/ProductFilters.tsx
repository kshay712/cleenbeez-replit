import { useQuery } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";

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
  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

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

  const handlePriceChange = (value: number[]) => {
    onChange({ ...filters, minPrice: value[0], maxPrice: value[1] });
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-neutral-900">Categories</h3>
      <ul className="mt-4 space-y-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <li key={i} className="flex items-center">
              <Skeleton className="h-4 w-4 mr-3" />
              <Skeleton className="h-4 w-24" />
            </li>
          ))
        ) : categories ? (
          categories.map((category: any) => (
            <li key={category.id} className="flex items-center">
              <Checkbox 
                id={`category-${category.id}`}
                checked={filters.categories.includes(category.id.toString())}
                onCheckedChange={(checked) => handleCategoryChange(category.id.toString(), checked === true)}
                className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300 rounded"
              />
              <Label 
                htmlFor={`category-${category.id}`} 
                className="ml-3 text-sm text-neutral-700"
              >
                {category.name}
              </Label>
            </li>
          ))
        ) : (
          <li>No categories found</li>
        )}
      </ul>
      
      <div className="mt-8 border-t border-neutral-200 pt-6">
        <h3 className="text-lg font-medium text-neutral-900">Filters</h3>
        <div className="mt-4 space-y-3">
          <div className="flex items-center">
            <Checkbox 
              id="filter-organic"
              checked={filters.organic}
              onCheckedChange={(checked) => handleFeatureChange('organic', checked === true)}
              className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300 rounded"
            />
            <Label 
              htmlFor="filter-organic" 
              className="ml-3 text-sm text-neutral-700"
            >
              Organic
            </Label>
          </div>
          <div className="flex items-center">
            <Checkbox 
              id="filter-bpa-free"
              checked={filters.bpaFree}
              onCheckedChange={(checked) => handleFeatureChange('bpaFree', checked === true)}
              className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300 rounded"
            />
            <Label 
              htmlFor="filter-bpa-free" 
              className="ml-3 text-sm text-neutral-700"
            >
              BPA-Free
            </Label>
          </div>
        </div>
      </div>
      
      <div className="mt-8 border-t border-neutral-200 pt-6">
        <h3 className="text-lg font-medium text-neutral-900">Price Range</h3>
        <div className="mt-4">
          <div className="relative">
            <Slider 
              defaultValue={[filters.minPrice, filters.maxPrice]} 
              max={100} 
              step={1}
              onValueChange={handlePriceChange}
              className="w-full h-2"
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-neutral-600">${filters.minPrice}</span>
            <span className="text-sm text-neutral-600">${filters.maxPrice}+</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
