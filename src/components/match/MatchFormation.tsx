import { Cap, Player } from "@/types";
import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Grid,
  Group,
  Indicator,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { chunk } from "lodash-es";

type PlayerOption = Pick<
  Player,
  "id" | "name" | "status" | "pos" | "ovr" | "kit_no"
>;

export const MatchFormation: React.FC<{
  readonly: boolean;
  playerOptions: PlayerOption[];
}> = ({ readonly, playerOptions }) => {
  const [minute, setMinute] = useState(0);
  const { activeCaps } = useMatchState(minute);

  const formation = useMemo(() => {
    return activeCaps.reduce((capFormation: Record<string, Cap>, cap) => {
      capFormation[cap.pos] = cap;
      return capFormation;
    }, {});
  }, [activeCaps]);

  const caps = useAtomValue(capsAtom);
  const benchCaps = useMemo(() => {
    const processed = activeCaps.map((activeCap) => activeCap.player_id);

    const bench: Cap[] = [];
    for (const cap of caps) {
      if (!processed.includes(cap.player_id)) {
        bench.push(cap);
        processed.push(cap.player_id);
      }
    }
    return bench;
  }, [activeCaps, caps]);

  const benchRows = useMemo(() => {
    return chunk(benchCaps, 4);
  }, [benchCaps]);

  const match = useAtomValue(matchAtom)!;
  const team = useAtomValue(teamAtom)!;
  const isTeamHome = useMemo(
    () => team.name === match.home_team,
    [match.home_team, team.name],
  );
  const changeMinutes = useMemo(() => {
    return [
      ...new Set([
        ...caps.map((cap) => cap.start_minute),
        ...match.bookings
          .filter((booking) => booking.red_card && isTeamHome === booking.home)
          .map((booking) => booking.minute),
      ]),
    ].sort();
  }, [caps, isTeamHome, match.bookings]);

  useEffect(() => {
    if (changeMinutes.length > 1) {
      setMinute(changeMinutes[changeMinutes.length - 1]);
    }
  }, [changeMinutes]);

  const opponent = isTeamHome ? match.away_team : match.home_team;

  return (
    <Stack gap="xs">
      {changeMinutes.length > 1 && (
        <Group px="xl">
          {changeMinutes.map((changeMinute, i) => (
            <>
              <ActionIcon
                onClick={() => setMinute(changeMinute)}
                key={changeMinute}
                variant={changeMinute === minute ? "filled" : "light"}
                size="lg"
                radius="xl"
                fz="sm"
              >
                {changeMinute}'
              </ActionIcon>
              {i !== changeMinutes.length - 1 && (
                <Divider key={i} style={{ flexGrow: 1 }} />
              )}
            </>
          ))}
        </Group>
      )}
      <FormationGrid
        cells={formation}
        renderCell={(position, cap) => (
          <MatchFormationItem
            key={position}
            cap={cap}
            readonly={readonly}
            playerOptions={playerOptions}
          />
        )}
        hideEmptyCells
        renderEmptyCell={() => null}
      />
      <Grid columns={5} mt="xs">
        <Grid.Col span={4} fz="sm">
          Bench
          <Grid columns={4}>
            {benchRows.map((row, i) => (
              <>
                {row.map((cap) => (
                  <Grid.Col span={1} key={cap.id}>
                    <MatchFormationItem
                      cap={cap}
                      readonly={readonly}
                      playerOptions={[]}
                      bench
                    />
                  </Grid.Col>
                ))}
                {Array.from({ length: 4 - row.length }).map((_, j) => (
                  <Grid.Col span={1} key={`${i}-${j}`} />
                ))}
              </>
            ))}
          </Grid>
        </Grid.Col>
        <Grid.Col span={1} fz="sm">
          vs
          <Box mt="xs">{opponent}</Box>
        </Grid.Col>
      </Grid>
    </Stack>
  );
};

const MatchFormationItem: React.FC<{
  cap: Cap;
  readonly: boolean;
  playerOptions: PlayerOption[];
  bench?: boolean;
}> = ({ cap, readonly, playerOptions, bench }) => {
  const [opened, { open, close }] = useDisclosure();

  const team = useAtomValue(teamAtom)!;
  const match = useAtomValue(matchAtom)!;
  const isTeamHome = team.name === match.home_team;

  return (
    <Stack gap={readonly ? 4 : 0}>
      <Button
        onClick={readonly || bench ? undefined : open}
        variant="transparent"
        color="gray"
        h="auto"
      >
        <Box>
          <MText fw="bold">{cap.pos}</MText>
          <Indicator
            label={cap.kit_no}
            color="transparent"
            position="middle-center"
            zIndex={1}
          >
            <BaseIcon
              name="i-mdi:tshirt-crew"
              w="auto"
              c={isTeamHome ? "cyan.6" : "teal.6"}
              fz={50}
            />
          </Indicator>
          <MText size="xs">{cap.players.name}</MText>
        </Box>
      </Button>
      <CapRating cap={cap} readonly={readonly} justify="center" gap={2} />
      <CapSummary cap={cap} justify="center" />
      <CapModal
        cap={cap}
        opened={opened}
        onClose={close}
        playerOptions={playerOptions}
      />
    </Stack>
  );
};
