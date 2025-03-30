import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ChevronRight, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import ProductGrid from "@/components/products/ProductGrid";

const ProductDetailPage = () => {
  const [match, params] = useRoute("/products/:id");
  const productId = params?.id;
  
  const { data: product, isLoading, error } = useQuery({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });
  
  const { data: relatedProducts, isLoading: relatedLoading } = useQuery({
    queryKey: [`/api/products/related/${productId}`],
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Skeleton className="h-6 w-80" />
          </div>
          
          <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
            <div className="lg:max-w-lg lg:self-start">
              <Skeleton className="w-full aspect-square rounded-lg" />
              <div className="mt-4 grid grid-cols-4 gap-2">
                <Skeleton className="h-24 rounded-md" />
                <Skeleton className="h-24 rounded-md" />
                <Skeleton className="h-24 rounded-md" />
                <Skeleton className="h-24 rounded-md" />
              </div>
            </div>
            
            <div className="mt-10 lg:mt-0">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-4 w-1/4 mt-4" />
              <Skeleton className="h-6 w-1/4 mt-4" />
              <Skeleton className="h-32 w-full mt-6" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-red-600">Error Loading Product</h2>
          <p className="mt-2 text-neutral-600">We couldn't find the product you're looking for.</p>
          <Button asChild className="mt-6">
            <Link href="/products">Return to Products</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/" className="text-neutral-500 hover:text-neutral-700">Home</Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="h-4 w-4 text-neutral-400" />
                <Link href="/products" className="ml-2 text-neutral-500 hover:text-neutral-700">Products</Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="h-4 w-4 text-neutral-400" />
                <Link 
                  href={`/products?category=${product.category.slug}`} 
                  className="ml-2 text-neutral-500 hover:text-neutral-700"
                >
                  {product.category.name}
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="h-4 w-4 text-neutral-400" />
                <span className="ml-2 text-neutral-900 font-medium">{product.name}</span>
              </div>
            </li>
          </ol>
        </nav>
        
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
          {/* Product images */}
          <div className="lg:max-w-lg lg:self-start">
            <div className="overflow-hidden rounded-lg">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-center object-cover"
              />
            </div>
            {/* Image thumbnails would go here */}
          </div>
          
          {/* Product details */}
          <div className="mt-10 lg:mt-0 lg:col-start-2 lg:row-span-2 lg:self-start">
            <div className="flex flex-wrap gap-2">
              {product.organic && (
                <Badge className="bg-green-100 text-green-800 px-2 py-1 text-sm font-normal">
                  Organic
                </Badge>
              )}
              {product.bpaFree && (
                <Badge className="bg-blue-100 text-blue-800 px-2 py-1 text-sm font-normal">
                  BPA-Free
                </Badge>
              )}
              {product.phthalateFree && (
                <Badge className="bg-purple-100 text-purple-800 px-2 py-1 text-sm font-normal">
                  Phthalate-Free
                </Badge>
              )}
              {product.parabenFree && (
                <Badge className="bg-indigo-100 text-indigo-800 px-2 py-1 text-sm font-normal">
                  Paraben-Free
                </Badge>
              )}
              {product.oxybenzoneFree && (
                <Badge className="bg-red-100 text-red-800 px-2 py-1 text-sm font-normal">
                  Oxybenzone-Free
                </Badge>
              )}
              {product.formaldehydeFree && (
                <Badge className="bg-amber-100 text-amber-800 px-2 py-1 text-sm font-normal">
                  Formaldehyde-Free
                </Badge>
              )}
              {product.sulfatesFree && (
                <Badge className="bg-teal-100 text-teal-800 px-2 py-1 text-sm font-normal">
                  Sulfates-Free
                </Badge>
              )}
              {product.fdcFree && (
                <Badge className="bg-pink-100 text-pink-800 px-2 py-1 text-sm font-normal">
                  FDC-Free
                </Badge>
              )}
            </div>
            
            <div className="mt-4">
              <h1 className="text-3xl font-extrabold text-neutral-900">{product.name}</h1>
              <p className="mt-2 text-sm text-neutral-500">By <span className="text-primary-600 hover:text-primary-500 cursor-pointer">Naturals & Co</span></p>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center">
                <p className="text-2xl font-bold text-neutral-900">${parseFloat(product.price).toFixed(2)}</p>
                {/* Add original price if available */}
              </div>
            </div>
            
            <div className="mt-6">
              <h2 className="text-lg font-medium text-neutral-900">Description</h2>
              <div className="mt-2 space-y-3 text-base text-neutral-700">
                <p>{product.description}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <h2 className="text-lg font-medium text-neutral-900">Why We Recommend</h2>
              <div className="mt-2 text-base text-neutral-700">
                <p>{product.whyRecommend}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <h2 className="text-lg font-medium text-neutral-900">Ingredients</h2>
              <div className="mt-2">
                <ul className="list-disc pl-5 text-sm text-neutral-700 space-y-1">
                  {product.ingredients.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            {product.vendors && product.vendors.length > 0 && (
              <div className="mt-8 border-t border-neutral-200 pt-8">
                <h2 className="text-lg font-medium text-neutral-900">Purchase Options</h2>
                <div className="mt-4 space-y-4">
                  {product.vendors.map((vendor) => (
                    <a 
                      key={vendor.id}
                      href={vendor.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <span>{vendor.name}</span>
                      <span className="ml-4">${parseFloat(vendor.price).toFixed(2)}</span>
                    </a>
                  ))}
                </div>
                
                <div className="mt-4 text-xs text-neutral-500">
                  <p>
                    *We may earn a small commission when you purchase through our links, with no additional cost to you.
                    This helps support our research and content.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Related products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-neutral-900">Related Products</h2>
            {relatedLoading ? (
              <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
                    <Skeleton className="w-full h-48 rounded-md" />
                    <Skeleton className="w-full h-6 mt-2" />
                    <Skeleton className="w-1/4 h-4 mt-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
                {relatedProducts.map((relatedProduct) => (
                  <div key={relatedProduct.id} className="group relative product-card bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="w-full bg-neutral-200 aspect-w-1 aspect-h-1 overflow-hidden">
                      <img 
                        src={relatedProduct.image} 
                        alt={relatedProduct.name} 
                        className="w-full h-full object-center object-cover transform group-hover:scale-105 transition-transform duration-300 ease-in-out"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-neutral-900">
                        <Link href={`/products/${relatedProduct.id}`}>{relatedProduct.name}</Link>
                      </h3>
                      <p className="mt-1 text-sm text-neutral-500">${parseFloat(relatedProduct.price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductDetailPage;
