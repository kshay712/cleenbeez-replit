import React, { useEffect, useState } from 'react';
import SimpleProductCard from '@/components/products/SimpleProductCard';
import { useQuery } from '@tanstack/react-query';

const TestPage = () => {
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['/api/products/5'],
  });

  const [manualProduct, setManualProduct] = useState({
    id: 5,
    name: "Test Product (Manual State)",
    organic: true,
    bpaFree: true,
    phthalateFree: true,
    parabenFree: true,
    oxybenzoneFree: true,
    formaldehydeFree: true,
    sulfatesFree: true,
    fdcFree: true
  });

  useEffect(() => {
    // Log the product data
    console.log('Raw product data from API:', product);
  }, [product]);

  if (isLoading) {
    return <div className="p-8">Loading product data...</div>;
  }

  if (error || !product) {
    return <div className="p-8 text-red-500">Error loading product</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Feature Display Test Page</h1>
      
      <div className="grid grid-cols-1 gap-8 mb-10">
        <div>
          <h2 className="text-xl font-semibold mb-3">1. From API Data</h2>
          <SimpleProductCard product={product} />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">2. From Manual Hard-coded State</h2>
          <SimpleProductCard product={manualProduct} />
        </div>
      </div>
    </div>
  );
};

export default TestPage;