"use client";

import { Table } from "@tanstack/react-table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSmartFilter } from "@/hooks/useSmartFilter";
import React from "react";
import { PaginationMeta } from "@/types/global.type";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  meta?: PaginationMeta;
}

export function DataTablePagination<TData>({
  table,
  meta,
}: DataTablePaginationProps<TData>) {
  const { updateFilter } = useSmartFilter();

  React.useEffect(() => {
    if (meta) {
      const totalPages = meta.totalPages ?? Math.ceil(meta.total / meta.limit);

      if (meta.page > totalPages && totalPages > 0) {
        updateFilter("page", totalPages, { resetPage: false });
      }
    }
  }, [meta, updateFilter]);

  // Handle server-side pagination URL updates
  const handlePageChange = (page: number) => {
    if (meta) {
      updateFilter("page", page, { resetPage: false });
    }
  };

  const handleLimitChange = (value: string) => {
    const limit = Number(value);
    if (meta) {
      updateFilter("limit", limit);
    } else {
      table.setPageSize(limit);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
      <div className="text-muted-foreground text-sm text-center sm:text-left">
        {meta ? (
          <>
            Showing {(meta.page - 1) * meta.limit + 1} to{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{" "}
            entries
          </>
        ) : (
          <>
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )} of {table.getFilteredRowModel().rows.length}{" "}
            entries
          </>
        )}
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 lg:gap-8">
        <div className="flex items-center gap-2">
          <p className="whitespace-nowrap text-sm font-medium">Rows per page</p>
          <Select
            value={`${meta ? meta.limit : table.getState().pagination.pageSize}`}
            onValueChange={handleLimitChange}
          >
            <SelectTrigger size="sm">
              <SelectValue
                placeholder={
                  meta ? meta.limit : table.getState().pagination.pageSize
                }
              />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center">
          <Pagination>
            <PaginationContent className="gap-1">
              <PaginationItem>
                <PaginationPrevious
                  onClick={(e: { preventDefault: () => void; }) => {
                    e.preventDefault();
                    if (meta) {
                      if (meta.page > 1) handlePageChange(meta.page - 1);
                    } else {
                      table.previousPage();
                    }
                  }}
                  className={cn(
                    "h-8 w-8 sm:w-auto p-0 sm:px-3 cursor-pointer",
                    !table.getCanPreviousPage() &&
                      "pointer-events-none opacity-50",
                  )}
                />
              </PaginationItem>

            {(() => {
              const page = table.getState().pagination.pageIndex + 1;
              const totalPages = table.getPageCount();
              const pages: (number | string)[] = [];

              if (totalPages <= 8) {
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i);
                }
              } else {
                // Left boundary: 3 pages
                pages.push(1, 2, 3);

                if (page > 4) {
                  pages.push("...");
                }

                // Middle section
                const start = Math.max(4, page - 1);
                const end = Math.min(totalPages - 2, page + 1);

                for (let i = start; i <= end; i++) {
                  pages.push(i);
                }

                if (page < totalPages - 3) {
                  pages.push("...");
                }

                // Right boundary: 2 pages
                pages.push(totalPages - 1, totalPages);
              }

              return pages.map((pageNumItem, idx) => {
                if (pageNumItem === "...") {
                  return (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis className="h-8 w-8" />
                    </PaginationItem>
                  );
                }

                const pageNum = pageNumItem as number;
                const isActive = pageNum === page;

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={(e: { preventDefault: () => void; }) => {
                        e.preventDefault();
                        if (meta) {
                          handlePageChange(pageNum);
                        } else {
                          table.setPageIndex(pageNum - 1);
                        }
                      }}
                      isActive={isActive}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              });
            })()}

            <PaginationItem>
              <PaginationNext
                onClick={(e: { preventDefault: () => void; }) => {
                  e.preventDefault();
                  if (meta) {
                    const totalPages =
                      meta.totalPages ?? Math.ceil(meta.total / meta.limit);
                    if (meta.page < totalPages) handlePageChange(meta.page + 1);
                  } else {
                    table.nextPage();
                  }
                }}
                className={cn(
                  !table.getCanNextPage() && "pointer-events-none opacity-50",
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  </div>
);
}
