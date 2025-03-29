import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
              <span className="block">Discover products</span>
              <span className="block text-primary-500">that are good for you</span>
            </h1>
            <p className="mt-3 text-base text-neutral-600 sm:mt-5 sm:text-lg md:mt-5 md:text-xl">
              Clean Bee helps you find health-conscious products with transparent ingredients, organic options, and eco-friendly alternatives – all in one place.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row sm:gap-3">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/products">
                  Browse Products
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="mt-3 sm:mt-0 w-full sm:w-auto">
                <Link href="/blog">
                  Read Our Blog
                </Link>
              </Button>
            </div>
          </div>
          <div className="mt-12 lg:mt-0 flex justify-center">
            <img 
              className="h-auto w-full max-w-md rounded-lg shadow-xl" 
              src="https://images.unsplash.com/photo-1591377943654-c659795c523b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
              alt="Natural wellness products" 
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
