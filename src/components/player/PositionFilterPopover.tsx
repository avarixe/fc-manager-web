import { Button, Checkbox, Group, Popover, Stack } from "@mantine/core";

export const PositionFilterPopover: React.FC<{
  positionFilter: Set<string>;
  onChangePositionFilter: (positions: Set<string>) => void;
}> = ({ positionFilter, onChangePositionFilter }) => {
  const togglePosition = useCallback(
    (position: string) => {
      const newFilter = new Set(positionFilter);
      if (newFilter.has(position)) {
        newFilter.delete(position);
      } else {
        newFilter.add(position);
      }
      onChangePositionFilter(newFilter);
    },
    [positionFilter, onChangePositionFilter],
  );

  const toggleGroup = useCallback(
    (groupPositions: string[]) => {
      const newFilter = new Set(positionFilter);
      const allSelected = groupPositions.every((pos) => newFilter.has(pos));

      if (allSelected) {
        // Remove all positions in this group
        groupPositions.forEach((pos) => newFilter.delete(pos));
      } else {
        // Add all positions in this group
        groupPositions.forEach((pos) => newFilter.add(pos));
      }
      onChangePositionFilter(newFilter);
    },
    [positionFilter, onChangePositionFilter],
  );

  const clearAll = useCallback(() => {
    onChangePositionFilter(new Set());
  }, [onChangePositionFilter]);

  const activeCount = positionFilter.size;

  return (
    <Popover width={300} position="bottom-start" trapFocus>
      <Popover.Target>
        <Button
          variant={activeCount > 0 ? "filled" : "default"}
          leftSection={<BaseIcon name="i-mdi:filter" />}
          size="sm"
        >
          Pos
          {activeCount > 0 && (
            <MText size="xs" ml={4} fw={500}>
              ({activeCount})
            </MText>
          )}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="md">
          {activeCount > 0 && (
            <Group justify="end">
              <Button size="compact-xs" variant="subtle" onClick={clearAll}>
                Clear All
              </Button>
            </Group>
          )}

          {matchPosTypes.map((groupName) => {
            const groupPositions = positionsByType[groupName];
            const allSelected = groupPositions.every((pos) =>
              positionFilter.has(pos),
            );
            const someSelected = groupPositions.some((pos) =>
              positionFilter.has(pos),
            );

            return (
              <Stack key={groupName} gap="xs">
                <Group>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onChange={() => toggleGroup(groupPositions)}
                    label={groupName}
                  />
                </Group>
                <Group gap="xs" ml="lg">
                  {groupPositions.map((position) => (
                    <Checkbox
                      key={position}
                      checked={positionFilter.has(position)}
                      onChange={() => togglePosition(position)}
                      label={position}
                      size="xs"
                    />
                  ))}
                </Group>
              </Stack>
            );
          })}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};
