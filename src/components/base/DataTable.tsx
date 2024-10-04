import { Button, Center, Flex, Group, Pagination, Table, TableProps } from "@mantine/core"
import { ColumnSort, flexRender, getCoreRowModel, Header, RowData, TableOptions, useReactTable } from "@tanstack/react-table"

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

  const onClickTh = useCallback((id?: string) => {
    if (!id) return

    if (id === tableState.sorting?.id) {
      setTableState((prev: TableState) => ({
        ...prev,
        pageIndex: 0,
        sorting: {
          id,
          desc: !prev.sorting?.desc,
        },
      }))
    } else {
      setTableState((prev: TableState) => ({
        ...prev,
        pageIndex: 0,
        sorting: {
          id,
          desc: false,
        },
      }))
    }
  }, [setTableState, tableState.sorting?.id])

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table highlightOnHover {...props}>
        <Table.Thead>
          {table.getHeaderGroups().map(headerGroup => (
            <Table.Tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <Th
                  key={header.id}
                  header={header}
                  tableState={tableState}
                  onClick={() => onClickTh(header.id)}
                />
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
                  ta={cell.column.columnDef.meta?.align}
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

const Th = <TData extends RowData, TRow>({ header, tableState, onClick }: {
  header: Header<TData, TRow>;
  tableState: TableState;
  onClick?: () => void;
}) => {
  const { columnDef } = header.column
  const { align, sortable } = columnDef.meta ?? {}

  const sortIcon = useMemo(() => {
    if (!sortable) return ''

    if (tableState.sorting?.id !== header.id) {
      return 'i-tabler:selector'
    } else if (tableState.sorting?.desc) {
      return 'i-tabler:chevron-down'
    } else {
      return 'i-tabler:chevron-up'
    }
  }, [header.id, sortable, tableState.sorting?.desc, tableState.sorting?.id])

  const renderHeader = header.isPlaceholder
    ? null
    : flexRender(columnDef.header, header.getContext())

  return (
    <Table.Th>
      {sortable ? (
        <Button
          onClick={onClick}
          component={'div'}
          variant="transparent"
          color="gray"
          px="0"
          w="100%"
          justify={align ?? 'start'}
        >
          <Flex columnGap="4px" direction={align === 'end' ? 'row-reverse' : undefined}>
            <MText fw={500} fz="sm">
              {renderHeader}
            </MText>
            {sortable && (
              <Center>
                <div className={sortIcon} />
              </Center>
            )}
          </Flex>
        </Button>
      ) : (
        <MText fw={500} fz="sm" ta={align ?? 'start'}>
          {renderHeader}
        </MText>
      )}
    </Table.Th>
  )
}
