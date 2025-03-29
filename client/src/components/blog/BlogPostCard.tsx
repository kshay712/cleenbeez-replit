import { Link } from "wouter";

interface BlogPostCardProps {
  post: {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    featuredImage: string;
    publishedAt: string;
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
            <p className="text-sm font-medium text-primary-600">
              <Link 
                href={`/blog?category=${post.categories[0].id}`} 
                className="hover:underline"
              >
                {post.categories[0].name}
              </Link>
            </p>
          )}
          <Link href={`/blog/${post.slug}`} className="block mt-2">
            <p className="text-lg font-semibold text-neutral-900">{post.title}</p>
            <p className="mt-3 text-sm text-neutral-600 line-clamp-3">
              {post.excerpt}
            </p>
          </Link>
        </div>
        <div className="mt-6 flex items-center">
          <div className="flex-shrink-0">
            <img 
              className="h-10 w-10 rounded-full" 
              src={post.author.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"} 
              alt={post.author.username} 
            />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-neutral-900">{post.author.username}</p>
            <div className="flex space-x-1 text-sm text-neutral-500">
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </time>
              <span aria-hidden="true">&middot;</span>
              <span>6 min read</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPostCard;
