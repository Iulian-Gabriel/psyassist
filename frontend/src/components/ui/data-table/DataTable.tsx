import * as React from "react";
import { useState } from "react";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DataTableToolbar } from "./DataTableAdvancedFilter";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  filterableColumns?: {
    id: string;
    title: string;
    options?: { value: string; label: string }[];
  }[];
  searchableColumns?: {
    id: string;
    title: string;
  }[];
  pagination?: boolean;
  initialSorting?: SortingState; // Add this prop
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  filterableColumns = [],
  searchableColumns = [],
  pagination = true,
  initialSorting = [], // Default to empty array
}: DataTableProps<TData, TValue>) {
  // Use initialSorting in the useState initialization
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [globalFilter, setGlobalFilter] = useState("");
  // Add state for current page
  const [pageIndex, setPageIndex] = useState(0);

  // Determine searchable columns based on props
  const effectiveSearchableColumns =
    searchableColumns.length > 0
      ? searchableColumns
      : searchKey
      ? [{ id: searchKey, title: searchKey.split(".").pop() || searchKey }]
      : [];

  // Create the table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination: pagination
        ? {
            pageIndex, // Use the state value
            pageSize: rowsPerPage,
          }
        : undefined,
    },
    // Add pagination handlers
    onPaginationChange: pagination
      ? (updater) => {
          if (typeof updater === "function") {
            const newState = updater({
              pageIndex,
              pageSize: rowsPerPage,
            });
            setPageIndex(newState.pageIndex);
            setRowsPerPage(newState.pageSize);
          } else {
            setPageIndex(updater.pageIndex);
            setRowsPerPage(updater.pageSize);
          }
        }
      : undefined,
    // Custom filter function for global search
    filterFns: {
      globalSearch: (row, columnId, value) => {
        const searchValue = String(value).toLowerCase();
        const cellValue = String(row.getValue(columnId) || "").toLowerCase();
        return cellValue.includes(searchValue);
      },
    },
    // This is the key part - apply globalFilter to search across columns
    globalFilterFn: (row, _columnId, filterValue) => {
      // Skip empty searches
      if (!filterValue || filterValue === "") return true;

      // Search all searchable columns
      const searchValue = String(filterValue).toLowerCase();

      return effectiveSearchableColumns.some((column) => {
        const cellValue = String(row.getValue(column.id) || "").toLowerCase();
        return cellValue.includes(searchValue);
      });
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="space-y-4">
      {/* DataTableToolbar component */}
      <DataTableToolbar
        table={table}
        filterableColumns={filterableColumns}
        searchableColumns={effectiveSearchableColumns}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        searchPlaceholder={searchPlaceholder}
      />

      {/* Table with shadow for better visibility */}
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
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
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls - fixed with proper event handlers */}
      {pagination && (
        <div className="flex items-center justify-between px-2">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} row(s) total.
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <select
                className="h-8 rounded-md border border-input bg-transparent px-2"
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
              >
                {[5, 10, 20, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount() || 1}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
