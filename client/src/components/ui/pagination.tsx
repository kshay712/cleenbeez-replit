import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  // Don't render pagination if there's only one page
  if (totalPages <= 1) return null;
  
  const generatePaginationItems = () => {
    const items = [];
    const maxPageItems = 7; // Maximum number of page items to show
    
    // Always include first page
    items.push(1);
    
    // Calculate start and end of pagination range
    let startPage = Math.max(2, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);
    
    // Adjust range if current page is near start or end
    if (currentPage <= 3) {
      endPage = Math.min(totalPages - 1, maxPageItems - 2);
    } else if (currentPage >= totalPages - 2) {
      startPage = Math.max(2, totalPages - maxPageItems + 2);
    }
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      items.push("ellipsis1");
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      items.push("ellipsis2");
    }
    
    // Always include last page if there's more than one page
    if (totalPages > 1) {
      items.push(totalPages);
    }
    
    return items;
  };
  
  const paginationItems = generatePaginationItems();
  
  return (
    <div className="mt-10 flex items-center justify-between">
      <div className="flex-1 flex justify-between sm:hidden">
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
      
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-neutral-700">
            Showing page <span className="font-medium">{currentPage}</span> of{" "}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <Button
              variant="outline"
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            {paginationItems.map((item, index) => {
              if (item === "ellipsis1" || item === "ellipsis2") {
                return (
                  <Button
                    key={`ellipsis-${index}`}
                    variant="outline"
                    className="relative inline-flex items-center px-4 py-2 border border-neutral-300 bg-white text-sm font-medium text-neutral-700"
                    disabled
                  >
                    ...
                  </Button>
                );
              }
              
              const page = item as number;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                    ${currentPage === page 
                      ? "z-10 bg-primary-50 border-primary-500 text-primary-600" 
                      : "bg-white border-neutral-300 text-neutral-500 hover:bg-neutral-50"
                    }`}
                  onClick={() => onPageChange(page)}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
