import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type PaginationState,
  type Updater,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertCircle, Loader } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { DataTablePagination } from "./data-table-pagination";

/* eslint-disable @typescript-eslint/no-unused-vars */
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string;
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  /**
   * Client-side pagination size.
   * If not provided and meta is not provided, table will show all rows.
   */
  pageSize?: number;

  isLoading?: boolean;
  isError?: boolean;
  isFetching?: boolean;

  /**
   * Server-side pagination meta.
   * If provided, table will use server-side pagination.
   */
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  };

  onPageChange?: (page: number) => void;
  onPageSizeChange?: (limit: number) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize,
  isLoading,
  isError,
  isFetching,
  meta,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const [clientPagination, setClientPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: pageSize ?? data.length,
    });

  const isServerPagination = Boolean(meta);
  const isClientPagination = Boolean(!meta && pageSize);
  const shouldUsePagination = isServerPagination || isClientPagination;

  React.useEffect(() => {
    if (!pageSize || meta) return;

    setClientPagination(() => ({
      pageIndex: 0,
      pageSize,
    }));
  }, [pageSize, meta]);

  const skeletonRowCount = meta?.limit ?? pageSize ?? 1;

  const onPaginationChange = (updater: Updater<PaginationState>) => {
    if (meta) {
      const currentPagination: PaginationState = {
        pageIndex: meta.page - 1,
        pageSize: meta.limit,
      };

      const nextPagination =
        typeof updater === "function" ? updater(currentPagination) : updater;

      if (nextPagination.pageIndex !== currentPagination.pageIndex) {
        onPageChange?.(nextPagination.pageIndex + 1);
      }

      if (nextPagination.pageSize !== currentPagination.pageSize) {
        onPageSizeChange?.(nextPagination.pageSize);
      }

      return;
    }

    if (pageSize) {
      setClientPagination((currentPagination) => {
        const nextPagination =
          typeof updater === "function" ? updater(currentPagination) : updater;

        if (nextPagination.pageIndex !== currentPagination.pageIndex) {
          onPageChange?.(nextPagination.pageIndex + 1);
        }

        if (nextPagination.pageSize !== currentPagination.pageSize) {
          onPageSizeChange?.(nextPagination.pageSize);
        }

        return nextPagination;
      });
    }
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,

    pageCount: meta
      ? (meta.totalPages ?? Math.ceil(meta.total / meta.limit))
      : undefined,

    state: {
      sorting,

      ...(meta && {
        pagination: {
          pageIndex: meta.page - 1,
          pageSize: meta.limit,
        },
      }),

      ...(!meta &&
        pageSize && {
        pagination: clientPagination,
      }),
    },

    manualPagination: isServerPagination,

    onSortingChange: setSorting,
    onPaginationChange: shouldUsePagination ? onPaginationChange : undefined,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),

    ...(shouldUsePagination && {
      getPaginationRowModel: getPaginationRowModel(),
    }),
  });

  const paginationMeta =
    meta ??
    (pageSize
      ? {
        total: data.length,
        page: table.getState().pagination.pageIndex + 1,
        limit: table.getState().pagination.pageSize,
        totalPages: table.getPageCount(),
      }
      : undefined);

  return (
    <div className="space-y-4">
      <div className="relative">
        {isFetching && !isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/10 backdrop-blur-[1px]">
            <Loader className="text-primary size-6 animate-spin" />
          </div>
        )}

        <ScrollArea className="w-full rounded-xl border whitespace-nowrap">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={header.column.columnDef.meta?.headerClassName}
                    >
                      <div className="flex w-full items-center justify-between gap-1">
                        <div className="flex-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: skeletonRowCount }).map((_, index) => (
                  <TableRow key={index} className="h-14">
                    {columns.map((_column, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-6 w-full rounded-md" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-22 text-center text-destructive"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-6 w-6" />
                      <span>Something went wrong! Please try again later.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={`h-14 ${isFetching
                        ? "opacity-50 transition-opacity duration-200"
                        : ""
                      }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-22 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <React.Suspense fallback={null}>
        {paginationMeta && !isError && !isLoading && (
          <DataTablePagination table={table} meta={paginationMeta} />
        )}
      </React.Suspense>
    </div>
  );
}