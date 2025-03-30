import React, { useEffect, useState } from 'react';
import SimpleProductCard from '@/components/products/SimpleProductCard';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';

interface FeatureDisplayProps {
  title: string;
  features: {
    organic?: boolean | null;
    bpaFree?: boolean | null;
    phthalateFree?: boolean | null;
    parabenFree?: boolean | null;
    oxybenzoneFree?: boolean | null;
    formaldehydeFree?: boolean | null;
    sulfatesFree?: boolean | null;
    fdcFree?: boolean | null;
  };
}

// Component to display features more explicitly
const FeatureDisplay = ({ title, features }: FeatureDisplayProps) => {
  const featureEntries = Object.entries(features);
  const activeFeatures = featureEntries.filter(([_, value]) => value === true).length;
  
  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-amber-800">{title}</h3>
        <Badge variant="outline" className="bg-amber-100 border-amber-300">
          {activeFeatures} active features
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {featureEntries.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between bg-white p-2 rounded border border-amber-100">
            <span>{key}</span>
            {value === true ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <X className="h-5 w-5 text-red-500" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

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
  
  // Extract feature flags from API product data
  const apiFeatures = {
    organic: product.organic,
    bpaFree: product.bpaFree,
    phthalateFree: product.phthalateFree,
    parabenFree: product.parabenFree,
    oxybenzoneFree: product.oxybenzoneFree,
    formaldehydeFree: product.formaldehydeFree,
    sulfatesFree: product.sulfatesFree,
    fdcFree: product.fdcFree
  };
  
  // Extract feature flags from manual product data
  const manualFeatures = {
    organic: manualProduct.organic,
    bpaFree: manualProduct.bpaFree,
    phthalateFree: manualProduct.phthalateFree,
    parabenFree: manualProduct.parabenFree,
    oxybenzoneFree: manualProduct.oxybenzoneFree,
    formaldehydeFree: manualProduct.formaldehydeFree,
    sulfatesFree: manualProduct.sulfatesFree,
    fdcFree: manualProduct.fdcFree
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Feature Display Test Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Feature Flags Comparison</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureDisplay title="API Data Features" features={apiFeatures} />
          <FeatureDisplay title="Manual Data Features" features={manualFeatures} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-8 mb-10">
        <div>
          <h2 className="text-xl font-semibold mb-3">1. Product Card From API Data</h2>
          <SimpleProductCard product={product} />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">2. Product Card From Manual Hard-coded State</h2>
          <SimpleProductCard product={manualProduct} />
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-neutral-50 border border-neutral-200 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Raw API Product Data:</h2>
        <pre className="whitespace-pre-wrap bg-white p-4 rounded-md text-sm overflow-auto max-h-96">
          {JSON.stringify(product, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TestPage;