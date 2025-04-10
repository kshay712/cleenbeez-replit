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
  const { user, isAdmin, isEditor, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      // Force remove the localStorage item before calling logout
      localStorage.removeItem('dev-user');
      
      // Then call the regular logout function
      await logout();
      
      // Redirect to home page 
      window.location.href = '/';
    } catch (error) {
      console.error('Error during sign out:', error);
      // Fallback: force clear everything
      localStorage.clear();
      window.location.reload();
    }
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
              <span className="ml-2 md:ml-3 text-base md:text-lg font-bold text-neutral-800">Clean Bee</span>
            </Link>
          </div>
          
          {/* Right side: Navigation + Admin Menu */}
          <div className="flex items-center space-x-4 md:space-x-6">
            {/* Navigation Links */}
            <Link 
              href="/products" 
              className={`text-sm md:text-base font-medium ${
                isActive('/products') 
                  ? 'text-amber-600' 
                  : 'text-neutral-700 hover:text-amber-600'
              }`}
            >
              Products
            </Link>
            <Link 
              href="/blog" 
              className={`text-sm md:text-base font-medium ${
                isActive('/blog') 
                  ? 'text-amber-600' 
                  : 'text-neutral-700 hover:text-amber-600'
              }`}
            >
              Blog
            </Link>
            <Link 
              href="/learn" 
              className={`text-sm md:text-base font-medium ${
                isActive('/learn') 
                  ? 'text-amber-600' 
                  : 'text-neutral-700 hover:text-amber-600'
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
                  className="text-neutral-700"
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
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
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
        </div>
      </div>
      
      {/* We don't need a mobile menu anymore since navigation links are always visible in the header */}
    </header>
  );
};

export default Header;
