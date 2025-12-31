import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Column {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
  width?: string;
}

interface DataTableProps {
  title?: string;
  columns: Column[];
  data: any[];
  striped?: boolean;
  hoverable?: boolean;
}

export const DataTable = memo(function DataTable({
  title,
  columns,
  data,
  striped = true,
  hoverable = true,
}: DataTableProps) {
  return (
    <Card className="bg-card/50 border-border/50 p-6 overflow-hidden">
      {title && (
        <h3 className="text-[15px] font-semibold text-foreground mb-5">
          {title}
        </h3>
      )}

      <div className="-m-6 mt-0">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow className="border-border/50 hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-6",
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right'
                  )}
                  style={{ width: column.width }}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                className={cn(
                  "border-border/25",
                  striped && rowIndex % 2 === 1 && "bg-muted/5",
                  hoverable && "cursor-pointer hover:bg-muted/30 transition-colors duration-200"
                )}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(
                      "text-foreground text-[13px] px-6 py-4",
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      (column.format || column.key.includes('amount') || column.key.includes('count'))
                        ? 'font-mono'
                        : ''
                    )}
                  >
                    {column.format
                      ? column.format(row[column.key])
                      : row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-12 text-muted-foreground text-sm"
                >
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
});