import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import BlogPostCard from "@/components/blog/BlogPostCard";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  publishedAt: string;
  author: {
    id: number;
    username: string;
    avatar?: string;
  };
  categories: any[];
}

interface CategoryBlogPostsProps {
  categoryId: string | null;
}

const CategoryBlogPosts: React.FC<CategoryBlogPostsProps> = ({ categoryId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // Default items per page
  
  // Only fetch if we have a category ID
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/blog/category', categoryId, 'posts', { page: currentPage, limit: itemsPerPage }],
    queryFn: async () => {
      if (!categoryId) return null;
      
      const res = await fetch(`/api/blog/category/${categoryId}/posts?page=${currentPage}&limit=${itemsPerPage}`);
      if (!res.ok) {
        throw new Error('Failed to fetch category posts');
      }
      return res.json();
    },
    enabled: !!categoryId, // Only run query if categoryId is provided
  });
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  if (!categoryId) {
    return null; // Don't render anything if no category is selected
  }
  
  if (error) {
    console.error("Error fetching category posts:", error);
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-neutral-900">Error loading posts</h3>
        <p className="mt-1 text-neutral-500">Please try again later</p>
      </div>
    );
  }

  return (
    <>
      {/* Blog posts grid */}
      {isLoading ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white">
              <Skeleton className="h-48 w-full" />
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full mt-2" />
                  <Skeleton className="h-4 w-full mt-3" />
                  <Skeleton className="h-4 w-full mt-1" />
                  <Skeleton className="h-4 w-3/4 mt-1" />
                </div>
                <div className="mt-6 flex items-center">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="ml-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-32 mt-1" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : data?.posts && data.posts.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {data.posts.map((post: BlogPost) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-neutral-900">No blog posts found in this category</h3>
          <p className="mt-1 text-neutral-500">Check back soon for new content</p>
        </div>
      )}
      
      {/* Pagination */}
      {data?.total && data.total > itemsPerPage && (
        <div className="mt-12">
          <Pagination 
            currentPage={currentPage}
            totalPages={Math.ceil(data.total / itemsPerPage)}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </>
  );
};

export default CategoryBlogPosts;