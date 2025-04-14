import { Table } from "@tanstack/react-table";

/**
 * Safely get a column from a table by ID
 * Handles cases where the column might not exist
 */
export const getColumnById = <TData>(columnId: string, table: Table<TData>) => {
  // Try to get column directly
  let column = table.getColumn(columnId);

  // If not found and contains dot notation, try the first part
  if (!column && columnId.includes(".")) {
    const mainPart = columnId.split(".")[0];
    column = table.getColumn(mainPart);
  }

  return column;
};
