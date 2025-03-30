import React, { useMemo, useState } from 'react';
import FeatureBadge, { FeatureType } from '@/components/ui/FeatureBadge';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, ChevronUp, ListFilter } from 'lucide-react';

export interface ProductFeaturesProps {
  features: {
    organic?: boolean;
    bpaFree?: boolean;
    phthalateFree?: boolean;
    parabenFree?: boolean;
    oxybenzoneFree?: boolean;
    formaldehydeFree?: boolean;
    sulfatesFree?: boolean;
    fdcFree?: boolean;
  };
  displayMode?: 'badge' | 'compact' | 'tooltip' | 'expandable';
  maxDisplay?: number;
  showEmpty?: boolean;
  small?: boolean;
  className?: string;
}

const ProductFeatures: React.FC<ProductFeaturesProps> = ({
  features,
  displayMode = 'badge',
  maxDisplay = 8, // Changed default from 2 to 8 to show all features by default
  showEmpty = false,
  small = false,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const featureMap = useMemo(() => {
    return [
      { name: 'organic', label: 'organic', value: features.organic },
      { name: 'bpaFree', label: 'bpafree', value: features.bpaFree },
      { name: 'phthalateFree', label: 'phthalate-free', value: features.phthalateFree },
      { name: 'parabenFree', label: 'paraben-free', value: features.parabenFree },
      { name: 'oxybenzoneFree', label: 'oxybenzone-free', value: features.oxybenzoneFree },
      { name: 'formaldehydeFree', label: 'formaldehyde-free', value: features.formaldehydeFree },
      { name: 'sulfatesFree', label: 'sulfates-free', value: features.sulfatesFree },
      { name: 'fdcFree', label: 'fdc-free', value: features.fdcFree },
    ].filter(f => f.value);
  }, [features]);
  
  // If no features and we don't want to show "empty" state
  if (featureMap.length === 0 && !showEmpty) {
    return null;
  }
  
  // If no features but we do want to show "empty" state
  if (featureMap.length === 0 && showEmpty) {
    return (
      <div className={`text-xs text-neutral-500 ${className}`}>
        No features specified
      </div>
    );
  }
  
  // Standard badge display (limited by maxDisplay)
  if (displayMode === 'badge') {
    const displayedFeatures = expanded 
      ? featureMap 
      : featureMap.slice(0, maxDisplay);
    
    const hasMore = featureMap.length > maxDisplay;
    
    return (
      <div className={`flex flex-wrap gap-1.5 ${className}`}>
        {displayedFeatures.map((feature) => (
          <FeatureBadge 
            key={feature.name} 
            type={feature.label as FeatureType} 
            small={small}
          />
        ))}
        
        {hasMore && !expanded && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(true)}
            className="h-5 px-1 text-xs"
          >
            +{featureMap.length - maxDisplay} more
          </Button>
        )}
        
        {expanded && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(false)}
            className="h-5 px-1 text-xs"
          >
            Show less
          </Button>
        )}
      </div>
    );
  }
  
  // Compact display with counter
  if (displayMode === 'compact' && featureMap.length > 0) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <span className="text-xs text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
          {featureMap.length} features
        </span>
      </div>
    );
  }
  
  // Tooltip display with all features shown on hover
  if (displayMode === 'tooltip' && featureMap.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 cursor-help ${className}`}>
              <div className="bg-neutral-100 text-neutral-800 hover:bg-neutral-200 h-5 px-2 rounded-full text-xs flex items-center">
                Features: {featureMap.length}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="p-2">
            <div className="grid grid-cols-1 gap-1 min-w-[180px]">
              {featureMap.map((feature) => (
                <FeatureBadge 
                  key={feature.name} 
                  type={feature.label as FeatureType}
                  showIcon={false}
                />
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Expandable section
  if (displayMode === 'expandable' && featureMap.length > 0) {
    return (
      <div className={className}>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setExpanded(!expanded)}
          className="w-full flex justify-between text-xs mb-2"
        >
          <div className="flex items-center">
            <ListFilter className="h-3.5 w-3.5 mr-1.5" />
            <span>Product Features ({featureMap.length})</span>
          </div>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 ml-2" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 ml-2" />
          )}
        </Button>
        
        {expanded && (
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {featureMap.map((feature) => (
              <FeatureBadge 
                key={feature.name} 
                type={feature.label as FeatureType}
                showIcon={false}
                small={small}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Default fallback
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {featureMap.slice(0, maxDisplay).map((feature) => (
        <FeatureBadge 
          key={feature.name} 
          type={feature.label as FeatureType}
          showIcon={false}
          small={small}
        />
      ))}
    </div>
  );
};

export default ProductFeatures;