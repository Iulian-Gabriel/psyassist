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
  defaultSorting?: SortingState;
  // ADDED: sorting and setSorting for controlled usage
  sorting?: SortingState;
  setSorting?: React.Dispatch<React.SetStateAction<SortingState>>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  filterableColumns = [],
  searchableColumns = [],
  pagination = true,
  defaultSorting = [], // Use this for internal state initialization
  sorting: controlledSorting, // Renamed to controlledSorting for clarity
  setSorting: setControlledSorting, // Renamed to setControlledSorting for clarity
}: DataTableProps<TData, TValue>) {
  // Determine if sorting is controlled by props
  const isControlledSorting =
    controlledSorting !== undefined && setControlledSorting !== undefined;

  // Use internal state only if not controlled by parent
  const [internalSorting, setInternalSorting] = useState<SortingState>(
    isControlledSorting ? controlledSorting : defaultSorting // Initialize with controlled or default
  );

  // Memoize the effective sorting state and setter based on whether it's controlled
  const [currentSorting, currentSetSorting] = React.useMemo(() => {
    if (isControlledSorting) {
      return [controlledSorting, setControlledSorting];
    }
    return [internalSorting, setInternalSorting];
  }, [
    isControlledSorting,
    controlledSorting,
    setControlledSorting,
    internalSorting,
    setInternalSorting,
  ]);

  // Keep internal state in sync with controlledSorting if it changes and we're controlled
  // This useEffect ensures that if the parent passes a new 'controlledSorting' array
  // when the component is being controlled, the internal state reflects it.
  React.useEffect(() => {
    if (isControlledSorting && controlledSorting !== internalSorting) {
      // Only update internal state if it's different to prevent infinite loops
      // if controlledSorting is not perfectly memoized by the parent.
      setInternalSorting(controlledSorting);
    }
  }, [isControlledSorting, controlledSorting, internalSorting]); // Added internalSorting to deps

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  const effectiveSearchableColumns =
    searchableColumns.length > 0
      ? searchableColumns
      : searchKey
      ? [{ id: searchKey, title: searchKey.split(".").pop() || searchKey }]
      : [];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Use the determined currentSetSorting and currentSorting here
    onSortingChange: currentSetSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    state: {
      // Use the determined currentSorting here
      sorting: currentSorting,
      columnFilters,
      globalFilter,
      pagination: pagination
        ? {
            pageIndex,
            pageSize: rowsPerPage,
          }
        : undefined,
    },
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
    filterFns: {
      globalSearch: (row, columnId, value) => {
        const searchValue = String(value).toLowerCase();
        const cellValue = String(row.getValue(columnId) || "").toLowerCase();
        return cellValue.includes(searchValue);
      },
    },
    globalFilterFn: (row, _columnId, filterValue) => {
      if (!filterValue || filterValue === "") return true;

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
      <DataTableToolbar
        table={table}
        filterableColumns={filterableColumns}
        searchableColumns={effectiveSearchableColumns}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        searchPlaceholder={searchPlaceholder}
      />

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
