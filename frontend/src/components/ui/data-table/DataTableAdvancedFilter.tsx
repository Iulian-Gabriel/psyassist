import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table } from "@tanstack/react-table";
import { Filter, Search } from "lucide-react";
import { getColumnById } from "./DataTableUtils";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  filterableColumns?: {
    id: string;
    title: string;
    options?: { value: string; label: string }[];
  }[];
  searchableColumns?: {
    id: string;
    title: string;
  }[];
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  searchPlaceholder?: string; // Add this prop
}

export function DataTableToolbar<TData>({
  table,
  filterableColumns = [],
  searchableColumns = [],
  globalFilter = "",
  setGlobalFilter = () => {},
  searchPlaceholder, // Use this prop
}: DataTableToolbarProps<TData>) {
  const handleFilterChange = (columnId: string, value: string) => {
    // Using our utility function instead of direct access
    const column = getColumnById(columnId, table);
    column?.setFilterValue(value);
  };

  // Generate search placeholder text
  const getSearchPlaceholder = () => {
    if (searchPlaceholder) return searchPlaceholder;

    if (searchableColumns.length === 0) return "Search...";

    const columnTitles = searchableColumns.map((col) =>
      col.title.toLowerCase()
    );

    if (columnTitles.length === 1) {
      return `Search by ${columnTitles[0]}...`;
    }

    if (columnTitles.length === 2) {
      return `Search by ${columnTitles[0]} or ${columnTitles[1]}...`;
    }

    const lastColumn = columnTitles.pop();
    return `Search by ${columnTitles.join(", ")} or ${lastColumn}...`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-4">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Global search bar for multiple columns */}
        {searchableColumns.length > 0 && (
          <div className="w-full max-w-sm flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={getSearchPlaceholder()}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="h-8 w-full"
            />
          </div>
        )}

        {/* Dropdown filters remain the same */}
        {filterableColumns.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {filterableColumns.map((column) => {
              if (!column.options) return null;

              return (
                <DropdownMenu key={column.id}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <Filter className="mr-2 h-4 w-4" />
                      {column.title}
                      {table.getColumn(column.id)?.getFilterValue() ? (
                        <span className="ml-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs">
                          Active
                        </span>
                      ) : null}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {column.options.map((option) => (
                      <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={
                          table.getColumn(column.id)?.getFilterValue() ===
                          option.value
                        }
                        onCheckedChange={() =>
                          handleFilterChange(
                            column.id,
                            table.getColumn(column.id)?.getFilterValue() ===
                              option.value
                              ? ""
                              : option.value
                          )
                        }
                      >
                        {option.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                    {table.getColumn(column.id)?.getFilterValue() ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => handleFilterChange(column.id, "")}
                      >
                        Clear Filter
                      </Button>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
