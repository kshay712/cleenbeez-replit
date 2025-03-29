import { Link } from "wouter";
import BeeIcon from "@/components/icons/BeeIcon";
import { Facebook, Instagram, Twitter, Bookmark, ChevronRight, Leaf, ShieldCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-neutral-800 to-neutral-900 text-white">
      {/* Top curved divider */}
      <div className="relative">
        <div className="absolute top-0 w-full h-8 bg-white" style={{ clipPath: 'ellipse(50% 100% at 50% 0%)' }}></div>
      </div>
      
      {/* Banner section - Newsletter subscription */}
      <div className="relative z-10 -mt-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-500 rounded-xl py-10 px-6 sm:py-12 sm:px-10 lg:flex lg:items-center shadow-xl">
            <div className="lg:w-0 lg:flex-1">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Join our newsletter
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-primary-100">
                Get the latest updates on new products, health tips, and exclusive offers.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 lg:ml-8">
              <form className="sm:flex">
                <Input
                  type="email"
                  name="email-address"
                  id="email-address"
                  autoComplete="email"
                  required
                  className="w-full px-5 py-3 border-white focus:ring-white focus:border-white bg-primary-400 text-white placeholder-primary-100 rounded-md"
                  placeholder="Enter your email"
                />
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <Button type="submit" className="w-full bg-white text-primary-600 hover:bg-primary-50 border border-transparent">
                    Subscribe
                  </Button>
                </div>
              </form>
              <p className="mt-3 text-sm text-primary-100">
                We care about your privacy. Read our <Link href="/privacy" className="underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-primary-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                <BeeIcon className="h-7 w-7 text-white" />
              </div>
              <span className="text-xl font-heading font-bold text-white">Clean Bee</span>
            </div>
            <p className="text-neutral-300 text-base leading-relaxed">
              Helping you discover health-conscious products with transparent ingredients and honest recommendations. Every product we feature is carefully selected with your health in mind.
            </p>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center text-neutral-300">
                <Leaf className="h-5 w-5 text-primary-400 mr-2" />
                <span>Eco-friendly options</span>
              </div>
              <div className="flex items-center text-neutral-300">
                <ShieldCheck className="h-5 w-5 text-primary-400 mr-2" />
                <span>Verified ingredients</span>
              </div>
              <div className="flex items-center text-neutral-300">
                <Heart className="h-5 w-5 text-primary-400 mr-2" />
                <span>Health-focused recommendations</span>
              </div>
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
