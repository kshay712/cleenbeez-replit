import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ProductCard, { Product } from '@/components/products/ProductCard';

const FixedCardTestPage = () => {
  const { data, isLoading, error } = useQuery<Product>({
    queryKey: ['/api/products/5'],
  });

  if (isLoading) {
    return <div className="p-8">Loading product data...</div>;
  }

  if (error || !data) {
    return <div className="p-8 text-red-500">Error loading product</div>;
  }

  // Make sure we have the right structure
  const product = data as Product;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Product Card Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div>
          <h2 className="text-xl font-semibold mb-3">Updated ProductCard</h2>
          <ProductCard product={product} />
        </div>

        <div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="text-amber-800 font-medium mb-2">Product Features:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li className={product.organic ? "text-green-600" : "text-gray-400"}>Organic: {product.organic ? "Yes" : "No"}</li>
              <li className={product.bpaFree ? "text-green-600" : "text-gray-400"}>BPA-Free: {product.bpaFree ? "Yes" : "No"}</li>
              <li className={product.phthalateFree ? "text-green-600" : "text-gray-400"}>Phthalate-Free: {product.phthalateFree ? "Yes" : "No"}</li>
              <li className={product.parabenFree ? "text-green-600" : "text-gray-400"}>Paraben-Free: {product.parabenFree ? "Yes" : "No"}</li>
              <li className={product.oxybenzoneFree ? "text-green-600" : "text-gray-400"}>Oxybenzone-Free: {product.oxybenzoneFree ? "Yes" : "No"}</li>
              <li className={product.formaldehydeFree ? "text-green-600" : "text-gray-400"}>Formaldehyde-Free: {product.formaldehydeFree ? "Yes" : "No"}</li>
              <li className={product.sulfatesFree ? "text-green-600" : "text-gray-400"}>Sulfates-Free: {product.sulfatesFree ? "Yes" : "No"}</li>
              <li className={product.fdcFree ? "text-green-600" : "text-gray-400"}>FDC-Free: {product.fdcFree ? "Yes" : "No"}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixedCardTestPage;