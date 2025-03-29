import React from "react";
import { Badge } from "@/components/ui/badge";

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className = "" }) => {
  return (
    <Badge variant="outline" className={`text-xs font-medium text-neutral-600 bg-neutral-50 hover:bg-neutral-100 ${className}`}>
      {category}
    </Badge>
  );
};

export default CategoryBadge;
