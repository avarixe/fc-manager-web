import {
  AreaChart,
  ChartTooltipProps,
  getFilteredChartTooltipPayload,
} from "@mantine/charts";
import {
  Box,
  Button,
  ColorSwatch,
  Divider,
  Group,
  NumberFormatter,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { useAtomValue, useSetAtom } from "jotai";
import { round } from "lodash-es";
import { useCallback, useEffect, useMemo, useState } from "react";

import { appLoadingAtom, breadcrumbsAtom, teamAtom } from "@/atoms";
import { PlayerFlag } from "@/components/player/PlayerFlag";
import {
  PlayerKitNo,
  PlayerOvr,
  PlayerValue,
} from "@/components/player/PlayerInlineFields";
import { PlayerRatingHeatmap } from "@/components/player/PlayerRatingHeatmap";
import { PlayerStatus } from "@/components/player/PlayerStatus";
import { PlayerTimeline } from "@/components/player/PlayerTimeline";
import { useTeam } from "@/hooks/useTeam";
import { Player } from "@/types";
import { ratingColor } from "@/utils/match";
import { supabase } from "@/utils/supabase";

export const Route = createLazyFileRoute("/teams/$teamId/players/$id/")({
  component: PlayerPage,
});

function PlayerPage() {
  const { teamId, id } = Route.useParams();
  const { team } = useTeam(teamId);

  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState({
    numMatches: 0,
    numCleanSheets: 0,
    numGoals: 0,
    numAssists: 0,
    avgRating: 0,
  });

  useEffect(() => {
    const fetchPlayer = async () => {
      const { data, error } = await supabase
        .from("players")
        .select()
        .eq("team_id", Number(teamId))
        .eq("id", Number(id))
        .single();
      if (error) {
        console.error(error);
      } else {
        setPlayer(data);
      }
    };
    const fetchStats = async () => {
      const { data } = await supabase.rpc("get_player_stats", {
        player_ids: [Number(id)],
      });
      if (data) {
        let numMinutes = 0;
        const totalStats = {
          numMatches: 0,
          numCleanSheets: 0,
          numGoals: 0,
          numAssists: 0,
          avgRating: 0,
        };
        data.forEach((playerStats) => {
          totalStats.numMatches += playerStats.num_matches;
          totalStats.numCleanSheets += playerStats.num_clean_sheets;
          totalStats.numGoals += playerStats.num_goals;
          totalStats.numAssists += playerStats.num_assists;
          totalStats.avgRating +=
            playerStats.avg_rating * playerStats.num_minutes;
          numMinutes += playerStats.num_minutes;
        });
        totalStats.avgRating /= numMinutes || 1;
        setStats(totalStats);
      }
    };

    fetchPlayer();
    fetchStats();
  }, [id, teamId, team?.currently_on]);

  const setAppLoading = useSetAtom(appLoadingAtom);
  const navigate = useNavigate();
  const onClickDelete = useCallback(() => {
    modals.openConfirmModal({
      title: "Delete Player",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this player? This action cannot be
          undone.
        </Text>
      ),
      labels: {
        confirm: "Delete",
        cancel: "Cancel",
      },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          setAppLoading(true);
          await supabase.from("players").delete().eq("id", Number(id));
          navigate({ to: `/teams/${teamId}/players/` });
        } catch (error) {
          console.error(error);
        } finally {
          setAppLoading(false);
        }
      },
    });
  }, [id, navigate, setAppLoading, teamId]);

  const updatePlayer = useCallback(async (changes: Partial<Player>) => {
    setPlayer((prev) => (prev ? { ...prev, ...changes } : null));
  }, []);

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Players", to: `/teams/${teamId}/players` },
      { title: player?.name ?? "", to: `/teams/${teamId}/players/${id}` },
    ]);
  }, [id, player?.name, setBreadcrumbs, team?.name, teamId]);

  if (!team || !player) {
    return null;
  }

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        {player.name}
      </Title>

      <Group>
        <Button component={Link} to={`/teams/${teamId}/players/${id}/edit`}>
          Edit
        </Button>

        <Button
          onClick={onClickDelete}
          color="red"
          variant="outline"
          className="ml-auto"
        >
          Delete
        </Button>
      </Group>

      <Group grow>
        <Box ta="center">
          <Title>
            {dayjs(team.currently_on).year() - (player.birth_year ?? 0)}
          </Title>
          <Title order={6}>Age</Title>
        </Box>
        {player.nationality && (
          <Box ta="center">
            <Title>
              <PlayerFlag nationality={player.nationality} />
            </Title>
            <Title order={6}>Nationality</Title>
          </Box>
        )}
        <Box ta="center">
          <Title>
            <PlayerStatus status={player.status} w="auto" />
          </Title>
          <Title order={6}>Status</Title>
        </Box>
        <Box ta="center">
          <Title>{player.pos}</Title>
          <Title order={6}>Position</Title>
        </Box>
        {player.sec_pos?.length && (
          <Box ta="center">
            <Title>{player.sec_pos.join(", ")}</Title>
            <Title order={6}>Secondary Position(s)</Title>
          </Box>
        )}
      </Group>

      <Group grow>
        <Box ta="center">
          <Title>
            <PlayerKitNo
              player={player}
              setPlayer={(changes) => updatePlayer(changes)}
            />
          </Title>
          <Title order={6}>Kit No</Title>
        </Box>
        <Box ta="center">
          <Title>
            <PlayerOvr
              player={player}
              setPlayer={(changes) => updatePlayer(changes)}
            />
          </Title>
          <Title order={6}>Overall Rating</Title>
        </Box>
        <Box ta="center">
          <Title>
            <PlayerValue
              player={player}
              setPlayer={(changes) => updatePlayer(changes)}
            />
          </Title>
          <Title order={6}>Market Value</Title>
        </Box>
      </Group>

      <Box my="lg">
        <Title order={2}>
          <Group>
            <div className="i-mdi:run" />
            Performance
          </Group>
        </Title>
        <Divider my="xs" />

        <Group grow>
          <Box ta="center">
            <Title>{stats.numMatches}</Title>
            <Title order={6}>Matches</Title>
          </Box>
          <Box ta="center">
            <Title>{stats.numCleanSheets}</Title>
            <Title order={6}>Clean Sheets</Title>
          </Box>
          <Box ta="center">
            <Title>{stats.numGoals ?? 0}</Title>
            <Title order={6}>Goals</Title>
          </Box>
          <Box ta="center">
            <Title>{stats.numAssists ?? 0}</Title>
            <Title order={6}>Assists</Title>
          </Box>
          <Box ta="center">
            <Title
              c={stats.avgRating ? ratingColor(stats.avgRating) : undefined}
            >
              {stats.avgRating ? round(stats.avgRating, 2).toFixed(2) : "N/A"}
            </Title>
            <Title order={6}>Rating</Title>
          </Box>
        </Group>

        <PlayerRatingHeatmap player={player} team={team} />
      </Box>

      <Box my="lg">
        <Title order={2}>
          <Group>
            <div className="i-mdi:history" />
            Timeline
          </Group>
        </Title>
        <Divider my="xs" />

        <PlayerTimeline player={player} setPlayer={setPlayer} />
      </Box>

      <Box my="lg">
        <Title order={2}>
          <Group>
            <div className="i-mdi:chart-timeline-variant" />
            Development
          </Group>
        </Title>
        <Divider my="xs" />

        <PlayerHistoryChart player={player} />
      </Box>
    </Stack>
  );
}

const PlayerHistoryChart: React.FC<{ player: Player }> = ({ player }) => {
  const team = useAtomValue(teamAtom)!;
  const data = useMemo(() => {
    const history = Object.entries(player.history).map(([date, data]) => ({
      date: dayjs(date).valueOf(),
      ...data,
    }));

    const lastContractDate =
      player.contracts[player.contracts.length - 1]?.ended_on;
    const lastDate =
      player.status || !lastContractDate ? team.currently_on : lastContractDate;

    if (dayjs(lastDate).valueOf() !== history[history.length - 1].date) {
      history.push({
        date: dayjs(lastDate).valueOf(),
        ovr: history[history.length - 1].ovr,
        value: history[history.length - 1].value,
      });
    }

    return history.slice(0, 28);
  }, [player.contracts, player.history, player.status, team.currently_on]);

  return (
    <AreaChart
      h={300}
      data={data}
      dataKey="date"
      withRightYAxis
      yAxisLabel="Overall Rating"
      rightYAxisLabel="Market Value"
      valueFormatter={(value) => new Intl.NumberFormat("en-US").format(value)}
      series={[
        { name: "ovr", color: "pink.6" },
        { name: "value", color: "cyan.6", yAxisId: "right" },
      ]}
      xAxisProps={{
        scale: "time",
        domain: [data[0].date, dayjs(team.currently_on).valueOf()],
        tickFormatter: (date) => dayjs(date).format("MMM YYYY"),
      }}
      yAxisProps={{
        domain: [40, 100],
      }}
      rightYAxisProps={{
        tickFormatter: (value) => shortHandValue(value, team.currency),
      }}
      tooltipProps={{
        content: ({ label, payload }) => (
          <PlayerHistoryChartTooltip
            label={label}
            payload={payload}
            currency={team.currency}
          />
        ),
      }}
    />
  );
};

const PlayerHistoryChartTooltip: React.FC<
  ChartTooltipProps & { label: string; currency: string }
> = ({ label, payload, currency }) => {
  if (!payload) return null;

  return (
    <Paper px="md" py="sm" withBorder shadow="md" radius="md">
      <Box fw={500} mb={5}>
        {dayjs(label).format("MMM DD, YYYY")}
        {getFilteredChartTooltipPayload(payload).map((item) => (
          <Group key={item.name}>
            <ColorSwatch color={item.color} size={10} />
            <Text size="sm">
              {item.name === "ovr" ? "Overall Rating" : "Market Value"}
            </Text>
            <Text size="sm" ml="auto">
              {item.name === "ovr" ? (
                item.value
              ) : (
                <NumberFormatter
                  value={item.value}
                  prefix={currency}
                  thousandSeparator
                />
              )}
            </Text>
          </Group>
        ))}
      </Box>
    </Paper>
  );
};

function shortHandValue(value: number, currency: string) {
  if (value < 1_000) {
    return `${currency}${value}`;
  } else if (value < 1_000_000) {
    return `${currency}${(value / 1_000).toFixed(0)}K`;
  } else {
    return `${currency}${(value / 1_000_000).toFixed(0)}M`;
  }
}
