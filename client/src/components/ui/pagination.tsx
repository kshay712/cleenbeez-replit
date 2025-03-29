import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  // Create an array of page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    // Always include first page
    pages.push(1);
    
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Adjust start and end to always show the same number of pages if possible
    if (endPage - startPage + 1 < Math.min(maxVisiblePages - 2, totalPages - 2)) {
      if (currentPage < totalPages / 2) {
        endPage = Math.min(totalPages - 1, startPage + Math.min(maxVisiblePages - 3, totalPages - 3));
      } else {
        startPage = Math.max(2, endPage - Math.min(maxVisiblePages - 3, totalPages - 3));
      }
    }
    
    // Add ellipsis before middle pages if there's a gap
    if (startPage > 2) {
      pages.push('...');
    }
    
    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis after middle pages if there's a gap
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    
    // Always include last page if it's not the first page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="flex items-center justify-center space-x-1 mt-10">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0"
      >
        <span className="sr-only">Previous</span>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {pageNumbers.map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className="px-3 py-1 text-sm text-neutral-500">...</span>
          ) : (
            <Button
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => typeof page === 'number' && onPageChange(page)}
              className={`h-8 w-8 p-0 ${currentPage === page ? 'bg-primary-500 text-white hover:bg-primary-600' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              {page}
            </Button>
          )}
        </React.Fragment>
      ))}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0"
      >
        <span className="sr-only">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
};

export default Pagination;