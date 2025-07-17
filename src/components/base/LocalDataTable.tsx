import { Box, Button, Center, Flex, Table, TableProps } from "@mantine/core";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Header,
  RowData,
  SortingState,
  TableOptions,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useMemo } from "react";

export interface LocalDataTableProps<TData extends RowData>
  extends Pick<TableOptions<TData>, "data" | "columns">,
    Omit<TableProps, "data"> {}

export const LocalDataTable = <TData extends RowData>({
  data,
  columns,
  sortBy,
  ...props
}: LocalDataTableProps<TData> & { sortBy: string }) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      sorting: [
        {
          id: sortBy,
          desc: false,
        },
      ],
    },
  });

  const onClickTh = useCallback(
    (id?: string) => {
      if (!id) return;

      const sorting = table.getState().sorting;
      if (id === sorting[0]?.id) {
        table.setSorting([{ id, desc: !sorting[0]?.desc }]);
      } else {
        table.setSorting([{ id, desc: false }]);
      }
    },
    [table],
  );

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table highlightOnHover {...props}>
        <Table.Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Th
                  key={header.id}
                  header={header}
                  sorting={table.getState().sorting}
                  onClick={() => onClickTh(header.id)}
                />
              ))}
            </Table.Tr>
          ))}
        </Table.Thead>
        <Table.Tbody>
          {table.getRowModel().rows.map((row) => (
            <Table.Tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <Table.Td key={cell.id} ta={cell.column.columnDef.meta?.align}>
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
    </Table.ScrollContainer>
  );
};

const Th = <TData extends RowData, TRow>({
  header,
  sorting,
  onClick,
}: {
  header: Header<TData, TRow>;
  sorting: SortingState;
  onClick?: () => void;
}) => {
  const { columnDef } = header.column;
  const { align, sortable } = columnDef.meta ?? {};

  const sortIcon = useMemo(() => {
    if (!sortable) return "";

    if (sorting[0]?.id !== header.id) {
      return "i-mdi:unfold-more-horizontal";
    } else if (sorting[0]?.desc) {
      return "i-mdi:chevron-down";
    } else {
      return "i-mdi:chevron-up";
    }
  }, [header.id, sortable, sorting]);

  const renderHeader = header.isPlaceholder
    ? null
    : flexRender(columnDef.header, header.getContext());

  return (
    <Table.Th>
      {sortable ? (
        <Button
          onClick={onClick}
          component={"div"}
          variant="transparent"
          color="gray"
          px="0"
          w="100%"
          justify={align ?? "start"}
        >
          <Flex
            columnGap="4px"
            direction={align === "end" ? "row-reverse" : undefined}
          >
            <Box fw={500} fz="sm">
              {renderHeader}
            </Box>
            {sortable && (
              <Center>
                <div className={sortIcon} />
              </Center>
            )}
          </Flex>
        </Button>
      ) : (
        <Box fw={500} fz="sm" ta={align ?? "start"}>
          {renderHeader}
        </Box>
      )}
    </Table.Th>
  );
};
