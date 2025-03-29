import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import BeeIcon from "@/components/icons/BeeIcon";
import { 
  Menu, 
  Search, 
  User,
  ChevronDown,
  LogOut 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Header = () => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, isEditor, logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="bg-white shadow-sm fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              {/* Logo */}
              <Link href="/" className="flex items-center">
                <div className="h-10 w-10 bg-primary-500 rounded-full flex items-center justify-center mr-2">
                  <BeeIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-lg font-heading font-bold text-neutral-800">Clean Bee</span>
              </Link>
            </div>
            
            {/* Main Navigation - Desktop */}
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              <Link href="/products" className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                isActive('/products') 
                  ? 'border-primary-500 text-primary-500' 
                  : 'border-transparent text-neutral-700 hover:text-primary-500 hover:border-primary-500'
              }`}>
                Products
              </Link>
              <Link href="/learn" className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                isActive('/learn') 
                  ? 'border-primary-500 text-primary-500' 
                  : 'border-transparent text-neutral-700 hover:text-primary-500 hover:border-primary-500'
              }`}>
                Learn
              </Link>
              <Link href="/blog" className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                isActive('/blog') 
                  ? 'border-primary-500 text-primary-500' 
                  : 'border-transparent text-neutral-700 hover:text-primary-500 hover:border-primary-500'
              }`}>
                Blog
              </Link>
              
              {/* Admin section - only visible for admin/editor roles */}
              {(isAdmin || isEditor) && (
                <DropdownMenu>
                  <DropdownMenuTrigger className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                    isActive('/admin/products') || isActive('/admin/blog') || isActive('/admin/users')
                      ? 'border-primary-500 text-primary-500' 
                      : 'border-transparent text-neutral-700 hover:text-primary-500 hover:border-primary-500'
                  }`}>
                    Admin
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/products">Products</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/blog">Blog Posts</Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin/users">Users</Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>
          </div>
          
          {/* Search and Authentication - Desktop */}
          <div className="hidden md:flex items-center">
            {/* Search */}
            <div className="relative mx-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-500" />
              </div>
              <Input 
                type="text" 
                className="block w-full pl-10 pr-3 py-2" 
                placeholder="Search products..." 
              />
            </div>
            
            {/* Authentication */}
            {!user ? (
              <div className="flex space-x-4 items-center">
                <Link href="/login" className="text-sm font-medium text-neutral-700 hover:text-primary-500">
                  Sign in
                </Link>
                <Button asChild>
                  <Link href="/register">Sign up</Link>
                </Button>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-neutral-800">
                      {user.email ? user.email.substring(0, 2).toUpperCase() : 'U'}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/account">Your Account</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">Order History</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link 
              href="/products" 
              className={`block pl-3 pr-4 py-2 border-l-4 ${
                isActive('/products')
                  ? 'border-primary-500 text-primary-500 bg-primary-50'
                  : 'border-transparent text-neutral-700 hover:bg-neutral-50 hover:border-primary-300 hover:text-primary-500'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Products
            </Link>
            <Link 
              href="/learn" 
              className={`block pl-3 pr-4 py-2 border-l-4 ${
                isActive('/learn')
                  ? 'border-primary-500 text-primary-500 bg-primary-50'
                  : 'border-transparent text-neutral-700 hover:bg-neutral-50 hover:border-primary-300 hover:text-primary-500'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Learn
            </Link>
            <Link 
              href="/blog" 
              className={`block pl-3 pr-4 py-2 border-l-4 ${
                isActive('/blog')
                  ? 'border-primary-500 text-primary-500 bg-primary-50'
                  : 'border-transparent text-neutral-700 hover:bg-neutral-50 hover:border-primary-300 hover:text-primary-500'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            
            {/* Admin section - only visible for admin/editor roles */}
            {(isAdmin || isEditor) && (
              <div>
                <div className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-neutral-700">
                  Admin
                </div>
                <div className="pl-6 space-y-1">
                  <Link 
                    href="/admin/products" 
                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-primary-300 hover:text-primary-500"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Products
                  </Link>
                  <Link 
                    href="/admin/blog" 
                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-primary-300 hover:text-primary-500"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Blog Posts
                  </Link>
                  {isAdmin && (
                    <Link 
                      href="/admin/users" 
                      className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-primary-300 hover:text-primary-500"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Users
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Mobile authentication */}
          <div className="pt-4 pb-3 border-t border-neutral-200">
            {!user ? (
              <div className="px-4 flex items-center justify-between">
                <Link 
                  href="/login" 
                  className="text-base font-medium text-neutral-700 hover:text-primary-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Button 
                  asChild
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/register">Sign up</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-3 space-y-1">
                <Link 
                  href="/account" 
                  className="block px-4 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Your Account
                </Link>
                <Link 
                  href="/orders" 
                  className="block px-4 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Order History
                </Link>
                <Link 
                  href="/settings" 
                  className="block px-4 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <button 
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-500"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
