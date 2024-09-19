import { Table, TableProps } from "@mantine/core"
import { flexRender, getCoreRowModel, RowData, TableOptions, useReactTable } from "@tanstack/react-table"

export interface DataTableProps<TData extends RowData>
  extends Pick<TableOptions<TData>, 'data' | 'columns'>, Omit<TableProps, 'data'> {
}

export const DataTable = <TData extends RowData>({ data, columns, ...props }: DataTableProps<TData>) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Table {...props}>
      <Table.Thead>
        {table.getHeaderGroups().map(headerGroup => (
          <Table.Tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <Table.Th key={header.id}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </Table.Th>
            ))}
          </Table.Tr>
        ))}
      </Table.Thead>
      <Table.Tbody>
        {table.getRowModel().rows.map(row => (
          <Table.Tr key={row.id}>
            {row.getVisibleCells().map(cell => (
              <Table.Td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </Table.Td>
            ))}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
