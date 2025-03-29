import React from "react";
import { Badge } from "@/components/ui/badge";

interface FeatureBadgeProps {
  type: "organic" | "bpafree";
  className?: string;
}

const FeatureBadge: React.FC<FeatureBadgeProps> = ({ type, className = "" }) => {
  if (type === "organic") {
    return (
      <Badge className={`bg-secondary-100 text-secondary-800 hover:bg-secondary-100 ${className}`}>
        Organic
      </Badge>
    );
  }
  
  if (type === "bpafree") {
    return (
      <Badge className={`bg-primary-100 text-primary-800 hover:bg-primary-100 ${className}`}>
        BPA-Free
      </Badge>
    );
  }
  
  return null;
};

export default FeatureBadge;
