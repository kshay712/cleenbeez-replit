import React from 'react';
import { Badge } from "@/components/ui/badge";

interface SimpleProductCardProps {
  product: {
    id: number;
    name: string;
    organic?: boolean;
    bpaFree?: boolean;
    phthalateFree?: boolean;
    parabenFree?: boolean;
    oxybenzoneFree?: boolean;
    formaldehydeFree?: boolean;
    sulfatesFree?: boolean;
    fdcFree?: boolean;
  };
}

// Simple component to just show all features directly
const SimpleProductCard: React.FC<SimpleProductCardProps> = ({ product }) => {
  console.log('Product features in SimpleProductCard:', {
    organic: product.organic,
    bpaFree: product.bpaFree,
    phthalateFree: product.phthalateFree,
    parabenFree: product.parabenFree,
    oxybenzoneFree: product.oxybenzoneFree,
    formaldehydeFree: product.formaldehydeFree,
    sulfatesFree: product.sulfatesFree,
    fdcFree: product.fdcFree
  });

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <h3 className="font-bold text-lg mb-2">{product.name}</h3>
      <p className="text-sm mb-2">Feature Display Test:</p>
      
      <div className="flex flex-wrap gap-1 mb-4">
        {product.organic && (
          <Badge className="bg-green-100 text-green-800">Organic</Badge>
        )}
        {product.bpaFree && (
          <Badge className="bg-blue-100 text-blue-800">BPA-Free</Badge>
        )}
        {product.phthalateFree && (
          <Badge className="bg-purple-100 text-purple-800">Phthalate-Free</Badge>
        )}
        {product.parabenFree && (
          <Badge className="bg-indigo-100 text-indigo-800">Paraben-Free</Badge>
        )}
        {product.oxybenzoneFree && (
          <Badge className="bg-red-100 text-red-800">Oxybenzone-Free</Badge>
        )}
        {product.formaldehydeFree && (
          <Badge className="bg-amber-100 text-amber-800">Formaldehyde-Free</Badge>
        )}
        {product.sulfatesFree && (
          <Badge className="bg-teal-100 text-teal-800">Sulfates-Free</Badge>
        )}
        {product.fdcFree && (
          <Badge className="bg-pink-100 text-pink-800">FDC-Free</Badge>
        )}
      </div>

      <div className="text-xs space-y-1 mt-4">
        <div>Raw values for debugging:</div>
        <div>organic: {String(product.organic)}</div>
        <div>bpaFree: {String(product.bpaFree)}</div>
        <div>phthalateFree: {String(product.phthalateFree)}</div>
        <div>parabenFree: {String(product.parabenFree)}</div>
        <div>oxybenzoneFree: {String(product.oxybenzoneFree)}</div>
        <div>formaldehydeFree: {String(product.formaldehydeFree)}</div>
        <div>sulfatesFree: {String(product.sulfatesFree)}</div>
        <div>fdcFree: {String(product.fdcFree)}</div>
      </div>
    </div>
  );
};

export default SimpleProductCard;