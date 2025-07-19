import { Box, Group, Stack } from "@mantine/core";

const positions = [
  [null, "LS", "ST", "RS", null],
  ["LW", "LF", "CF", "RF", "RW"],
  [null, "LAM", "CAM", "RAM", null],
  ["LM", "LCM", "CM", "RCM", "RM"],
  ["LWB", "LDM", "CDM", "RDM", "RWB"],
  ["LB", "LCB", "CB", "RCB", "RB"],
  [null, null, "GK", null, null],
];

export const FormationGrid = <T,>({
  cells,
  renderCell,
  renderEmptyCell,
  hideEmptyCells,
}: {
  cells: Record<string, T>;
  renderCell: (position: string, cell: T) => React.ReactNode;
  renderEmptyCell: (position: string) => React.ReactNode;
  hideEmptyCells?: boolean;
}) => {
  return (
    <Stack justify="space-around" gap={4}>
      {positions.map((row, i) => (
        <Group key={i} grow align="start">
          {row.map((position, j) => (
            <Box key={j} className="text-center">
              {position &&
                (cells[position]
                  ? renderCell(position, cells[position])
                  : !hideEmptyCells && renderEmptyCell(position))}
            </Box>
          ))}
        </Group>
      ))}
    </Stack>
  );
};
