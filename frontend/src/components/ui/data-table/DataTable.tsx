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
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  filterableColumns = [],
  searchableColumns = [],
  pagination = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [globalFilter, setGlobalFilter] = useState("");

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
            pageIndex: 0,
            pageSize: rowsPerPage,
          }
        : undefined,
    },
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
        // Get the column's value
        let value;
        try {
          value = row.getValue(column.id);
        } catch {
          // Remove the underscore variable completely
          return false;
        }

        // Try to handle nested path access, e.g. "user.address.city"
        if (column.id.includes(".")) {
          const path = column.id.split(".");
          let current = row.original;

          try {
            for (const key of path) {
              current = current[key as keyof typeof current];
              if (current === undefined || current === null) break;
            }
            value = current;
          } catch {
            // Remove the underscore variable completely
            return false;
          }
        }

        // Skip null/undefined values
        if (value == null) return false;

        // Compare the value (convert to string to ensure we can search numbers too)
        return String(value).toLowerCase().includes(searchValue);
      });
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div>
      {/* Advanced filtering toolbar with global search */}
      {(effectiveSearchableColumns.length > 0 ||
        filterableColumns.length > 0) && (
        <DataTableToolbar
          table={table}
          searchableColumns={effectiveSearchableColumns}
          filterableColumns={filterableColumns}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          searchPlaceholder={searchPlaceholder}
        />
      )}

      <div className="rounded-md border">
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      {pagination && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            Showing {table.getFilteredRowModel().rows.length} of {data.length}{" "}
            entries
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <select
                className="h-8 w-16 rounded-md border border-input bg-transparent"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
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
