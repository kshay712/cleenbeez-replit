import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { calculateReadingTime } from "@/lib/utils";
import BlogPostCard from "@/components/blog/BlogPostCard";
import BlogCategories from "@/components/blog/BlogCategories";
import CategoryBlogPosts from "@/components/blog/CategoryBlogPosts";
import { queryClient } from "@/lib/queryClient";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const BlogPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Define types for our API responses
  interface Category {
    id: number;
    name: string;
    slug: string;
    postCount: number;
  }

  interface BlogPost {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featuredImage: string;
    publishedAt: string;
    createdAt: string; // Added createdAt for fallback
    author: {
      id: number;
      username: string;
      avatar?: string;
    };
    categories: Category[];
  }

  interface BlogPostsResponse {
    posts: BlogPost[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  }
  
  // Get categories for displaying the selected category name
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/blog/categories'],
  });
  
  // Find the selected category name for display if needed
  const selectedCategoryName = React.useMemo(() => {
    if (!selectedCategory || !categories) return null;
    const category = categories.find(cat => cat.id.toString() === selectedCategory);
    return category ? category.name : null;
  }, [selectedCategory, categories]);
  
  // Build query params - ensures we pass numeric IDs to the server
  const queryParams = new URLSearchParams();
  if (currentPage > 1) queryParams.set('page', currentPage.toString());
  if (selectedCategory) queryParams.set('category', selectedCategory);
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  // Fetch blog posts - use array-based query key for better cache invalidation
  const { data, isLoading } = useQuery<BlogPostsResponse>({
    queryKey: ['/api/blog/posts', { category: selectedCategory, page: currentPage }],
    queryFn: async () => {
      const res = await fetch(`/api/blog/posts${queryString}`);
      if (!res.ok) {
        throw new Error('Failed to fetch blog posts');
      }
      return res.json();
    },
  });
  
  // Fetch featured post
  const { data: featuredPost, isLoading: featuredLoading } = useQuery<BlogPost>({
    queryKey: ['/api/blog/featured'],
  });
  
  // Handle category change
  const handleCategoryChange = (categoryId: string | null) => {
    console.log('Changing category to:', categoryId);
    setSelectedCategory(categoryId);
    setCurrentPage(1); // Reset to first page when category changes
    
    // Force refetch when category changes by invalidating the cache
    queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return (
    <section className="py-12 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl">Clean Bee Blog</h1>
          <p className="mt-4 max-w-2xl text-xl text-neutral-600 mx-auto">
            Learn about healthy living, clean ingredients, and sustainable practices.
          </p>
        </div>
        
        <div className="mt-12 lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Categories sidebar - Desktop */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24">
              <BlogCategories 
                selectedCategory={selectedCategory} 
                onChange={handleCategoryChange} 
              />
            </div>
          </div>
          
          {/* Blog posts grid */}
          <div className="mt-6 lg:mt-0 lg:col-span-9">
            {/* Mobile categories dropdown */}
            <div className="lg:hidden mb-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full flex justify-between items-center">
                    <span>
                      {selectedCategoryName ? `Category: ${selectedCategoryName}` : 'All Posts'}
                    </span>
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Categories</SheetTitle>
                    <SheetDescription>
                      Filter posts by category
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4">
                    <BlogCategories 
                      selectedCategory={selectedCategory} 
                      onChange={(category) => {
                        handleCategoryChange(category);
                      }} 
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            {/* Featured post */}
            {featuredLoading ? (
              <div className="mb-10">
                <div className="rounded-lg shadow-lg overflow-hidden bg-white">
                  <div className="lg:flex">
                    <div className="lg:shrink-0">
                      <Skeleton className="h-48 w-full lg:h-full lg:w-64" />
                    </div>
                    <div className="p-6">
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-10 w-full mt-4" />
                      <Skeleton className="h-24 w-full mt-4" />
                      <div className="mt-4">
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : featuredPost ? (
              <div className="mb-10">
                <div className="rounded-lg shadow-lg overflow-hidden bg-white">
                  <div className="lg:flex">
                    <div className="lg:shrink-0">
                      <img 
                        className="h-48 w-full object-cover lg:h-full lg:w-64" 
                        src={featuredPost.featuredImage} 
                        alt={featuredPost.title} 
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary-800 text-white">
                          Featured
                        </span>
                        {featuredPost.categories.map(category => (
                          <Link 
                            key={category.id}
                            href={`/blog?category=${category.id}`} 
                            className="text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800 px-2 py-1 rounded-full hover:bg-amber-100 transition-colors"
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                      <a href={`/blog/${featuredPost.slug}`} className="block mt-2">
                        <p className="text-xl font-semibold text-neutral-900">{featuredPost.title}</p>
                        <p className="mt-3 text-base text-neutral-600">
                          {featuredPost.excerpt}
                        </p>
                      </a>
                      <div className="mt-4">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium text-neutral-900">{featuredPost.author.username}</p>
                          <div className="flex space-x-1 text-sm text-neutral-500">
                            <time dateTime={featuredPost.publishedAt || featuredPost.createdAt}>
                              {new Date(featuredPost.publishedAt || featuredPost.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </time>
                            <span aria-hidden="true">&middot;</span>
                            <span>{calculateReadingTime(featuredPost.excerpt || '')} min read</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            
            {/* Blog posts grid - Use our dedicated component for category filtering */}
            {selectedCategory ? (
              /* Use direct category posts endpoint for selected categories */
              <CategoryBlogPosts categoryId={selectedCategory} />
            ) : isLoading ? (
              /* Use regular endpoint for all posts (no category filter) */
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
                {data.posts.map((post: any) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-neutral-900">No blog posts found</h3>
                <p className="mt-1 text-neutral-500">Check back soon for new content</p>
              </div>
            )}
            
            {/* Pagination - Only show for "all posts" view */}
            {!selectedCategory && data?.pagination && (
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

export default BlogPage;
