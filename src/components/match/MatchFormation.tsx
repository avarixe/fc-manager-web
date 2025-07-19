import {
  ActionIcon,
  Box,
  Divider,
  Grid,
  Group,
  Indicator,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAtomValue } from "jotai";
import { chunk } from "lodash-es";
import React, { useEffect, useMemo, useState } from "react";

import { capsAtom, matchAtom, teamAtom } from "@/atoms";
import {
  AssistIcon,
  BaseIcon,
  GoalIcon,
  MatchInjuryIcon,
  RedCardIcon,
  SubInIcon,
  SubOutIcon,
  YellowCardIcon,
} from "@/components/base/CommonIcons";
import { FormationGrid } from "@/components/formation/FormationGrid";
import { CapModal } from "@/components/match/CapModal";
import { CapRating } from "@/components/match/CapRating";
import { SideSummary } from "@/components/match/SideSummary";
import { useCapStats } from "@/hooks/useCapStats";
import { useMatchState } from "@/hooks/useMatchState";
import { Cap, Player } from "@/types";

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
    const processed = activeCaps.map((cap) => cap.player_id);

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

  return (
    <Stack gap="xs">
      {changeMinutes.length > 1 && (
        <Group px="xl">
          {changeMinutes.map((changeMinute, i) => (
            <React.Fragment key={`changeMinute-${i}`}>
              <ActionIcon
                onClick={() => setMinute(changeMinute)}
                key={`setMinute-${changeMinute}`}
                variant={changeMinute === minute ? "filled" : "light"}
                size="lg"
                radius="xl"
                fz="sm"
              >
                {changeMinute}'
              </ActionIcon>
              {i !== changeMinutes.length - 1 && (
                <Divider key={`divider-${i}`} style={{ flexGrow: 1 }} />
              )}
            </React.Fragment>
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
              <React.Fragment key={`benchRow-${i}`}>
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
              </React.Fragment>
            ))}
          </Grid>
        </Grid.Col>
        <Grid.Col span={1} fz="sm">
          vs
          <SideItem side={isTeamHome ? "away" : "home"} />
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

  const {
    startMinute,
    stopMinute,
    numGoals,
    numOwnGoals,
    numAssists,
    numYellowCards,
    numRedCards,
    subbedOut,
    injured,
  } = useCapStats(cap.player_id);

  return (
    <Stack gap={readonly ? 4 : 0}>
      <Box pos="relative" ta="center">
        {/* Position text */}
        <Text fw="bold" mb="xs">
          {cap.pos}
        </Text>

        {/* Main shirt button */}
        <ActionIcon
          onClick={readonly || bench ? undefined : open}
          variant="transparent"
          color="gray"
          size={50}
        >
          <Indicator
            label={cap.kit_no}
            color="transparent"
            position="middle-center"
            zIndex={1}
          >
            <BaseIcon
              name="i-mdi:tshirt-crew"
              c={isTeamHome ? "cyan.6" : "teal.6"}
              fz={50}
            />
          </Indicator>
        </ActionIcon>

        {/* Top left - Subbed in */}
        {startMinute > 0 && (
          <Box pos="absolute" top="25%" right="65%" style={{ zIndex: 2 }}>
            <Indicator
              label={`${startMinute}'`}
              color="transparent"
              inline
              position="bottom-end"
              zIndex={1}
            >
              <SubInIcon fz={16} />
            </Indicator>
          </Box>
        )}

        {/* Top right - Subbed out or injured */}
        {subbedOut && (
          <Box pos="absolute" top="25%" right="30%" style={{ zIndex: 2 }}>
            <Indicator
              label={`${stopMinute}'`}
              color="transparent"
              inline
              position="bottom-end"
              zIndex={1}
            >
              {injured ? <MatchInjuryIcon fz={16} /> : <SubOutIcon fz={16} />}
            </Indicator>
          </Box>
        )}

        {/* Bottom right - Bookings */}
        <Box pos="absolute" bottom="33%" right="58%" style={{ zIndex: 2 }}>
          <Box pos="relative">
            {numYellowCards > 0 && (
              <Box pos="absolute" top={0} right={numRedCards > 0 ? 5 : 0}>
                <YellowCardIcon fz={16} />
              </Box>
            )}
            {numRedCards > 0 && (
              <Box
                pos="absolute"
                top={numYellowCards > 0 ? 2 : 0}
                right={0}
                style={{ zIndex: 100 }}
              >
                <RedCardIcon fz={16} />
              </Box>
            )}
          </Box>
        </Box>

        {/* Bottom right - Goals and assists */}
        <Box pos="absolute" bottom="35%" left="60%" style={{ zIndex: 2 }}>
          <Box pos="relative">
            {Array.from({ length: numGoals }).map((_, i) => (
              <Box
                key={i}
                pos="absolute"
                top={0}
                left={`${i * 8}px`}
                style={{ zIndex: 20 - i }}
              >
                <ActionIcon
                  color="blue"
                  radius="xl"
                  size="xs"
                  bd="1px solid black"
                >
                  <GoalIcon fz={16} c="white" />
                </ActionIcon>
              </Box>
            ))}
            {Array.from({ length: numOwnGoals }).map((_, i) => (
              <Box
                key={i}
                pos="absolute"
                top={0}
                left={`${(i + numGoals) * 8}px`}
                style={{ zIndex: 20 - i - numGoals }}
              >
                <ActionIcon
                  color="red.9"
                  radius="xl"
                  size="xs"
                  bd="1px solid black"
                >
                  <GoalIcon c="white" fz={16} />
                </ActionIcon>
              </Box>
            ))}
            {Array.from({ length: numAssists }).map((_, i) => (
              <Box
                key={i}
                pos="absolute"
                top={0}
                left={`${(i + numGoals + numOwnGoals) * 8}px`}
                style={{ zIndex: 20 - i - numGoals - numOwnGoals }}
              >
                <ActionIcon
                  color="blue.3"
                  radius="xl"
                  size="xs"
                  bd="1px solid black"
                >
                  <AssistIcon c="gray.8" fz={16} />
                </ActionIcon>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Player name */}
        <Text size="xs">{cap.players.name}</Text>
      </Box>

      <CapRating cap={cap} readonly={readonly} justify="center" gap={2} />
      <CapModal
        cap={cap}
        opened={opened}
        onClose={close}
        playerOptions={playerOptions}
      />
    </Stack>
  );
};

const SideItem: React.FC<{
  side: "home" | "away";
}> = ({ side }) => {
  const match = useAtomValue(matchAtom)!;

  return (
    <Box ta="center">
      <Text fw="bold">{side === "home" ? "HOME" : "AWAY"}</Text>
      <BaseIcon
        name="i-mdi:shield-sword"
        w="auto"
        c={side === "home" ? "cyan.6" : "teal.6"}
        fz={50}
      />
      <Text size="xs">
        {side === "home" ? match.home_team : match.away_team}
      </Text>
      <SideSummary match={match} side={side} justify="center" />
    </Box>
  );
};
