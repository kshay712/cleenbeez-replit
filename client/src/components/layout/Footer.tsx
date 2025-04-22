import { useState } from "react";
import { Link } from "wouter";
import BeeIcon from "@/components/icons/BeeIcon";
import { Facebook, Instagram, Twitter, Bookmark, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FooterSectionProps {
  title: string;
  children: React.ReactNode;
  initiallyOpen?: boolean;
}

// Mobile-friendly footer section with collapsible content
const FooterSection = ({ title, children, initiallyOpen = false }: FooterSectionProps) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border-b border-neutral-700 py-4 md:border-none md:py-0"
    >
      <div className="flex items-center justify-between md:block">
        <h3 className="text-sm font-semibold text-primary-300 tracking-wider uppercase">{title}</h3>
        <CollapsibleTrigger className="md:hidden">
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-neutral-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-neutral-400" />
          )}
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent className="md:block">
        <div className="mt-4 space-y-4">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-neutral-800 to-neutral-900 text-white">
      {/* Top curved divider */}
      <div className="relative">
        <div className="absolute top-0 w-full h-8 bg-white" style={{ clipPath: 'ellipse(50% 100% at 50% 0%)' }}></div>
      </div>
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Logo and Social Media Icons */}
          <div className="xl:col-span-1 mb-8 xl:mb-0">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                <BeeIcon className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-lg font-bold text-white">Clean Bee</span>
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="text-neutral-400 hover:text-primary-400 transition-colors" aria-label="Facebook">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary-400 transition-colors" aria-label="Instagram">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary-400 transition-colors" aria-label="Twitter">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary-400 transition-colors" aria-label="Pinterest">
                <Bookmark className="h-6 w-6" />
              </a>
            </div>
          </div>
          
          {/* Footer Sections */}
          <div className="xl:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Explore Section */}
              <FooterSection title="Explore" initiallyOpen={true}>
                <ul className="space-y-3">
                  <li>
                    <Link href="/products" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-5 w-5 mr-1 flex-shrink-0" />
                      <span>Products</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/learn" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-5 w-5 mr-1 flex-shrink-0" />
                      <span>Learn</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-5 w-5 mr-1 flex-shrink-0" />
                      <span>Blog</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-5 w-5 mr-1 flex-shrink-0" />
                      <span>About Us</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-5 w-5 mr-1 flex-shrink-0" />
                      <span>Contact</span>
                    </Link>
                  </li>
                </ul>
              </FooterSection>
              
              {/* Categories Section */}
              <FooterSection title="Categories">
                <ul className="space-y-3">
                  <li>
                    <Link href="/products?category=beauty" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-5 w-5 mr-1 flex-shrink-0" />
                      <span>Beauty & Personal Care</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/products?category=kitchen" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-5 w-5 mr-1 flex-shrink-0" />
                      <span>Kitchen & Home</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/products?category=food" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-5 w-5 mr-1 flex-shrink-0" />
                      <span>Food & Supplements</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/products?category=cleaning" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-5 w-5 mr-1 flex-shrink-0" />
                      <span>Cleaning Products</span>
                    </Link>
                  </li>
                </ul>
              </FooterSection>
              
              {/* Help & Support Section */}
              <FooterSection title="Help & Support">
                <ul className="space-y-3">
                  <li>
                    <Link href="/faq" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-5 w-5 mr-1 flex-shrink-0" />
                      <span>FAQ</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/shipping" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-5 w-5 mr-1 flex-shrink-0" />
                      <span>Shipping Information</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/returns" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-5 w-5 mr-1 flex-shrink-0" />
                      <span>Returns & Refunds</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-5 w-5 mr-1 flex-shrink-0" />
                      <span>Privacy Policy</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-5 w-5 mr-1 flex-shrink-0" />
                      <span>Terms of Service</span>
                    </Link>
                  </li>
                </ul>
              </FooterSection>
            </div>
          </div>
        </div>
        
        <div className="mt-8 border-t border-neutral-700 pt-8">
          <p className="text-sm sm:text-base text-neutral-400 text-center">
            &copy; {new Date().getFullYear()} Clean Bee. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
