import { Group, Pagination, Table, TableProps } from "@mantine/core"
import { ColumnSort, flexRender, getCoreRowModel, RowData, TableOptions, useReactTable } from "@tanstack/react-table"

export interface DataTableProps<TData extends RowData>
  extends Pick<TableOptions<TData>, 'data' | 'columns'>, Omit<TableProps, 'data'> {
    tableState: TableState;
    setTableState: StateSetter<TableState>;
}

interface TableState {
  pageIndex: number;
  pageSize: number;
  rowCount: number;
  sorting?: ColumnSort;
}

export const DataTable = <TData extends RowData>({
  data,
  columns,
  tableState,
  setTableState,
  ...props
}: DataTableProps<TData>) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const totalPages = useMemo(
    () => Math.ceil(tableState.rowCount / tableState.pageSize),
    [tableState.rowCount, tableState.pageSize]
  )

  const onChangePagination = useCallback((value: number) => {
      setTableState((prev: TableState) => ({ ...prev, pageIndex: value - 1 }))
    },
    [setTableState]
  )

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table {...props}>
        <Table.Thead>
          {table.getHeaderGroups().map(headerGroup => (
            <Table.Tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <Table.Th
                  key={header.id}
                  className={`text-${header.column.columnDef.meta?.align ?? 'start'}`}
                >
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
                <Table.Td
                  key={cell.id}
                  className={`text-${cell.column.columnDef.meta?.align ?? 'start'}`}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={columns.length} className="text-center">
                No data
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
      <Group mt="xs">
        <Pagination
          value={tableState.pageIndex + 1}
          total={totalPages}
          onChange={onChangePagination}
          className="ml-auto"
        />
      </Group>
    </Table.ScrollContainer>
  )
}
