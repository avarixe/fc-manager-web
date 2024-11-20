import { Cap, Player } from "@/types";
import { Box, Button, Group, NavLink } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { orderBy } from "lodash-es";

type PlayerOption = Pick<
  Player,
  "id" | "name" | "status" | "pos" | "ovr" | "kit_no"
>;

export const MatchLineup: React.FC<{
  readonly: boolean;
  playerOptions: PlayerOption[];
}> = ({ readonly, playerOptions }) => {
  const { getFirstCaps } = useCapHelpers();
  const sortedCaps = useMemo(() => {
    return orderBy(
      getFirstCaps(),
      ["pos_order", "start_minute"],
      ["asc", "asc"],
    );
  }, [getFirstCaps]);

  const team = useAtomValue(teamAtom)!;
  const match = useAtomValue(matchAtom)!;
  return (
    <Box>
      <MText pl="xs" size="sm" className="opacity-60">
        Players
      </MText>
      {sortedCaps.map((cap) => (
        <MatchLineupItem
          key={cap.id}
          cap={cap}
          readonly={readonly}
          playerOptions={playerOptions}
        />
      ))}
      <MText pl="xs" size="sm" mt="xs" className="opacity-60">
        Teams
      </MText>
      {match.home_team !== team.name && (
        <NavLink
          label={match.home_team}
          leftSection={
            <Box w={50} fw={700}>
              Home
            </Box>
          }
        />
      )}
      {match.away_team !== team.name && (
        <NavLink
          label={match.away_team}
          leftSection={
            <Box w={50} fw={700}>
              Away
            </Box>
          }
        />
      )}
    </Box>
  );
};

const MatchLineupItem: React.FC<{
  cap: Cap;
  readonly: boolean;
  playerOptions: PlayerOption[];
}> = ({ cap, readonly, playerOptions }) => {
  const [opened, { open, close }] = useDisclosure();

  return (
    <NavLink
      key={cap.id}
      label={
        <Group>
          <Button
            onClick={readonly ? undefined : open}
            size="compact-sm"
            variant="transparent"
            color="gray"
            leftSection={`#${cap.kit_no}`}
          >
            {cap.players.name}
          </Button>
          <CapModal
            cap={cap}
            opened={opened}
            onClose={close}
            playerOptions={playerOptions}
          />
          <CapSummary cap={cap} />
        </Group>
      }
      leftSection={
        <Box w={40} fw={700}>
          {cap.pos}
        </Box>
      }
      rightSection={<CapRating cap={cap} readonly={readonly} />}
      classNames={{
        body: "overflow-visible",
      }}
    />
  );
};
