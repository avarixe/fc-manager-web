import {
  ActionIcon,
  Box,
  Indicator,
  isLightColor,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import React, { useMemo } from "react";

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
import { CapModal } from "@/components/match/CapModal";
import { CapRating } from "@/components/match/CapRating";
import { useCapStats } from "@/hooks/useCapStats";
import { Cap, Player } from "@/types";
import { ratingColor } from "@/utils/match";

type PlayerOption = Pick<
  Player,
  "id" | "name" | "status" | "pos" | "ovr" | "kit_no"
>;

export const MatchFormationItem: React.FC<{
  cap: Cap;
  readonly: boolean;
  playerOptions: PlayerOption[];
  bench?: boolean;
}> = ({ cap, readonly, playerOptions, bench }) => {
  const [opened, { open, close }] = useDisclosure();

  const capRatingColor = useMemo(() => {
    return ratingColor(cap.rating) ?? "default";
  }, [cap.rating]);

  const theme = useMantineTheme();
  const capRatingColorInfo = useMemo(() => {
    // Extract color name and shade from "orange.2" format
    const [colorName, shade] = capRatingColor.split(".");
    const shadeNumber = shade ? parseInt(shade) : 6;

    // Get the actual color from theme
    const actualColor =
      theme.colors[colorName as keyof typeof theme.colors]?.[shadeNumber] ||
      capRatingColor;

    return {
      color: actualColor,
      isLight: isLightColor(actualColor),
    };
  }, [capRatingColor, theme]);

  console.log(cap.players.name);
  console.log(cap.rating);
  console.log(capRatingColorInfo);

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
      <Box ta="center">
        {/* Position text */}
        <Text fw="bold" mb="xs">
          {cap.pos}
        </Text>

        <Box pos="relative" display="inline-block">
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
              <BaseIcon name="i-mdi:tshirt-crew" c={"gray.7"} fz={50} />
            </Indicator>
          </ActionIcon>

          {/* Top left - Subbed in */}
          {startMinute > 0 && (
            <Box pos="absolute" top={0} left={0} style={{ zIndex: 2 }}>
              <Indicator
                label={`${startMinute}'`}
                color="transparent"
                inline
                position="bottom-start"
                zIndex={1}
              >
                <SubInIcon fz={16} />
              </Indicator>
            </Box>
          )}

          {/* Top right - Subbed out or injured */}
          {subbedOut && (
            <Box pos="absolute" top={0} right={0} style={{ zIndex: 2 }}>
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

          {/* Bottom left - Bookings */}
          <Box
            pos="absolute"
            bottom={5}
            left={0}
            h={16}
            w={16}
            style={{ zIndex: 2 }}
          >
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

          {/* Bottom right - Goals and assists */}
          <Box
            pos="absolute"
            bottom={5}
            right={0}
            h={16}
            w={16}
            style={{ zIndex: 2 }}
          >
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
        <Text size="xs" ta="center" lineClamp={1}>
          {cap.players.name}
        </Text>
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
