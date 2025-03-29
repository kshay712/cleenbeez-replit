import { Link } from "wouter";
import BeeIcon from "@/components/icons/BeeIcon";
import { Facebook, Instagram, Twitter, Bookmark, ChevronRight } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-neutral-800 to-neutral-900 text-white">
      {/* Top curved divider */}
      <div className="relative">
        <div className="absolute top-0 w-full h-8 bg-white" style={{ clipPath: 'ellipse(50% 100% at 50% 0%)' }}></div>
      </div>
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="xl:col-span-1">
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
          
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-primary-300 tracking-wider uppercase">Explore</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="/products" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1" />
                      Products
                    </Link>
                  </li>
                  <li>
                    <Link href="/learn" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1" />
                      Learn
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1" />
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1" />
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1" />
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-primary-300 tracking-wider uppercase">Categories</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="/products?category=beauty" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1" />
                      Beauty & Personal Care
                    </Link>
                  </li>
                  <li>
                    <Link href="/products?category=kitchen" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1" />
                      Kitchen & Home
                    </Link>
                  </li>
                  <li>
                    <Link href="/products?category=food" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1" />
                      Food & Supplements
                    </Link>
                  </li>
                  <li>
                    <Link href="/products?category=cleaning" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1" />
                      Cleaning Products
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-300 tracking-wider uppercase">Help & Support</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link href="/faq" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Shipping Information
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Returns & Refunds
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-base text-neutral-300 hover:text-primary-400 transition-colors flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-12 border-t border-neutral-700 pt-8">
          <p className="text-base text-neutral-400 xl:text-center">
            &copy; {new Date().getFullYear()} Clean Bee. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
