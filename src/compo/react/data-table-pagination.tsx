
import type { Table } from "@tanstack/react-table";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  };
}

export function DataTablePagination<TData>({
  table,
  meta,
}: DataTablePaginationProps<TData>) {
  // Simple helper: just sync TanStack page index.
  const handlePageChange = (page: number) => {
    table.setPageIndex(page - 1);
  };

  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();

  // Build page number list with ellipsis
  const pages: (number | string)[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
      <div className="text-muted-foreground text-sm text-center sm:text-left">
        {meta && (
          <>
            Showing {(meta.page - 1) * meta.limit + 1} to{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{" "}
            entries
          </>
        )}
      </div>

      <div className="flex items-center">
        <Pagination>
          <PaginationContent>
            {/* Previous */}
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) {
                    handlePageChange(currentPage - 1);
                  }
                }}
                className={cn(
                  "rounded-lg cursor-pointer",
                  !table.getCanPreviousPage() &&
                    "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>

            {/* Page numbers + ellipsis */}
            {pages.map((page, idx) => {
              if (page === "...") {
                return (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              const pageNum = page as number;
              const isActive = pageNum === currentPage;

              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(pageNum);
                    }}
                    isActive={isActive}
                    size="icon-sm"
                    className="rounded-lg cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            {/* Next */}
            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) {
                    handlePageChange(currentPage + 1);
                  }
                }}
                size="icon-sm"
                className={cn(
                  "rounded-lg cursor-pointer",
                  !table.getCanNextPage() && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}