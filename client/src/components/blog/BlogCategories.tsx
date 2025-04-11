import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: number;
  name: string;
  slug: string;
  postCount: number;
}

interface BlogCategoriesProps {
  selectedCategory: string | null;
  onChange: (categoryId: string | null) => void;
}

const BlogCategories: React.FC<BlogCategoriesProps> = ({ selectedCategory, onChange }) => {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['/api/blog/categories'],
  });

  // Find the currently selected category name for display purposes
  const getSelectedCategoryName = () => {
    if (!selectedCategory || !categories) return null;
    const category = categories.find(cat => cat.id.toString() === selectedCategory);
    return category ? category.name : null;
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-neutral-900">Categories</h3>
      {isLoading ? (
        <ul className="mt-4 space-y-4">
          {[...Array(6)].map((_, i) => (
            <li key={i}>
              <Skeleton className="h-5 w-32" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-4 space-y-4">
          <li>
            <button
              onClick={() => onChange(null)}
              className={`text-${selectedCategory === null ? 'primary-600' : 'neutral-700'} hover:text-primary-600`}
            >
              All Posts
            </button>
          </li>
          {categories?.map((category) => (
            <li key={category.id}>
              <button
                onClick={() => onChange(category.id.toString())}
                className={`text-${selectedCategory === category.id.toString() ? 'primary-600' : 'neutral-700'} hover:text-primary-600`}
              >
                {category.name} {category.postCount > 0 ? `(${category.postCount})` : ''}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BlogCategories;
