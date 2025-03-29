import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import BeeIcon from "@/components/icons/BeeIcon";
import { 
  Menu, 
  LogOut, 
  ClipboardList,
  FileText,
  BookOpen,
  Users,
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
        <div className="flex h-16 items-center justify-between">
          {/* Left side: Logo and Site Name */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="h-10 w-10 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                <BeeIcon className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-lg font-bold text-neutral-800">Clean Bee</span>
            </Link>
          </div>
          
          {/* Desktop navigation + menu icon */}
          <div className="hidden md:flex md:items-center space-x-6">
            {/* Right-side navigation links */}
            <Link 
              href="/products" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/products') 
                  ? 'text-amber-600 border-b-2 border-amber-500' 
                  : 'text-neutral-600 hover:text-amber-600'
              }`}
            >
              Products
            </Link>
            <Link 
              href="/blog" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/blog') 
                  ? 'text-amber-600 border-b-2 border-amber-500' 
                  : 'text-neutral-600 hover:text-amber-600'
              }`}
            >
              Blog
            </Link>
            <Link 
              href="/learn" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/learn') 
                  ? 'text-amber-600 border-b-2 border-amber-500' 
                  : 'text-neutral-600 hover:text-amber-600'
              }`}
            >
              Learn
            </Link>
            
            {/* Admin dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-2 text-neutral-700"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56">
                {/* Login link always visible */}
                {!user ? (
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Login
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <>
                    <div className="px-4 py-2 text-sm text-neutral-700 border-b border-neutral-100">
                      <div className="font-semibold">{user.username || user.email}</div>
                      <div className="text-xs text-neutral-500 mt-1">{user.email}</div>
                    </div>
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </>
                )}
                
                {/* Admin section - always visible but conditionally enabled */}
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
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
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              href="/products" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/products')
                  ? 'text-amber-600 bg-amber-50'
                  : 'text-neutral-700 hover:bg-neutral-50 hover:text-amber-600'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Products
            </Link>
            <Link 
              href="/blog" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/blog')
                  ? 'text-amber-600 bg-amber-50'
                  : 'text-neutral-700 hover:bg-neutral-50 hover:text-amber-600'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link 
              href="/learn" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/learn')
                  ? 'text-amber-600 bg-amber-50'
                  : 'text-neutral-700 hover:bg-neutral-50 hover:text-amber-600'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Learn
            </Link>
          </div>
          
          <div className="border-t border-neutral-200 pt-4 pb-3">
            {!user ? (
              <div className="px-4 py-2">
                <Link 
                  href="/login" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-amber-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Login
                  </div>
                </Link>
              </div>
            ) : (
              <div className="px-4 py-2">
                <div className="flex items-center px-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-amber-800">
                      {user.username ? user.username.substring(0, 1).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-neutral-900">{user.username || user.email}</div>
                    <div className="text-xs text-neutral-500">{user.email}</div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="mt-3 block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-neutral-50"
                >
                  <div className="flex items-center">
                    <LogOut className="h-5 w-5 mr-2" />
                    Sign out
                  </div>
                </button>
              </div>
            )}
            
            {/* Mobile admin section */}
            <div className="mt-3 px-4 pt-2 border-t border-neutral-200">
              <div className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Admin
              </div>
              <div className="mt-2 space-y-1">
                <Link 
                  href={isAdmin || isEditor ? "/admin/products" : "#"}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    isAdmin || isEditor
                      ? "text-neutral-700 hover:bg-neutral-50 hover:text-amber-600"
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
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    isAdmin || isEditor
                      ? "text-neutral-700 hover:bg-neutral-50 hover:text-amber-600"
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
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    isAdmin || isEditor
                      ? "text-neutral-700 hover:bg-neutral-50 hover:text-amber-600"
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
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    isAdmin
                      ? "text-neutral-700 hover:bg-neutral-50 hover:text-amber-600"
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
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
