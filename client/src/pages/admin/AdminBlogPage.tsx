import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { auth } from "@/lib/firebase";
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Search,
  Filter,
  Image as ImageIcon,
  Loader2,
  Star
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { format } from "date-fns";
import { slugify } from "@/lib/utils";

// Define the blog post schema
const blogPostSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  slug: z.string().min(3, { message: "Slug must be at least 3 characters" })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { 
      message: "Slug must contain only lowercase letters, numbers, and hyphens" 
    }),
  excerpt: z.string().min(10, { message: "Excerpt must be at least 10 characters" }),
  content: z.string().min(50, { message: "Content must be at least 50 characters" }),
  featuredImage: z.any().optional(),
  published: z.boolean().default(false),
  categories: z.array(z.string()).optional(),
});

// Define the category schema
const categorySchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  slug: z.string().min(2, { message: "Slug must be at least 2 characters" })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { 
      message: "Slug must contain only lowercase letters, numbers, and hyphens" 
    }),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const AdminBlogPage = () => {
  const { isAdmin, isEditor, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // State for dialog controls
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [selectedTab, setSelectedTab] = useState("posts");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Define types
  interface BlogPostWithRelations {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    featuredImage: string;
    published: boolean;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    authorId: number;
    author: any;
    categories: Array<{
      id: number;
      name: string;
      slug: string;
    }>;
  }
  
  interface BlogPostsResponse {
    posts: BlogPostWithRelations[];
    total: number;
  }
  
  interface BlogCategory {
    id: number;
    name: string;
    slug: string;
    postCount?: number;
  }
  
  // Fetch blog posts
  const { data: blogPosts, isLoading: postsLoading } = useQuery<BlogPostsResponse>({
    queryKey: ['/api/blog/admin', searchQuery],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/blog/admin?search=${encodeURIComponent(searchQuery)}` 
        : '/api/blog/admin';
      const response = await fetch(url);
      return response.json();
    }
  });
  
  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<BlogCategory[]>({
    queryKey: ['/api/blog/categories'],
    queryFn: async () => {
      const response = await fetch('/api/blog/categories');
      return response.json();
    }
  });
  
  // Create blog post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      
      // Convert data to FormData
      if (data.featuredImage && data.featuredImage instanceof File) {
        formData.append('featuredImage', data.featuredImage);
      }
      
      // Remove the file from the data object
      const postData = { ...data };
      if (postData.featuredImage instanceof File) {
        delete postData.featuredImage;
      }
      
      formData.append('postData', JSON.stringify(postData));
      
      const headers: HeadersInit = {};
      
      const response = await fetch('/api/blog/posts', {
        method: 'POST',
        headers,
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to create blog post');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Blog post created",
        description: "Your blog post has been created successfully.",
        variant: "default",
      });
      setPostDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/blog/admin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      setEditingPost(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create blog post: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Update blog post mutation
  const updatePostMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      
      // Convert data to FormData
      if (data.featuredImage && data.featuredImage instanceof File) {
        formData.append('featuredImage', data.featuredImage);
      }
      
      // Remove the file from the data object
      const postData = { ...data };
      if (postData.featuredImage instanceof File) {
        delete postData.featuredImage;
      }
      
      formData.append('postData', JSON.stringify(postData));
      
      const headers: HeadersInit = {};
      
      const response = await fetch(`/api/blog/posts/${data.id}`, {
        method: 'PUT',
        headers,
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to update blog post');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Blog post updated",
        description: "Your blog post has been updated successfully.",
        variant: "default",
      });
      setPostDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/blog/admin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      setEditingPost(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update blog post: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      const response = await apiRequest('POST', '/api/blog/categories', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Category created",
        description: "The category has been created successfully.",
        variant: "default",
      });
      setCategoryDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/blog/categories'] });
      setEditingCategory(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create category: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/blog/categories/${data.id}`, {
        name: data.name,
        slug: data.slug
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Category updated",
        description: "The category has been updated successfully.",
        variant: "default",
      });
      setCategoryDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/blog/categories'] });
      setEditingCategory(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update category: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/blog/posts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Blog post deleted",
        description: "The blog post has been deleted successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/admin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete blog post: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/blog/categories/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/categories'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete category: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Set featured post mutation
  const setFeaturedPostMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/blog/posts/${id}/set-featured`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Featured post updated",
        description: "The featured post has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/admin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/featured'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update featured post: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Initialize forms
  const postForm = useForm({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      featuredImage: "",
      published: false,
      categories: [],
    },
  });
  
  const categoryForm = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: ""
    },
  });
  
  // Handle form submissions
  const onPostSubmit = (data: any) => {
    if (editingPost) {
      updatePostMutation.mutate({ ...data, id: editingPost.id });
    } else {
      createPostMutation.mutate(data);
    }
  };
  
  const onCategorySubmit = (data: CategoryFormValues) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ ...data, id: editingCategory.id });
    } else {
      createCategoryMutation.mutate(data);
    }
  };
  
  // Handle editing a post
  const handleEditPost = (post: BlogPostWithRelations) => {
    setEditingPost(post);
    
    // Reset form with post data
    postForm.reset({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featuredImage: post.featuredImage,
      published: post.published,
      categories: post.categories ? post.categories.map(c => c.id.toString()) : [],
    });
    
    setPostDialogOpen(true);
  };
  
  // Handle editing a category
  const handleEditCategory = (category: BlogCategory) => {
    setEditingCategory(category);
    
    // Reset form with category data
    categoryForm.reset({
      name: category.name,
      slug: category.slug,
    });
    
    setCategoryDialogOpen(true);
  };
  
  // Handle deleting a post
  const handleDeletePost = (id: number) => {
    deletePostMutation.mutate(id);
  };
  
  // Handle deleting a category
  const handleDeleteCategory = (id: number) => {
    deleteCategoryMutation.mutate(id);
  };
  
  // Handle setting a post as featured
  const handleSetFeaturedPost = (id: number) => {
    setFeaturedPostMutation.mutate(id);
  };
  
  // Handle dialog close
  const handleClosePostDialog = () => {
    setPostDialogOpen(false);
    setEditingPost(null);
    postForm.reset();
  };
  
  const handleCloseCategoryDialog = () => {
    setCategoryDialogOpen(false);
    setEditingCategory(null);
    categoryForm.reset();
  };
  
  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    const slug = slugify(title);
    postForm.setValue("slug", slug);
  };
  
  // Auto-generate slug from category name
  const handleCategoryNameChange = (name: string) => {
    const slug = slugify(name);
    categoryForm.setValue("slug", slug);
  };
  
  // Return early if not admin or editor
  if (!isAdmin && !isEditor) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-neutral-600">
            You don't have permission to access this page. Please contact an administrator for assistance.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold mb-6">Blog Management</h1>
        
        <Tabs defaultValue="posts" value={selectedTab} onValueChange={setSelectedTab}>
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="posts">Blog Posts</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>
            
            {selectedTab === "posts" ? (
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/blog/fix-published-dates', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        }
                      });
                      const data = await res.json();
                      console.log('Fix result:', data);
                      toast({
                        title: "Published dates fixed",
                        description: `Fixed ${data.posts?.length || 0} posts`,
                        variant: "default"
                      });
                      queryClient.invalidateQueries({ queryKey: ['/api/blog/admin'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
                    } catch (error) {
                      console.error('Error fixing dates:', error);
                      toast({
                        title: "Error fixing dates",
                        description: "An error occurred while fixing published dates",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  Fix Published Dates
                </Button>
                
                <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Blog Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingPost ? "Edit Blog Post" : "Create New Blog Post"}</DialogTitle>
                      <DialogDescription>
                        {editingPost 
                          ? "Update your blog post content and settings below."
                          : "Fill out the form to create a new blog post."}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...postForm}>
                      <form onSubmit={postForm.handleSubmit(onPostSubmit)} className="space-y-6">
                        <FormField
                          control={postForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter blog post title" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleTitleChange(e.target.value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={postForm.control}
                          name="slug"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Slug</FormLabel>
                              <FormControl>
                                <Input placeholder="enter-your-slug-here" {...field} />
                              </FormControl>
                              <FormDescription>
                                The unique URL path for this blog post.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={postForm.control}
                          name="excerpt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Excerpt</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="A brief summary of your blog post" 
                                  className="h-20"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                A short summary that appears in blog listings.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={postForm.control}
                          name="featuredImage"
                          render={({ field: { value, onChange, ...field } }) => (
                            <FormItem>
                              <FormLabel>Featured Image</FormLabel>
                              <FormControl>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    // Handle the file input change
                                    if (e.target.files?.[0]) {
                                      onChange(e.target.files[0]);
                                    }
                                  }}
                                  {...field}
                                />
                              </FormControl>
                              {value && typeof value === 'string' && (
                                <div className="mt-2">
                                  <img 
                                    src={value} 
                                    alt="Current featured image" 
                                    className="max-h-40 object-cover rounded-md" 
                                  />
                                </div>
                              )}
                              <FormDescription>
                                Upload an image for your blog post.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={postForm.control}
                          name="categories"
                          render={() => (
                            <FormItem>
                              <div className="mb-4">
                                <FormLabel>Categories</FormLabel>
                                <FormDescription>
                                  Select categories that apply to this post.
                                </FormDescription>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {categoriesLoading ? (
                                  <div>Loading categories...</div>
                                ) : categories && categories.length > 0 ? (
                                  categories.map((category: any) => (
                                    <FormField
                                      key={category.id}
                                      control={postForm.control}
                                      name="categories"
                                      render={({ field }) => (
                                        <FormItem
                                          key={category.id}
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(category.id.toString())}
                                              onCheckedChange={(checked) => {
                                                const currentValues = field.value || [];
                                                if (checked) {
                                                  field.onChange([...currentValues, category.id.toString()]);
                                                } else {
                                                  field.onChange(
                                                    currentValues.filter(
                                                      (value) => value !== category.id.toString()
                                                    )
                                                  );
                                                }
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal cursor-pointer">
                                            {category.name}
                                          </FormLabel>
                                        </FormItem>
                                      )}
                                    />
                                  ))
                                ) : (
                                  <div>No categories available. Please create categories first.</div>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={postForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Content</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Write your blog post content here..." 
                                  className="min-h-[300px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={postForm.control}
                          name="published"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Publish Post
                                </FormLabel>
                                <FormDescription>
                                  When enabled, the post will be visible to all users.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleClosePostDialog}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit"
                            disabled={createPostMutation.isPending || updatePostMutation.isPending}
                          >
                            {(createPostMutation.isPending || updatePostMutation.isPending) && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {editingPost ? "Update Blog Post" : "Create Blog Post"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? "Edit Category" : "Create New Category"}</DialogTitle>
                    <DialogDescription>
                      {editingCategory 
                        ? "Update the category details below."
                        : "Add a new category for organizing blog posts."}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...categoryForm}>
                    <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-6">
                      <FormField
                        control={categoryForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g. Healthy Recipes" 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleCategoryNameChange(e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={categoryForm.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Slug</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. healthy-recipes" {...field} />
                            </FormControl>
                            <FormDescription>
                              The URL-friendly version of the name.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleCloseCategoryDialog}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                        >
                          {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {editingCategory ? "Update Category" : "Create Category"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <TabsContent value="posts">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
                <Input
                  placeholder="Search blog posts..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {postsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Categories</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blogPosts?.posts && blogPosts.posts.length > 0 ? (
                      blogPosts.posts.map((post: any) => (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium">{post.title}</TableCell>
                          <TableCell>
                            {post.author ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  {post.author.profileImage ? (
                                    <AvatarImage src={post.author.profileImage} />
                                  ) : null}
                                  <AvatarFallback>
                                    {post.author.username.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{post.author.username}</span>
                              </div>
                            ) : (
                              "Unknown"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {post.categories && post.categories.length > 0 ? (
                                post.categories.map((category: any) => (
                                  <Badge key={category.id} variant="outline">
                                    {category.name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-neutral-400">None</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {post.published ? (
                              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                Published
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                Draft
                              </Badge>
                            )}
                            {post.featured && (
                              <Badge variant="secondary" className="ml-1 bg-amber-200 text-amber-900">
                                Featured
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {post.published && post.publishedAt ? (
                              format(new Date(post.publishedAt), 'MMM d, yyyy')
                            ) : (
                              format(new Date(post.createdAt), 'MMM d, yyyy')
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSetFeaturedPost(post.id)}
                                title={post.featured ? "Remove from featured" : "Set as featured"}
                              >
                                <Star 
                                  className={`h-4 w-4 ${post.featured ? 'fill-amber-400 text-amber-400' : 'text-neutral-400'}`} 
                                />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditPost(post)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete
                                      the blog post <strong>"{post.title}"</strong>.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeletePost(post.id)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6">
                          <div className="flex flex-col items-center justify-center text-neutral-500">
                            <p className="mb-2">No blog posts found</p>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setPostDialogOpen(true);
                                setSelectedTab("posts");
                              }}
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Create your first blog post
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="categories">
            {categoriesLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Posts</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories && categories.length > 0 ? (
                      categories.map((category: any) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.slug}</TableCell>
                          <TableCell>{category.postCount || 0}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(`/blog/category/${category.slug}`, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete
                                      the category <strong>"{category.name}"</strong>. Posts in this
                                      category will not be deleted but will lose this category association.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteCategory(category.id)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6">
                          <div className="flex flex-col items-center justify-center text-neutral-500">
                            <p className="mb-2">No categories found</p>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setCategoryDialogOpen(true);
                                setSelectedTab("categories");
                              }}
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Create your first category
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminBlogPage;