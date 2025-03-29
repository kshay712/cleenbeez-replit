import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const renderPageButtons = () => {
    const pages = [];
    const maxDisplayedPages = 5; // Max number of page buttons to show

    // Always show first page
    pages.push(
      <Button
        key={1}
        variant={currentPage === 1 ? "default" : "outline"}
        size="sm"
        onClick={() => onPageChange(1)}
        className="w-10"
      >
        1
      </Button>
    );

    // Show ellipsis if there are pages before the current range
    if (currentPage > 3) {
      pages.push(
        <Button key="start-ellipsis" variant="outline" size="sm" disabled className="w-10">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      );
    }

    // Calculate range of pages to show around current page
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    // Adjust range if we're near the start or end
    if (currentPage <= 3) {
      endPage = Math.min(totalPages - 1, maxDisplayedPages - 1);
    } else if (currentPage >= totalPages - 2) {
      startPage = Math.max(2, totalPages - maxDisplayedPages + 2);
    }

    // Add the range of page buttons
    for (let page = startPage; page <= endPage; page++) {
      pages.push(
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
          className="w-10"
        >
          {page}
        </Button>
      );
    }

    // Show ellipsis if there are pages after the current range
    if (currentPage < totalPages - 2 && totalPages > maxDisplayedPages) {
      pages.push(
        <Button key="end-ellipsis" variant="outline" size="sm" disabled className="w-10">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      );
    }

    // Always show last page if we have more than one page
    if (totalPages > 1) {
      pages.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(totalPages)}
          className="w-10"
        >
          {totalPages}
        </Button>
      );
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center space-x-2 py-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="w-10 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center space-x-2">
        {renderPageButtons()}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="w-10 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}