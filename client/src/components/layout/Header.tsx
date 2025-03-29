import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import BeeIcon from "@/components/icons/BeeIcon";
import { 
  Menu, 
  Search, 
  LogOut, 
  ClipboardList,
  FileText,
  BookOpen,
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
          {/* Logo and Site Name - Left Justified */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <div className="h-10 w-10 bg-primary-500 rounded-full flex items-center justify-center shadow-sm">
                <BeeIcon className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-lg font-heading font-bold text-neutral-800">Clean Bee</span>
            </Link>
          </div>
            
          {/* Main Navigation - Right Justified */}
          <div className="flex items-center space-x-6">
            {/* Search */}
            <div className="relative hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400" />
              </div>
              <Input 
                type="text" 
                className="w-64 pl-10 pr-3 py-2 border-neutral-200 rounded-full focus:ring-primary-500" 
                placeholder="Search products..." 
              />
            </div>
            
            {/* Navigation Links */}
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
            
            {/* User Menu */}
            <div className="hidden md:block">
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
                  {/* Login link always visible */}
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Login
                    </Link>
                  </DropdownMenuItem>
                  
                  {/* Admin links - conditionally enabled based on user role */}
                  <DropdownMenuSeparator />
                  <div className="px-4 py-1 text-xs font-semibold text-neutral-500">
                    Admin
                  </div>
                  <DropdownMenuItem asChild disabled={!(isAdmin || isEditor)} className={!(isAdmin || isEditor) ? "opacity-50 cursor-not-allowed" : ""}>
                    <Link href={isAdmin || isEditor ? "/admin/products" : "#"} className="flex items-center">
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Manage Products
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild disabled={!(isAdmin || isEditor)} className={!(isAdmin || isEditor) ? "opacity-50 cursor-not-allowed" : ""}>
                    <Link href={isAdmin || isEditor ? "/admin/blog" : "#"} className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Manage Blog
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild disabled={!(isAdmin || isEditor)} className={!(isAdmin || isEditor) ? "opacity-50 cursor-not-allowed" : ""}>
                    <Link href={isAdmin || isEditor ? "/admin/learn" : "#"} className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Manage Learn
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild disabled={!isAdmin} className={!isAdmin ? "opacity-50 cursor-not-allowed" : ""}>
                    <Link href={isAdmin ? "/admin/users" : "#"} className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Users
                    </Link>
                  </DropdownMenuItem>
                  
                  {/* Only show these when logged in */}
                  {user && (
                    <>
                      <DropdownMenuSeparator />
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
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open menu"
              className="md:hidden text-neutral-700"
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
            
            {/* Mobile admin and login */}
            <div className="py-2">
              <Link 
                href="/login" 
                className="block px-4 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Login
                </div>
              </Link>
              
              {/* Admin section - shows for all but is disabled unless admin/editor */}
              <div className="px-4 py-2 text-sm font-semibold text-neutral-500 mt-4">
                Admin
              </div>
              <Link 
                href={isAdmin || isEditor ? "/admin/products" : "#"}
                className={`block px-4 py-2 pl-6 text-sm font-medium ${
                  isAdmin || isEditor
                    ? "text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                    : "text-neutral-400 cursor-not-allowed"
                }`}
                onClick={(e) => {
                  if (!(isAdmin || isEditor)) e.preventDefault();
                  else setMobileMenuOpen(false);
                }}
              >
                <div className="flex items-center">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Manage Products
                </div>
              </Link>
              <Link 
                href={isAdmin || isEditor ? "/admin/blog" : "#"}
                className={`block px-4 py-2 pl-6 text-sm font-medium ${
                  isAdmin || isEditor
                    ? "text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                    : "text-neutral-400 cursor-not-allowed"
                }`}
                onClick={(e) => {
                  if (!(isAdmin || isEditor)) e.preventDefault();
                  else setMobileMenuOpen(false);
                }}
              >
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Manage Blog
                </div>
              </Link>
              <Link 
                href={isAdmin || isEditor ? "/admin/learn" : "#"}
                className={`block px-4 py-2 pl-6 text-sm font-medium ${
                  isAdmin || isEditor
                    ? "text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                    : "text-neutral-400 cursor-not-allowed"
                }`}
                onClick={(e) => {
                  if (!(isAdmin || isEditor)) e.preventDefault();
                  else setMobileMenuOpen(false);
                }}
              >
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage Learn
                </div>
              </Link>
              <Link 
                href={isAdmin ? "/admin/users" : "#"}
                className={`block px-4 py-2 pl-6 text-sm font-medium ${
                  isAdmin
                    ? "text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                    : "text-neutral-400 cursor-not-allowed"
                }`}
                onClick={(e) => {
                  if (!isAdmin) e.preventDefault();
                  else setMobileMenuOpen(false);
                }}
              >
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </div>
              </Link>
              
              {/* User account options - only visible when logged in */}
              {user && (
                <>
                  <div className="mt-4 px-4 py-2 flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-primary-800">
                        {user.username ? user.username.substring(0, 1).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900">{user.username || user.email}</div>
                      <div className="text-xs text-neutral-500 mt-1">{user.email}</div>
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
