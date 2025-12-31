import React, { memo } from 'react';

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
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '14px',
      padding: '24px',
      overflow: 'hidden',
    }}>
      {title && (
        <h3 style={{
          fontSize: '15px',
          fontWeight: '600',
          color: '#FAFAFA',
          marginBottom: '20px',
          fontFamily: 'Outfit, sans-serif',
        }}>
          {title}
        </h3>
      )}

      <div style={{
        overflowX: 'auto',
        margin: '-24px',
        marginTop: title ? '0' : '-24px',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px',
          fontFamily: 'Outfit, sans-serif',
        }}>
          <thead>
            <tr style={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
            }}>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    padding: '12px 24px',
                    textAlign: column.align || 'left',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                    width: column.width,
                  }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  background: striped && rowIndex % 2 === 1
                    ? 'rgba(255, 255, 255, 0.01)'
                    : 'transparent',
                  transition: hoverable ? 'background 0.2s ease-out' : 'none',
                  cursor: hoverable ? 'pointer' : 'default',
                }}
                onMouseEnter={(e) => {
                  if (hoverable) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (hoverable) {
                    e.currentTarget.style.background = striped && rowIndex % 2 === 1
                      ? 'rgba(255, 255, 255, 0.01)'
                      : 'transparent';
                  }
                }}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={{
                      padding: '16px 24px',
                      textAlign: column.align || 'left',
                      color: '#FAFAFA',
                      fontSize: '13px',
                      fontFamily: column.format || column.key.includes('amount') || column.key.includes('count')
                        ? 'JetBrains Mono, monospace'
                        : 'Outfit, sans-serif',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {column.format
                      ? column.format(row[column.key])
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: '48px',
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '14px',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});