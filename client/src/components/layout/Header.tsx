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
  User,
  X,
  Package,
  FileText as BlogIcon,
  GraduationCap
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const Header = () => {
  const [location] = useLocation();
  const { user, isAdmin, isEditor, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      console.log("Starting logout from Header component");
      
      // Call the logout function which handles everything now
      await logout();
      
      // Redirect to home page (fallback in case the current page requires auth)
      console.log("Logout successful, redirecting to home page");
      window.location.href = '/';
    } catch (error) {
      console.error('Error during sign out:', error);
      
      // Fallback: force clear local storage and reload
      console.log("Error during logout, using fallback cleanup");
      localStorage.removeItem('dev-user');
      localStorage.clear();
      
      // Force reload to go back to unauthenticated state
      window.location.reload();
    }
  };

  const isActive = (path: string) => {
    return location === path;
  };

  const NavLinks = ({ mobile = false, onNavClick = () => {} }) => (
    <>
      <Link 
        href="/products" 
        className={`${mobile ? 'text-base py-3 w-full flex' : 'text-sm md:text-base'} font-medium ${
          isActive('/products') 
            ? 'text-amber-600' 
            : 'text-neutral-700 hover:text-amber-600'
        }`}
        onClick={onNavClick}
      >
        {mobile && <Package className="mr-2 h-5 w-5" />}
        Products
      </Link>
      <Link 
        href="/blog" 
        className={`${mobile ? 'text-base py-3 w-full flex' : 'text-sm md:text-base'} font-medium ${
          isActive('/blog') 
            ? 'text-amber-600' 
            : 'text-neutral-700 hover:text-amber-600'
        }`}
        onClick={onNavClick}
      >
        {mobile && <BlogIcon className="mr-2 h-5 w-5" />}
        Blog
      </Link>
      <Link 
        href="/learn" 
        className={`${mobile ? 'text-base py-3 w-full flex' : 'text-sm md:text-base'} font-medium ${
          isActive('/learn') 
            ? 'text-amber-600' 
            : 'text-neutral-700 hover:text-amber-600'
        }`}
        onClick={onNavClick}
      >
        {mobile && <GraduationCap className="mr-2 h-5 w-5" />}
        Learn
      </Link>
    </>
  );

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
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLinks />
            
            {/* Admin dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-neutral-700 h-10 w-10"
                  aria-label="Menu"
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
          
          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-neutral-700 h-10 w-10"
                  aria-label="Menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:w-[385px]">
                <SheetHeader className="mb-6">
                  <SheetTitle>
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-amber-500 rounded-full flex items-center justify-center">
                        <BeeIcon className="h-5 w-5 text-white" />
                      </div>
                      <span className="ml-2 text-lg font-bold text-neutral-800">Clean Bee</span>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                
                {/* Mobile Navigation */}
                <div className="flex flex-col py-2">
                  <SheetClose asChild>
                    <div className="flex flex-col space-y-1">
                      <NavLinks mobile onNavClick={() => setMobileMenuOpen(false)} />
                    </div>
                  </SheetClose>
                </div>
                
                <div className="border-t border-neutral-200 my-4"></div>
                
                {/* User Section */}
                {!user ? (
                  <SheetClose asChild>
                    <Link 
                      href="/login" 
                      className="flex items-center py-3 px-2 text-base font-medium text-neutral-700 hover:text-amber-600"
                    >
                      <User className="mr-2 h-5 w-5" />
                      Login
                    </Link>
                  </SheetClose>
                ) : (
                  <>
                    <div className="px-2 py-3 border-b border-neutral-200">
                      <div className="font-medium">{user.username || user.email}</div>
                      <div className="text-sm text-neutral-500 mt-1">{user.email}</div>
                    </div>
                    
                    <SheetClose asChild>
                      <Link 
                        href="/profile" 
                        className="flex items-center py-3 px-2 text-base font-medium text-neutral-700 hover:text-amber-600"
                      >
                        <User className="mr-2 h-5 w-5" />
                        Profile Settings
                      </Link>
                    </SheetClose>
                    
                    <button 
                      onClick={handleSignOut} 
                      className="flex items-center py-3 px-2 text-base font-medium text-red-600 hover:text-red-700 w-full text-left"
                    >
                      <LogOut className="mr-2 h-5 w-5" />
                      Sign out
                    </button>
                  </>
                )}
                
                {/* Admin Section on Mobile */}
                {(isAdmin || isEditor) && (
                  <>
                    <div className="border-t border-neutral-200 my-4"></div>
                    <div className="px-2 py-2 text-sm font-semibold text-neutral-500">
                      Admin
                    </div>
                    
                    {(isAdmin || isEditor) && (
                      <SheetClose asChild>
                        <Link 
                          href="/admin/products" 
                          className="flex items-center py-3 px-2 text-base font-medium text-neutral-700 hover:text-amber-600"
                        >
                          <ClipboardList className="mr-2 h-5 w-5" />
                          Manage Products
                        </Link>
                      </SheetClose>
                    )}
                    
                    {(isAdmin || isEditor) && (
                      <SheetClose asChild>
                        <Link 
                          href="/admin/blog" 
                          className="flex items-center py-3 px-2 text-base font-medium text-neutral-700 hover:text-amber-600"
                        >
                          <FileText className="mr-2 h-5 w-5" />
                          Manage Blog
                        </Link>
                      </SheetClose>
                    )}
                    
                    {(isAdmin || isEditor) && (
                      <SheetClose asChild>
                        <Link 
                          href="/admin/learn" 
                          className="flex items-center py-3 px-2 text-base font-medium text-neutral-700 hover:text-amber-600"
                        >
                          <BookOpen className="mr-2 h-5 w-5" />
                          Manage Learn
                        </Link>
                      </SheetClose>
                    )}
                    
                    {isAdmin && (
                      <SheetClose asChild>
                        <Link 
                          href="/admin/users" 
                          className="flex items-center py-3 px-2 text-base font-medium text-neutral-700 hover:text-amber-600"
                        >
                          <Users className="mr-2 h-5 w-5" />
                          Manage Users
                        </Link>
                      </SheetClose>
                    )}
                  </>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
