import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import BlogPostCard from "@/components/blog/BlogPostCard";

const BlogPostPage = () => {
  const [match, params] = useRoute("/blog/:slug");
  const slug = params?.slug;
  
  const { data: post, isLoading, error } = useQuery({
    queryKey: [`/api/blog/posts/${slug}`],
    enabled: !!slug,
  });
  
  const { data: relatedPosts, isLoading: relatedLoading } = useQuery({
    queryKey: [`/api/blog/related/${slug}`],
    enabled: !!slug && !!post,
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-6 w-80" />
          <Skeleton className="h-10 w-3/4 mt-4" />
          
          <div className="mt-6 flex items-center">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="ml-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48 mt-1" />
            </div>
          </div>
          
          <Skeleton className="h-96 w-full rounded-lg mt-8" />
          
          <div className="mt-8 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !post) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-red-600">Error Loading Blog Post</h2>
          <p className="mt-2 text-neutral-600">We couldn't find the blog post you're looking for.</p>
          <Button asChild className="mt-6">
            <Link href="/blog">Return to Blog</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      <article className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link href="/" className="text-neutral-500 hover:text-neutral-700">Home</Link>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                  <Link href="/blog" className="ml-2 text-neutral-500 hover:text-neutral-700">Blog</Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                  <span className="ml-2 text-neutral-900 font-medium">{post.title}</span>
                </div>
              </li>
            </ol>
          </nav>
          
          {/* Categories */}
          <div className="flex gap-2 mb-4">
            {post.categories.map((category: any) => (
              <Link 
                key={category.id} 
                href={`/blog?category=${category.id}`}
                className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800 hover:bg-primary-200"
              >
                {category.name}
              </Link>
            ))}
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl">{post.title}</h1>
          
          {/* Author and date */}
          <div className="mt-6 flex items-center">
            <div className="flex-shrink-0">
              <img 
                className="h-12 w-12 rounded-full" 
                src={post.author.avatar || "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"} 
                alt={post.author.username} 
              />
            </div>
            <div className="ml-4">
              <p className="text-lg font-medium text-neutral-900">{post.author.username}</p>
              <div className="flex space-x-1 text-sm text-neutral-500">
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </time>
                <span aria-hidden="true">&middot;</span>
                <span>8 min read</span>
              </div>
            </div>
          </div>
          
          {/* Featured image */}
          <div className="mt-8">
            <img 
              src={post.featuredImage} 
              alt={post.title} 
              className="w-full h-auto rounded-lg" 
            />
          </div>
          
          {/* Content */}
          <div 
            className="mt-8 prose prose-lg prose-primary mx-auto"
            dangerouslySetInnerHTML={{ __html: post.content }}  
          />
        </div>
      </article>
      
      {/* Related posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="py-12 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-neutral-900">Related Articles</h2>
            
            {relatedLoading ? (
              <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white">
                    <Skeleton className="h-48 w-full" />
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div className="flex-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-full mt-2" />
                        <Skeleton className="h-4 w-full mt-3" />
                        <Skeleton className="h-4 w-full mt-1" />
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
            ) : (
              <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((relatedPost: any) => (
                  <BlogPostCard key={relatedPost.id} post={relatedPost} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
};

export default BlogPostPage;
