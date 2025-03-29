import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import BeeIcon from "@/components/icons/BeeIcon";
import { 
  Menu, 
  Search, 
  ShoppingBag,
  ChevronDown,
  LogOut, 
  ClipboardList,
  FileText,
  Users,
  Settings,
  User
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
import { Badge } from "@/components/ui/badge";

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
    <header className="bg-white border-b border-neutral-100 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <div className="h-10 w-10 bg-primary-500 rounded-full flex items-center justify-center shadow-sm">
                <BeeIcon className="h-6 w-6 text-white" />
              </div>
            </Link>
          </div>
            
          {/* Main Navigation - Desktop */}
          <nav className="hidden md:flex md:items-center md:space-x-8">
            <Link href="/products" className={`inline-flex items-center px-3 h-16 border-b-2 font-medium ${
              isActive('/products') 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-neutral-600 hover:text-primary-600 hover:border-primary-300'
            }`}>
              Products
            </Link>
            <Link href="/blog" className={`inline-flex items-center px-3 h-16 border-b-2 font-medium ${
              isActive('/blog') 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-neutral-600 hover:text-primary-600 hover:border-primary-300'
            }`}>
              Blog
            </Link>
            <Link href="/learn" className={`inline-flex items-center px-3 h-16 border-b-2 font-medium ${
              isActive('/learn') 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-neutral-600 hover:text-primary-600 hover:border-primary-300'
            }`}>
              Learn
            </Link>
          </nav>
          
          {/* Search and Authentication - Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400" />
              </div>
              <Input 
                type="text" 
                className="w-64 pl-10 pr-3 py-2 border-neutral-200 rounded-full focus:ring-primary-500" 
                placeholder="Search products..." 
              />
            </div>
            
            {/* Cart */}
            <Link href="/cart" className="text-neutral-600 hover:text-primary-600 relative">
              <ShoppingBag className="h-5 w-5" />
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary-500">
                0
              </Badge>
            </Link>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-neutral-700"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {!user ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/login" className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Sign in
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/register" className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Sign up
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 text-sm text-neutral-700 border-b border-neutral-100">
                      <div className="font-semibold">{user.username || user.email}</div>
                      <div className="text-xs text-neutral-500 mt-1">{user.email}</div>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Your Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    
                    {/* Admin section - only visible for admin/editor roles */}
                    {(isAdmin || isEditor) && (
                      <>
                        <DropdownMenuSeparator />
                        <div className="px-4 py-1 text-xs font-semibold text-neutral-500">
                          Admin
                        </div>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/products" className="flex items-center">
                            <ClipboardList className="h-4 w-4 mr-2" />
                            Manage Products
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/blog" className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            Manage Blog
                          </Link>
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem asChild>
                            <Link href="/admin/users" className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Manage Users
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Mobile menu button and cart */}
          <div className="flex items-center md:hidden space-x-4">
            <Link href="/cart" className="text-neutral-600 hover:text-primary-600 relative">
              <ShoppingBag className="h-5 w-5" />
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary-500">
                0
              </Badge>
            </Link>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open menu"
              className="text-neutral-700"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white absolute w-full shadow-lg">
          {/* Mobile search */}
          <div className="p-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400" />
              </div>
              <Input 
                type="text" 
                className="w-full pl-10 pr-3 py-2 border-neutral-200" 
                placeholder="Search products..." 
              />
            </div>
          </div>
          
          <div className="py-2 divide-y divide-neutral-100">
            <div className="py-2 space-y-1">
              <Link 
                href="/products" 
                className={`block px-4 py-2 text-base font-medium ${
                  isActive('/products')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-neutral-700 hover:bg-neutral-50 hover:text-primary-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
              <Link 
                href="/blog" 
                className={`block px-4 py-2 text-base font-medium ${
                  isActive('/blog')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-neutral-700 hover:bg-neutral-50 hover:text-primary-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </Link>
              <Link 
                href="/learn" 
                className={`block px-4 py-2 text-base font-medium ${
                  isActive('/learn')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-neutral-700 hover:bg-neutral-50 hover:text-primary-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Learn
              </Link>
            </div>
            
            {/* Mobile authentication */}
            <div className="py-2">
              {!user ? (
                <div className="px-4 py-4 flex flex-col space-y-3">
                  <Button 
                    asChild
                    variant="outline"
                    className="w-full justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button 
                    asChild
                    className="w-full justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/register">Sign up</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="px-4 py-2 flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-primary-800">
                        {user.username ? user.username.substring(0, 1).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900">{user.username || user.email}</div>
                      <div className="text-xs text-neutral-500">{user.email}</div>
                    </div>
                  </div>
                  <Link 
                    href="/account" 
                    className="block px-4 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Your Account
                    </div>
                  </Link>
                  <Link 
                    href="/settings" 
                    className="block px-4 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      Settings
                    </div>
                  </Link>
                  
                  {/* Admin section - only visible for admin/editor roles */}
                  {(isAdmin || isEditor) && (
                    <>
                      <div className="px-4 py-2 text-sm font-semibold text-neutral-500">
                        Admin
                      </div>
                      <Link 
                        href="/admin/products" 
                        className="block px-4 py-2 pl-6 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <ClipboardList className="h-4 w-4 mr-2" />
                          Manage Products
                        </div>
                      </Link>
                      <Link 
                        href="/admin/blog" 
                        className="block px-4 py-2 pl-6 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          Manage Blog
                        </div>
                      </Link>
                      {isAdmin && (
                        <Link 
                          href="/admin/users" 
                          className="block px-4 py-2 pl-6 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            Manage Users
                          </div>
                        </Link>
                      )}
                    </>
                  )}
                  
                  <button 
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:bg-neutral-50"
                  >
                    <div className="flex items-center">
                      <LogOut className="h-5 w-5 mr-2" />
                      Sign out
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
