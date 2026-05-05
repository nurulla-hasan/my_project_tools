"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  PaginationState,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSmartFilter } from "@/hooks/useSmartFilter";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "../scroll-area";

/**
 * Metadata for server-side pagination
 */
type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/**
 * Extend TanStack Table's ColumnMeta to support custom sorting/filtering
 */
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string;
    /** URL parameter key for sorting (e.g., "price") */
    sortKey?: string;
    /** Custom values for sorting directions (e.g., { asc: "low", desc: "high" }) */
    sortValues?: { asc: string; desc: string };
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  limit?: number;
  meta?: PaginationMeta;
  /** The key in the URL for searching (e.g., "q" or "customer") */
  searchKey?: string;
  searchPlaceholder?: string;
  showFooter?: boolean;
}

/**
 * Internal component that handles all the table logic and URL synchronization.
 * This is wrapped in Suspense by the main DataTable component.
 */
function DataTableInner<TData, TValue>({
  columns,
  data,
  limit = 10,
  meta,
  searchKey,
  searchPlaceholder,
  showFooter = false,
}: DataTableProps<TData, TValue>) {
  // Initialize our Smart Filter hook for URL synchronization
  const { updateFilter, getFilter } = useSmartFilter();

  /**
   * Initialize table sorting state from the URL.
   * Only columns with a 'sortKey' defined in their metadata will be synced.
   */
  const [sorting, setSorting] = React.useState<SortingState>(() => {
    const initialState: SortingState = [];
    columns.forEach((col) => {
      const columnMeta = col.meta;
      if (columnMeta?.sortKey) {
        const val = getFilter(columnMeta.sortKey);
        if (val) {
          const isDesc = val === (columnMeta.sortValues?.desc ?? "high");
          initialState.push({ id: (col as { accessorKey?: string }).accessorKey ?? "", desc: isDesc });
        }
      }
    });
    return initialState;
  });

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: meta ? meta.page - 1 : 0,
    pageSize: limit,
  });

  // Keep internal pagination state in sync with external meta props
  React.useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageSize: limit,
      ...(meta && { pageIndex: meta.page - 1 }),
    }));
  }, [limit, meta]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    pageCount: meta
      ? (meta.totalPages ?? Math.ceil(meta.total / meta.limit))
      : undefined,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: !!meta,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);

      if (next.length > 0) {
        const column = table.getColumn(next[0].id);
        const columnMeta = column?.columnDef.meta;

        if (columnMeta?.sortKey) {
          const key = columnMeta.sortKey;
          const value = next[0].desc
            ? columnMeta.sortValues?.desc ?? "high"
            : columnMeta.sortValues?.asc ?? "low";

          updateFilter(key, value);
        }
      } else {
        if (sorting.length > 0) {
          const column = table.getColumn(sorting[0].id);
          const columnMeta = column?.columnDef.meta;
          if (columnMeta?.sortKey) {
            updateFilter(columnMeta.sortKey, null);
          }
        }
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        {searchKey && (
          <div className="relative w-full max-w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder ?? `Filter ${searchKey}...`}
              value={getFilter(searchKey || "")}
              onChange={(event) =>
                updateFilter(searchKey || "", event.target.value, {
                  debounce: 500,
                })
              }
              className="pl-9"
            />
          </div>
        )}
      </div>
      
      <ScrollArea className="w-full rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "h-12 px-4 bg-accent",
                      header.column.columnDef.meta?.headerClassName,
                    )}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "flex items-center gap-1 cursor-pointer select-none hover:text-foreground"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && (
                          <span className="ml-1">
                            {header.column.getIsSorted() === "asc" && (
                              <ArrowUp className="h-3 w-3" />
                            )}
                            {header.column.getIsSorted() === "desc" && (
                              <ArrowDown className="h-3 w-3" />
                            )}
                            {!header.column.getIsSorted() && (
                              <ArrowUpDown className="h-3 w-3 opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="h-12 pl-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          
          {showFooter && (
            <TableFooter className="border-t">
              {table.getFooterGroups().map((footerGroup) => (
                <TableRow key={footerGroup.id}>
                  {footerGroup.headers.map((footer) => (
                    <TableCell key={footer.id} className="p-2">
                      {footer.isPlaceholder
                        ? null
                        : flexRender(
                            footer.column.columnDef.footer,
                            footer.getContext(),
                          )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableFooter>
          )}
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {(meta || table.getPageCount() > 1) && (
        <DataTablePagination table={table} meta={meta} />
      )}
    </div>
  );
}

/**
 * Main DataTable component wrapped in a Suspense boundary.
 * Use this component anywhere in your app without worrying about search params bailout.
 */
export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  return (
    <React.Suspense fallback={null}>
      <DataTableInner {...props} />
    </React.Suspense>
  );
}
