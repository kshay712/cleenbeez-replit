import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

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
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import DevLoginPage from "./pages/auth/DevLoginPage";
import AdminUtilPage from "./pages/auth/AdminUtilPage";
import ProfilePage from "./pages/profile/ProfilePage";
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
  const { isAuthenticated, isAdmin, isEditor, isLoading, emailVerified } = useAuth();
  const [location, navigate] = useLocation();

  // After authentication check is complete
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // User not logged in, redirect to login with return path
        console.log(`ProtectedRoute: User not authenticated, redirecting to login from ${location}`);
        
        // Store the path they were trying to access
        sessionStorage.setItem('redirectAfterLogin', location);
        
        // Redirect to login
        navigate("/login");
      } else if (!emailVerified) {
        // User is authenticated but email is not verified
        console.log("ProtectedRoute: Email not verified, redirecting to home");
        
        // Store the current location for later access after verification
        sessionStorage.setItem('redirectAfterVerification', location);
        
        // Redirect to home page
        if (location !== '/') {
          navigate("/");
        }
      } else if (adminOnly && !isAdmin) {
        console.log("ProtectedRoute: Admin access required, redirecting to home");
        navigate("/");
      } else if (editorOnly && !isEditor) {
        console.log("ProtectedRoute: Editor access required, redirecting to home");
        navigate("/");
      }
    }
  }, [isLoading, isAuthenticated, emailVerified, isAdmin, isEditor, location, navigate, adminOnly, editorOnly]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto" />
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render anything during redirect
  if (!isAuthenticated || !emailVerified || (adminOnly && !isAdmin) || (editorOnly && !isEditor)) {
    return null;
  }

  // If we get here, the user is authenticated, verified, and has the right permissions
  return <Component />;
};

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16">
        <Switch>
          {/* Public routes */}
          <Route path="/" component={HomePage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={RegisterPage} />
          <Route path="/forgot-password" component={ForgotPasswordPage} />
          <Route path="/reset-password" component={ResetPasswordPage} />
          <Route path="/dev-login" component={DevLoginPage} />
          
          {/* Protected general routes - require login */}
          <Route path="/products">
            <ProtectedRoute component={ProductsPage} />
          </Route>
          <Route path="/products/:id">
            <ProtectedRoute component={ProductDetailPage} />
          </Route>
          <Route path="/blog">
            <ProtectedRoute component={BlogPage} />
          </Route>
          <Route path="/blog/:slug">
            <ProtectedRoute component={BlogPostPage} />
          </Route>
          <Route path="/learn">
            <ProtectedRoute component={LearnPage} />
          </Route>
          <Route path="/admin-util">
            <ProtectedRoute component={AdminUtilPage} />
          </Route>
          
          {/* Protected user routes */}
          <Route path="/profile">
            <ProtectedRoute component={ProfilePage} />
          </Route>
          
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
