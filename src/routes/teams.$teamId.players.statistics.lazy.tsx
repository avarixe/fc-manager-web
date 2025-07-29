import {
  Button,
  Checkbox,
  Group,
  Select,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { useSetAtom } from "jotai";
import { groupBy, round } from "lodash-es";
import { useEffect, useMemo, useState } from "react";

import { breadcrumbsAtom } from "@/atoms";
import { BaseIcon } from "@/components/base/CommonIcons";
import { LocalDataTable } from "@/components/base/LocalDataTable";
import { PlayerFlag } from "@/components/player/PlayerFlag";
import { PositionFilterPopover } from "@/components/player/PositionFilterPopover";
import { PlayerStatusFilter } from "@/constants";
import { useTeam } from "@/hooks/useTeam";
import { Player } from "@/types";
import { assertType } from "@/utils/assert";
import { ratingColor } from "@/utils/match";
import { supabase } from "@/utils/supabase";

type PlayerData = Pick<
  Player,
  "id" | "name" | "nationality" | "status" | "pos" | "pos_order" | "youth"
>;

interface PlayerStats {
  player_id: string;
  competition: string;
  season: number;
  num_matches: number;
  num_minutes: number;
  num_clean_sheets: number;
  num_goals: number;
  num_assists: number;
  avg_rating: number;
}

interface PlayerRow extends Omit<PlayerStats, "player_id">, PlayerData {
  key: string;
  xg: number;
  xa: number;
  xg_and_xa: number;
}

export const Route = createLazyFileRoute("/teams/$teamId/players/statistics")({
  component: PlayerStatisticsPage,
});

function PlayerStatisticsPage() {
  const { teamId } = Route.useParams();
  const { team, currentSeason, seasonLabel } = useTeam(teamId);

  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [stats, setStats] = useState<PlayerStats[]>([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from("players")
        .select("id, name, nationality, status, pos, pos_order, youth")
        .eq("team_id", Number(teamId))
        .order("pos_order");
      assertType<PlayerData[]>(data);
      setPlayers(data);

      const playerIds = data.map((player) => player.id);
      const { data: statsData } = await supabase.rpc("get_player_stats", {
        player_ids: playerIds,
      });
      assertType<PlayerStats[]>(statsData);
      setStats(statsData);
    };

    fetchPlayers();
  }, [teamId]);
  const statsByPlayerId = useMemo(() => groupBy(stats, "player_id"), [stats]);

  const [season, setSeason] = useState<string | null>(null);
  const seasons = useMemo(
    () => Array.from(Array(currentSeason + 1).keys()),
    [currentSeason],
  );
  const seasonOptions = useMemo(
    () =>
      seasons.map((season) => ({
        value: String(season),
        label: seasonLabel(season),
      })),
    [seasonLabel, seasons],
  );

  const [competition, setCompetition] = useState<string | null>(null);
  const [competitions, setCompetitions] = useState<string[]>([]);
  useEffect(() => {
    const fetchCompetitions = async () => {
      const { data } = await supabase
        .from("competitions")
        .select("name")
        .eq("team_id", Number(teamId))
        .order("name");
      if (data) {
        setCompetitions([
          ...new Set(data.map((competition) => competition.name)),
        ]);
      }
    };
    fetchCompetitions();
  }, [teamId]);

  const [statusFilter, setStatusFilter] = useState(PlayerStatusFilter.Active);
  const [positionFilter, setPositionFilter] = useState<Set<string>>(new Set());
  const [splitBySeason, setSplitBySeason] = useState(false);
  const [splitByCompetition, setSplitByCompetition] = useState(false);
  const items = useMemo(() => {
    const filteredPlayers = players.filter((player) => {
      if (positionFilter.size > 0 && !positionFilter.has(player.pos)) {
        return false;
      }

      switch (statusFilter) {
        case PlayerStatusFilter.Youth:
          return player.youth;
        case PlayerStatusFilter.Active:
          return (
            player.status !== null &&
            player.status !== PlayerStatusFilter.Pending
          );
        default:
          return true;
      }
    });

    const rows: PlayerRow[] = [];
    filteredPlayers.forEach((player) => {
      const filteredStats =
        statsByPlayerId[player.id]?.filter(
          (data) =>
            [null, data.season].includes(season ? Number(season) : null) &&
            [null, data.competition].includes(competition),
        ) ?? [];

      const splitStats = groupBy(filteredStats, (stats) =>
        [
          stats.player_id,
          splitBySeason ? stats.season : null,
          splitByCompetition ? stats.competition : null,
        ].join("_"),
      );

      for (const key in splitStats) {
        const row: PlayerRow = {
          key,
          ...player,
          season: splitStats[key][0].season,
          competition: splitStats[key][0].competition,
          num_matches: 0,
          num_minutes: 0,
          num_clean_sheets: 0,
          num_goals: 0,
          num_assists: 0,
          avg_rating: 0,
          xg: 0,
          xa: 0,
          xg_and_xa: 0,
        };
        splitStats[key].forEach((playerStats) => {
          row.num_matches += playerStats.num_matches;
          row.num_clean_sheets += playerStats.num_clean_sheets;
          row.num_goals += playerStats.num_goals;
          row.num_assists += playerStats.num_assists;
          row.avg_rating += playerStats.avg_rating * playerStats.num_minutes;
          row.num_minutes += playerStats.num_minutes;
        });
        if (row.num_minutes > 0) {
          row.avg_rating /= row.num_minutes;
          row.xg = row.num_goals / row.num_matches;
          row.xa = row.num_assists / row.num_matches;
          row.xg_and_xa = row.xg + row.xa;
        }

        rows.push(row);
      }
    });
    return rows;
  }, [
    competition,
    players,
    season,
    splitByCompetition,
    splitBySeason,
    statsByPlayerId,
    statusFilter,
    positionFilter,
  ]);

  const columnHelper = createColumnHelper<PlayerRow>();
  const columns = useMemo(() => {
    const accessors = [
      columnHelper.accessor("name", {
        header: "Player",
        cell: (info) => {
          const value = info.getValue();
          return (
            <Button
              component={Link}
              to={`/teams/${teamId}/players/${info.row.original.id}`}
              variant="subtle"
              size="compact-xs"
            >
              {value}
            </Button>
          );
        },
        meta: { sortable: true },
      }),
      columnHelper.accessor("nationality", {
        header: () => <BaseIcon name="i-mdi:flag" />,
        cell: (info) => {
          const value = info.row.original.nationality;
          return value ? <PlayerFlag nationality={value} /> : null;
        },
        meta: { align: "center", sortable: true },
      }),
      columnHelper.accessor("pos", {
        header: "Pos",
        sortingFn: (a, b) => {
          return (a.original.pos_order ?? 0) - (b.original.pos_order ?? 0);
        },
        meta: { align: "center", sortable: true },
      }),
      columnHelper.accessor("season", {
        header: "Season",
        cell: (info) => {
          const value = info.getValue();
          return seasonLabel(value);
        },
        meta: { align: "center", sortable: true },
      }),
      columnHelper.accessor("competition", {
        header: "Competition",
        meta: { align: "center", sortable: true },
      }),
      columnHelper.accessor("num_matches", {
        header: "GP",
        meta: { align: "end", sortable: true },
      }),
      columnHelper.accessor("num_minutes", {
        header: "Minutes",
        meta: { align: "end", sortable: true },
      }),
      columnHelper.accessor("num_goals", {
        header: "G",
        meta: { align: "end", sortable: true },
      }),
      columnHelper.accessor("num_assists", {
        header: "A",
        meta: { align: "end", sortable: true },
      }),
      columnHelper.accessor("num_clean_sheets", {
        header: "CS",
        meta: { align: "end", sortable: true },
      }),
      columnHelper.accessor("avg_rating", {
        header: "Rating",
        cell: (info) => {
          const value = info.getValue();
          return (
            <Text c={ratingColor(value)}>{round(value, 2).toFixed(2)}</Text>
          );
        },
        meta: { align: "center", sortable: true },
      }),
      columnHelper.accessor("xg_and_xa", {
        header: "xG + xA",
        cell: (info) => {
          const value = info.getValue();
          return round(value, 2).toFixed(2);
        },
        meta: { align: "center", sortable: true },
      }),
      columnHelper.accessor("xg", {
        header: "xG",
        cell: (info) => {
          const value = info.getValue();
          return round(value, 2).toFixed(2);
        },
        meta: { align: "center", sortable: true },
      }),
      columnHelper.accessor("xa", {
        header: "xA",
        cell: (info) => {
          const value = info.getValue();
          return round(value, 2).toFixed(2);
        },
        meta: { align: "center", sortable: true },
      }),
    ];
    if (!splitByCompetition) {
      accessors.splice(4, 1);
    }
    if (!splitBySeason) {
      accessors.splice(3, 1);
    }

    return accessors;
  }, [columnHelper, seasonLabel, splitByCompetition, splitBySeason, teamId]);

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Players", to: `/teams/${teamId}/players` },
      {
        title: "Player Statistics",
        to: `/teams/${teamId}/players/statistics`,
      },
    ]);
  }, [setBreadcrumbs, team?.name, teamId]);

  if (!team) {
    return null;
  }

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        Player Statistics
      </Title>

      <Group align="start">
        <StatusFilterToggle
          statusFilter={statusFilter}
          onChangeStatusFilter={setStatusFilter}
        />
        <PositionFilterPopover
          positionFilter={positionFilter}
          onChangePositionFilter={setPositionFilter}
        />
        <Stack gap="xs">
          <Select
            value={season}
            onChange={setSeason}
            data={seasonOptions}
            placeholder="Season"
            clearable
          />
          <Checkbox
            checked={splitBySeason}
            onChange={(event) => setSplitBySeason(event.currentTarget.checked)}
            label="Split by Season"
          />
        </Stack>
        <Stack gap="xs">
          <Select
            value={competition}
            onChange={setCompetition}
            data={competitions}
            placeholder="Competition"
            searchable
            clearable
          />
          <Checkbox
            checked={splitByCompetition}
            onChange={(event) =>
              setSplitByCompetition(event.currentTarget.checked)
            }
            label="Split by Competition"
          />
        </Stack>
      </Group>

      <LocalDataTable data={items} columns={columns} sortBy="pos" />
    </Stack>
  );
}

const statusFilters = [
  { value: PlayerStatusFilter.All, icon: "i-mdi:earth", color: "blue" },
  { value: PlayerStatusFilter.Youth, icon: "i-mdi:school", color: "cyan" },
  {
    value: PlayerStatusFilter.Active,
    icon: "i-mdi:account-check",
    color: "green",
  },
];

const StatusFilterToggle: React.FC<{
  statusFilter: PlayerStatusFilter;
  onChangeStatusFilter: (status: PlayerStatusFilter) => void;
}> = ({ statusFilter, onChangeStatusFilter }) => {
  return (
    <Button.Group>
      {statusFilters.map((filter) => (
        <Tooltip label={filter.value} key={filter.value}>
          <Button
            component={"div"}
            color={statusFilter === filter.value ? filter.color : undefined}
            variant={statusFilter === filter.value ? "filled" : "default"}
            onClick={() => onChangeStatusFilter(filter.value)}
          >
            <div className={filter.icon} />
          </Button>
        </Tooltip>
      ))}
    </Button.Group>
  );
};
