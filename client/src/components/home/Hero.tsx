import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import BeeIcon from "@/components/icons/BeeIcon";
import { ShieldCheck, Leaf, Heart } from "lucide-react";

const Hero = () => {
  return (
    <section className="bg-gradient-to-b from-amber-50 via-primary-50 to-white overflow-hidden relative">
      {/* Decorative hexagons */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-primary-200"
            style={{
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: 0.2 + Math.random() * 0.3
            }}
          />
        ))}
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          <div>
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 bg-primary-500 rounded-full flex items-center justify-center">
                <BeeIcon className="h-7 w-7 text-white" />
              </div>
              <span className="ml-3 text-xl font-semibold text-primary-700">Clean Bee</span>
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
              <span className="block">Discover products</span>
              <span className="block text-primary-600">that are good for you</span>
            </h1>
            
            <p className="mt-5 text-base text-neutral-600 sm:text-lg md:text-xl">
              Clean Bee helps you find health-conscious products with transparent ingredients, organic options, and eco-friendly alternatives – all in one place.
            </p>
            
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center text-sm font-medium text-neutral-700">
                <ShieldCheck className="h-5 w-5 text-primary-600 mr-1.5" />
                <span>Verified ingredients</span>
              </div>
              <div className="flex items-center text-sm font-medium text-neutral-700">
                <Leaf className="h-5 w-5 text-green-600 mr-1.5" />
                <span>Eco-friendly options</span>
              </div>
              <div className="flex items-center text-sm font-medium text-neutral-700">
                <Heart className="h-5 w-5 text-red-500 mr-1.5" />
                <span>Health-focused</span>
              </div>
            </div>
            
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row sm:gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/products">
                  Browse Products
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="mt-4 sm:mt-0 w-full sm:w-auto">
                <Link href="/blog">
                  Read Our Blog
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="mt-12 lg:mt-0 flex justify-center">
            <div className="relative">
              {/* Circular background */}
              <div className="absolute -inset-4 bg-primary-100 rounded-full opacity-70"></div>
              
              <img 
                className="h-auto w-full max-w-md rounded-lg shadow-xl relative z-10" 
                src="https://images.unsplash.com/photo-1591377943654-c659795c523b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="Natural wellness products" 
              />
              
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 h-16 w-16 bg-primary-200 rounded-full flex items-center justify-center shadow-lg z-20">
                <Leaf className="h-8 w-8 text-primary-700" />
              </div>
              <div className="absolute -bottom-4 -left-4 h-12 w-12 bg-green-100 rounded-full flex items-center justify-center shadow-lg z-20">
                <ShieldCheck className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
