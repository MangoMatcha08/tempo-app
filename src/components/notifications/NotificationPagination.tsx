
import React, { useEffect } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Loader2 } from "lucide-react";
import { performanceMonitor } from '@/utils/performanceUtils';

interface NotificationPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

const NotificationPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  isLoading = false,
  disabled = false,
}: NotificationPaginationProps) => {
  // Don't render pagination if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  // Generate array of page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    
    // Always show first page
    pages.push(1);
    
    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (pages[pages.length - 1] !== i - 1) {
        pages.push(-1); // Represent ellipsis
      }
      pages.push(i);
    }
    
    // Always show last page
    if (totalPages > 1) {
      if (pages[pages.length - 1] !== totalPages - 1) {
        pages.push(-1); // Represent ellipsis
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Track keyboard navigation and add event listeners
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if pagination is enabled and not loading
      if (disabled || isLoading) return;
      
      if (event.key === "ArrowLeft" && currentPage > 1) {
        // Ensure we're not in an input field
        if (
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA"
        ) {
          onPageChange(currentPage - 1);
          
          // Log navigation performance
          performanceMonitor.startMark(
            `pagination-keyboard-prev-${Date.now()}`, 
            'notifications', // Using appropriate category instead of 'pagination'
            { from: currentPage, to: currentPage - 1, method: 'keyboard' }
          );
        }
      } else if (event.key === "ArrowRight" && currentPage < totalPages) {
        // Ensure we're not in an input field
        if (
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA"
        ) {
          onPageChange(currentPage + 1);
          
          // Log navigation performance
          performanceMonitor.startMark(
            `pagination-keyboard-next-${Date.now()}`, 
            'notifications', // Using appropriate category instead of 'pagination'
            { from: currentPage, to: currentPage + 1, method: 'keyboard' }
          );
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentPage, totalPages, onPageChange, disabled, isLoading]);

  // Log performance metrics when user changes page
  const handlePageClick = (page: number) => {
    performanceMonitor.startMark(
      `pagination-click-${Date.now()}`, 
      'notifications', // Using appropriate category instead of 'pagination'
      { from: currentPage, to: page, method: 'click' }
    );
    onPageChange(page);
  };

  const pageNumbers = getPageNumbers();

  return (
    <Pagination className={className}>
      <PaginationContent>
        {/* Previous page button */}
        <PaginationItem>
          <PaginationPrevious
            onClick={() => currentPage > 1 && handlePageClick(currentPage - 1)}
            className={
              currentPage === 1 || disabled || isLoading
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
            aria-disabled={currentPage === 1 || disabled || isLoading}
          />
        </PaginationItem>
        
        {/* Page numbers */}
        {pageNumbers.map((page, idx) => (
          page === -1 ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                isActive={page === currentPage}
                onClick={() => handlePageClick(page)}
                className={disabled || isLoading ? "pointer-events-none" : "cursor-pointer"}
                aria-disabled={disabled || isLoading}
              >
                {isLoading && page === currentPage ? (
                  <span className="flex items-center">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    {page}
                  </span>
                ) : (
                  page
                )}
              </PaginationLink>
            </PaginationItem>
          )
        ))}
        
        {/* Next page button */}
        <PaginationItem>
          <PaginationNext
            onClick={() => currentPage < totalPages && handlePageClick(currentPage + 1)}
            className={
              currentPage === totalPages || disabled || isLoading
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
            aria-disabled={currentPage === totalPages || disabled || isLoading}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default NotificationPagination;
