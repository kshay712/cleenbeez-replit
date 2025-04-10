import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { Loader2 } from "lucide-react";

// Layouts
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

// Pages
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/products/ProductsPage";
import ProductDetailPage from "./pages/products/ProductDetailPage";
import BlogPage from "./pages/blog/BlogPage";
import BlogPostPage from "./pages/blog/BlogPostPage";
import LearnPage from "./pages/learn/LearnPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DevLoginPage from "./pages/auth/DevLoginPage";
import AdminUtilPage from "./pages/auth/AdminUtilPage";
import AdminProductsPage from "./pages/admin/products/AdminProductsPage";
import NewProductPage from "./pages/admin/products/NewProductPage";
import EditProductPage from "./pages/admin/products/EditProductPage";
import AdminCategoriesPage from "./pages/admin/categories/AdminCategoriesPage";
import AdminBlogPage from "./pages/admin/AdminBlogPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import NotFound from "@/pages/not-found";

// Protected route that requires login
const ProtectedRoute = ({ component: Component, adminOnly = false, editorOnly = false, ...rest }: {
  component: React.ComponentType;
  path?: string;
  adminOnly?: boolean;
  editorOnly?: boolean;
}) => {
  const { isAuthenticated, isAdmin, isEditor, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // User not logged in, redirect to login
    navigate("/login");
    return null;
  }

  if (adminOnly && !isAdmin) {
    // User is not an admin, redirect to home page
    navigate("/");
    return null;
  }

  if (editorOnly && !isEditor) {
    // User is not an editor or admin, redirect to home page
    navigate("/");
    return null;
  }

  return <Component />;
};

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/products" component={ProductsPage} />
          <Route path="/products/:id" component={ProductDetailPage} />
          <Route path="/blog" component={BlogPage} />
          <Route path="/blog/:slug" component={BlogPostPage} />
          <Route path="/learn" component={LearnPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={RegisterPage} />
          <Route path="/dev-login" component={DevLoginPage} />
          <Route path="/admin-util" component={AdminUtilPage} />
          {/* Admin routes that require admin privileges */}
          <Route path="/admin/users">
            <ProtectedRoute component={AdminUsersPage} adminOnly={true} />
          </Route>
          
          {/* Editor/Admin routes that require editor privileges */}
          <Route path="/admin/products">
            <ProtectedRoute component={AdminProductsPage} editorOnly={true} />
          </Route>
          <Route path="/admin/products/new">
            <ProtectedRoute component={NewProductPage} editorOnly={true} />
          </Route>
          <Route path="/admin/products/edit/:id">
            <ProtectedRoute component={EditProductPage} editorOnly={true} />
          </Route>
          <Route path="/admin/categories">
            <ProtectedRoute component={AdminCategoriesPage} editorOnly={true} />
          </Route>
          <Route path="/admin/blog">
            <ProtectedRoute component={AdminBlogPage} editorOnly={true} />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
