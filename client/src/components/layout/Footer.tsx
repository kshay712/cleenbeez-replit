import { Link } from "wouter";
import BeeIcon from "@/components/icons/BeeIcon";
import { Facebook, Instagram, Twitter, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  return (
    <footer className="bg-neutral-800 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-primary-500 rounded-full flex items-center justify-center mr-2">
                <BeeIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-lg font-heading font-bold text-white">Clean Bee</span>
            </div>
            <p className="text-neutral-300 text-base">
              Helping you discover health-conscious products with transparent ingredients and honest recommendations.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-neutral-400 hover:text-neutral-300" aria-label="Facebook">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-neutral-300" aria-label="Instagram">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-neutral-300" aria-label="Twitter">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-neutral-300" aria-label="Pinterest">
                <Bookmark className="h-6 w-6" />
              </a>
            </div>
          </div>
          
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-neutral-200 tracking-wider uppercase">Explore</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="/products" className="text-base text-neutral-400 hover:text-neutral-300">Products</Link>
                  </li>
                  <li>
                    <Link href="/learn" className="text-base text-neutral-400 hover:text-neutral-300">Learn</Link>
                  </li>
                  <li>
                    <Link href="/blog" className="text-base text-neutral-400 hover:text-neutral-300">Blog</Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-base text-neutral-400 hover:text-neutral-300">About Us</Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-neutral-200 tracking-wider uppercase">Categories</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="/products?category=beauty" className="text-base text-neutral-400 hover:text-neutral-300">Beauty & Personal Care</Link>
                  </li>
                  <li>
                    <Link href="/products?category=kitchen" className="text-base text-neutral-400 hover:text-neutral-300">Kitchen & Home</Link>
                  </li>
                  <li>
                    <Link href="/products?category=food" className="text-base text-neutral-400 hover:text-neutral-300">Food & Supplements</Link>
                  </li>
                  <li>
                    <Link href="/products?category=cleaning" className="text-base text-neutral-400 hover:text-neutral-300">Cleaning Products</Link>
                  </li>
                </ul>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-200 tracking-wider uppercase">Subscribe to our newsletter</h3>
              <p className="mt-4 text-base text-neutral-400">
                Get the latest updates on new products, health tips, and exclusive offers.
              </p>
              <form className="mt-4 sm:flex sm:max-w-md">
                <Input
                  type="email"
                  name="email-address"
                  id="email-address"
                  autoComplete="email"
                  required
                  className="appearance-none min-w-0 w-full bg-white border border-transparent rounded-md py-2 px-4 text-base text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your email"
                />
                <div className="mt-3 rounded-md sm:mt-0 sm:ml-3 sm:flex-shrink-0">
                  <Button type="submit" className="w-full bg-primary-500 hover:bg-primary-600">
                    Subscribe
                  </Button>
                </div>
              </form>
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
