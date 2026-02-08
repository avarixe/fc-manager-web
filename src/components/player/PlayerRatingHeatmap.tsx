import { Heatmap } from "@mantine/charts";
import { Box, Group, Rating, Text } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";

import { BaseIcon } from "@/components/base/CommonIcons";
import { Match, Player } from "@/types";
import { formatDate } from "@/utils/format";
import { matchScore } from "@/utils/match";
import { supabase } from "@/utils/supabase";

interface PlayerRatingHeatmapProps {
  player: Player;
  team: {
    id: number;
    name: string;
    currently_on: string;
  };
}

type MatchData = Pick<
  Match,
  | "id"
  | "home_team"
  | "away_team"
  | "competition"
  | "stage"
  | "played_on"
  | "home_score"
  | "away_score"
  | "home_penalty_score"
  | "away_penalty_score"
>;

export const PlayerRatingHeatmap: React.FC<PlayerRatingHeatmapProps> = ({
  player,
  team,
}) => {
  const [chartData, setChartData] = useState<Record<string, number>>({});
  const [matchData, setMatchData] = useState<Record<string, MatchData>>({});

  // Determine date range based on contracts
  const dateRange = useMemo(() => {
    if (player.contracts.length === 0) return null;

    const firstContract = player.contracts[0];
    const lastContract = player.contracts[player.contracts.length - 1];

    const startDate = firstContract.started_on;
    const endDate =
      team.currently_on > lastContract.ended_on
        ? lastContract.ended_on
        : team.currently_on;

    return { startDate, endDate };
  }, [player.contracts, team.currently_on]);

  useEffect(() => {
    if (!dateRange) return;

    const fetchCaps = async () => {
      const { data, error } = await supabase
        .from("caps")
        .select(
          `
          rating,
          matches(
            id,
            home_team,
            away_team,
            home_score,
            away_score,
            played_on,
            competition,
            season,
            stage,
            home_penalty_score,
            away_penalty_score
          )
        `,
        )
        .eq("player_id", player.id)
        .not("rating", "is", null);

      if (error) {
        console.error("Error fetching caps:", error);
      } else if (data) {
        const newChartData: Record<string, number> = {};
        const newMatchData: Record<string, MatchData> = {};

        data.forEach((cap) => {
          if (cap.rating) {
            let rating: number;
            if (cap.rating >= 85) {
              rating = 5;
            } else if (cap.rating >= 75) {
              rating = 4;
            } else if (cap.rating >= 65) {
              rating = 3;
            } else if (cap.rating >= 55) {
              rating = 2;
            } else {
              rating = 1;
            }
            newChartData[cap.matches.played_on] = rating;
            newMatchData[cap.matches.played_on] = cap.matches;
          }
        });
        setChartData(newChartData);
        setMatchData(newMatchData);
      }
    };

    fetchCaps();
  }, [player.id, dateRange]);

  if (!dateRange || Object.keys(chartData).length === 0) {
    return (
      <Box>
        <Text size="sm" c="dimmed">
          No cap ratings available for the date range
        </Text>
      </Box>
    );
  }

  return (
    <Box ta="center" p="sm" style={{ overflowX: "auto" }}>
      <Heatmap
        data={chartData}
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        withTooltip
        withMonthLabels
        splitMonths
        firstDayOfWeek={0}
        gap={4}
        domain={[1, 5]}
        colors={["red", "orange", "yellow", "lime", "green"]}
        getRectProps={({ date, value }) => ({
          onClick: () => {
            console.log(date, value);
            const match = matchData[date];
            if (match) {
              window.open(`/teams/${team.id}/matches/${match.id}`, "_blank");
            }
          },
        })}
        tooltipProps={{
          color: "gray",
        }}
        getTooltipLabel={({ date, value }) => {
          const match = matchData[date];
          return value && match ? (
            <Box ta="center">
              <Box fz={10}>
                {match.competition}
                {match.stage && ` · ${match.stage}`}
              </Box>
              <Box fz="xs">
                {match.home_team} v {match.away_team}
              </Box>
              <Box fz="xs">{matchScore(match)}</Box>
              <Box fz="sm">{formatDate(date)}</Box>
              <Group gap="xs" justify="center">
                <Text size="sm" fw={500}>
                  Rating:
                </Text>
                <Rating
                  value={value}
                  readOnly
                  emptySymbol={<BaseIcon name="i-mdi:star" c="gray.7" />}
                  fullSymbol={<BaseIcon name="i-mdi:star" c="gray.1" />}
                />
              </Group>
            </Box>
          ) : null;
        }}
        styles={{
          root: {
            display: "inline-block",
          },
        }}
      />
    </Box>
  );
};
