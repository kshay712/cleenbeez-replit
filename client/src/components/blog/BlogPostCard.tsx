import { Link } from "wouter";
import { calculateReadingTime } from "@/lib/utils";

interface BlogPostCardProps {
  post: {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    featuredImage: string;
    publishedAt: string;
    createdAt: string; // Added createdAt for fallback
    author: {
      id: number;
      username: string;
      avatar?: string;
    };
    categories: Array<{
      id: number;
      name: string;
    }>;
  };
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ post }) => {
  // Calculate reading time based on excerpt + content
  const readingTime = calculateReadingTime(post.excerpt || '');
  
  return (
    <div className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white">
      <div className="flex-shrink-0">
        <img 
          className="h-48 w-full object-cover" 
          src={post.featuredImage} 
          alt={post.title} 
        />
      </div>
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div className="flex-1">
          {post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {post.categories.map(category => (
                <Link 
                  key={category.id}
                  href={`/blog?category=${category.id}`} 
                  className="text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800 px-2 py-1 rounded-full hover:bg-amber-100 transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}
          <Link href={`/blog/${post.slug}`} className="block mt-2">
            <p className="text-lg font-semibold text-neutral-900">{post.title}</p>
            <p className="mt-3 text-sm text-neutral-600 line-clamp-3">
              {post.excerpt}
            </p>
          </Link>
        </div>
        <div className="mt-6">
          <p className="text-sm font-medium text-neutral-900">{post.author.username}</p>
          <div className="flex space-x-1 text-sm text-neutral-500">
            <time dateTime={post.publishedAt || post.createdAt}>
              {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </time>
            <span aria-hidden="true">&middot;</span>
            <span>{readingTime} min read</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPostCard;
