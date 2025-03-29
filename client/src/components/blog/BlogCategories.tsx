import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface BlogCategoriesProps {
  selectedCategory: string | null;
  onChange: (categoryId: string | null) => void;
}

const BlogCategories: React.FC<BlogCategoriesProps> = ({ selectedCategory, onChange }) => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['/api/blog/categories'],
  });

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
          {categories && categories.map((category: any) => (
            <li key={category.id}>
              <button
                onClick={() => onChange(category.id.toString())}
                className={`text-${selectedCategory === category.id.toString() ? 'primary-600' : 'neutral-700'} hover:text-primary-600`}
              >
                {category.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BlogCategories;
