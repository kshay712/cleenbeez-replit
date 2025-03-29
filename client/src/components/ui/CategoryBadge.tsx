import React from "react";

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className = "" }) => {
  return (
    <span className={`text-sm text-neutral-500 ${className}`}>
      {category}
    </span>
  );
};

export default CategoryBadge;
