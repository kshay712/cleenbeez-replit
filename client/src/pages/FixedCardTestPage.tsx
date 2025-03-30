import React from 'react';
import FixedProductCard from '@/components/products/FixedProductCard';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '@/components/products/ProductCard';
import { Product } from '@/components/products/FixedProductCard';

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
      <h1 className="text-2xl font-bold mb-6">Fixed Card Comparison Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div>
          <h2 className="text-xl font-semibold mb-3">1. Original ProductCard</h2>
          <ProductCard product={product} />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">2. Fixed ProductCard</h2>
          <FixedProductCard product={product} />
        </div>
      </div>
    </div>
  );
};

export default FixedCardTestPage;