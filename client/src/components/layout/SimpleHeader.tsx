import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import BeeIcon from "@/components/icons/BeeIcon";
import { Menu, LogOut, ClipboardList, FileText, BookOpen, Users, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const SimpleHeader = () => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  return (
    <header className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo and Name */}
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center">
              <BeeIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">Clean Bee</span>
          </Link>
        </div>

        {/* Navigation - Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/products" className={`font-medium ${location === '/products' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'}`}>
            Products
          </Link>
          <Link href="/blog" className={`font-medium ${location === '/blog' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'}`}>
            Blog
          </Link>
          <Link href="/learn" className={`font-medium ${location === '/learn' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'}`}>
            Learn
          </Link>

          {/* Admin Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!user ? (
                <DropdownMenuItem asChild>
                  <Link href="/login" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Login
                  </Link>
                </DropdownMenuItem>
              ) : (
                <>
                  <div className="px-4 py-2 text-sm border-b">
                    <div className="font-medium">{user.username || user.email}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator />
              
              <div className="px-4 py-1 text-xs font-semibold text-gray-500">
                Admin
              </div>
              <DropdownMenuItem asChild disabled={!(isAdmin || isEditor)} className={!(isAdmin || isEditor) ? "opacity-50 cursor-not-allowed" : ""}>
                <Link href={isAdmin || isEditor ? "/admin/products" : "#"} className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Manage Products
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild disabled={!(isAdmin || isEditor)} className={!(isAdmin || isEditor) ? "opacity-50 cursor-not-allowed" : ""}>
                <Link href={isAdmin || isEditor ? "/admin/blog" : "#"} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Manage Blog
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild disabled={!(isAdmin || isEditor)} className={!(isAdmin || isEditor) ? "opacity-50 cursor-not-allowed" : ""}>
                <Link href={isAdmin || isEditor ? "/admin/learn" : "#"} className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Manage Learn
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild disabled={!isAdmin} className={!isAdmin ? "opacity-50 cursor-not-allowed" : ""}>
                <Link href={isAdmin ? "/admin/users" : "#"} className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
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
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white absolute w-full shadow-lg px-4 py-3 space-y-3">
          <Link 
            href="/products" 
            className={`block py-2 ${location === '/products' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Products
          </Link>
          <Link 
            href="/blog" 
            className={`block py-2 ${location === '/blog' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Blog
          </Link>
          <Link 
            href="/learn" 
            className={`block py-2 ${location === '/learn' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Learn
          </Link>
          
          <div className="border-t border-gray-200 pt-3">
            {!user ? (
              <Link 
                href="/login" 
                className="block py-2 text-gray-700 hover:text-amber-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Login
                </div>
              </Link>
            ) : (
              <button 
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 text-red-600"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="h-5 w-5" />
                  Sign out
                </div>
              </button>
            )}
            
            <div className="py-2 text-sm font-semibold text-gray-500 mt-3">
              Admin
            </div>
            <div className="space-y-2">
              <Link 
                href={isAdmin || isEditor ? "/admin/products" : "#"}
                className={`block py-1 ${
                  isAdmin || isEditor ? "text-gray-700 hover:text-amber-600" : "text-gray-400 cursor-not-allowed"
                }`}
                onClick={(e) => {
                  if (!(isAdmin || isEditor)) e.preventDefault();
                  else setMobileMenuOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Manage Products
                </div>
              </Link>
              <Link 
                href={isAdmin || isEditor ? "/admin/blog" : "#"}
                className={`block py-1 ${
                  isAdmin || isEditor ? "text-gray-700 hover:text-amber-600" : "text-gray-400 cursor-not-allowed"
                }`}
                onClick={(e) => {
                  if (!(isAdmin || isEditor)) e.preventDefault();
                  else setMobileMenuOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Manage Blog
                </div>
              </Link>
              <Link 
                href={isAdmin || isEditor ? "/admin/learn" : "#"}
                className={`block py-1 ${
                  isAdmin || isEditor ? "text-gray-700 hover:text-amber-600" : "text-gray-400 cursor-not-allowed"
                }`}
                onClick={(e) => {
                  if (!(isAdmin || isEditor)) e.preventDefault();
                  else setMobileMenuOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Manage Learn
                </div>
              </Link>
              <Link 
                href={isAdmin ? "/admin/users" : "#"}
                className={`block py-1 ${
                  isAdmin ? "text-gray-700 hover:text-amber-600" : "text-gray-400 cursor-not-allowed"
                }`}
                onClick={(e) => {
                  if (!isAdmin) e.preventDefault();
                  else setMobileMenuOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Manage Users
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default SimpleHeader;