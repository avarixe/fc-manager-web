import {
  Button,
  Group,
  NumberFormatter,
  Stack,
  Title,
  Tooltip,
} from "@mantine/core";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";

import { breadcrumbsAtom } from "@/atoms";
import { BaseIcon } from "@/components/base/CommonIcons";
import { DataTable } from "@/components/base/DataTable";
import { PlayerFlag } from "@/components/player/PlayerFlag";
import {
  PlayerKitNo,
  PlayerOvr,
  PlayerValue,
} from "@/components/player/PlayerInlineFields";
import { PlayerStatus } from "@/components/player/PlayerStatus";
import { PositionFilterPopover } from "@/components/player/PositionFilterPopover";
import { PlayerStatusFilter } from "@/constants";
import { useTeam } from "@/hooks/useTeam";
import { Player } from "@/types";
import { assertType } from "@/utils/assert";
import { formatDate } from "@/utils/format";
import { supabase } from "@/utils/supabase";

export const Route = createLazyFileRoute("/teams/$teamId/players/")({
  component: PlayersPage,
});

function PlayersPage() {
  const { teamId } = Route.useParams();
  const { team } = useTeam(teamId);

  const [players, setPlayers] = useState<Player[]>([]);

  const [tableState, setTableState] = useState({
    pageIndex: 0,
    pageSize: 10,
    rowCount: 0,
    sorting: {
      id: "pos",
      desc: false,
    },
  });
  const [statusFilter, setStatusFilter] = useState(PlayerStatusFilter.Active);
  const [positionFilter, setPositionFilter] = useState<Set<string>>(new Set());
  useEffect(() => {
    const fetchPage = async () => {
      const pageQuery = supabase
        .from("players")
        .select(
          "id, name, nationality, status, birth_year, pos, sec_pos, kit_no, ovr, value, wage, contract_ends_on, history",
        )
        .range(
          tableState.pageSize * tableState.pageIndex,
          tableState.pageSize * (tableState.pageIndex + 1) - 1,
        )
        .eq("team_id", Number(teamId));
      const countQuery = supabase
        .from("players")
        .select("id", { count: "exact", head: true })
        .eq("team_id", Number(teamId));

      switch (statusFilter) {
        case PlayerStatusFilter.Youth:
          pageQuery.eq("youth", true);
          countQuery.eq("youth", true);
          break;
        case PlayerStatusFilter.Active:
          pageQuery.neq("status", null);
          pageQuery.neq("status", PlayerStatusFilter.Pending);
          countQuery.neq("status", null);
          countQuery.neq("status", PlayerStatusFilter.Pending);
          break;
        case PlayerStatusFilter.Injured:
        case PlayerStatusFilter.Loaned:
        case PlayerStatusFilter.Pending:
          pageQuery.eq("status", statusFilter);
          countQuery.eq("status", statusFilter);
          break;
      }

      // Apply position filter
      if (positionFilter.size > 0) {
        const positionArray = Array.from(positionFilter);
        pageQuery.in("pos", positionArray);
        countQuery.in("pos", positionArray);
      }

      switch (tableState.sorting?.id) {
        case "pos":
          pageQuery.order("pos_order", { ascending: !tableState.sorting.desc });
          break;
        case "birthYear":
          pageQuery.order("birth_year", { ascending: tableState.sorting.desc });
          break;
        default:
          pageQuery.order(tableState.sorting.id, {
            ascending: !tableState.sorting.desc,
          });
      }
      pageQuery.order("id", { ascending: !tableState.sorting.desc });

      const { count } = await countQuery;
      const { data, error } = await pageQuery;
      if (error) {
        console.error(error);
      } else {
        assertType<Player[]>(data);
        setPlayers(data);
        setTableState((prev) => ({
          ...prev,
          rowCount: count ?? 0,
        }));
      }
    };

    fetchPage();
  }, [
    statusFilter,
    positionFilter,
    tableState.pageIndex,
    tableState.pageSize,
    tableState.sorting.desc,
    tableState.sorting.id,
    teamId,
    // Reload on date change to get updated statuses
    team?.currently_on,
  ]);

  const onChangeStatusFilter = useCallback((status: PlayerStatusFilter) => {
    setStatusFilter(status);
    setTableState((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const onChangePositionFilter = useCallback((newPositions: Set<string>) => {
    setPositionFilter(newPositions);
    setTableState((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const updatePlayer = useCallback(
    (index: number, changes: Partial<Player>) => {
      const newPlayers = [...players];
      newPlayers[index] = { ...newPlayers[index], ...changes };
      setPlayers(newPlayers);
    },
    [players],
  );

  const columnHelper = createColumnHelper<Player>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
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
          const value = info.getValue();
          return value ? <PlayerFlag nationality={value} /> : null;
        },
        meta: { align: "center", sortable: true },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const value = info.getValue();
          return <PlayerStatus status={value} w="auto" />;
        },
        meta: { align: "center" },
      }),
      columnHelper.accessor("birth_year", {
        header: "Age",
        cell: (info) => {
          const value = info.getValue();
          return value && team ? dayjs(team.currently_on).year() - value : null;
        },
        meta: { align: "center", sortable: true },
      }),
      columnHelper.accessor("pos", {
        header: "Pos",
        meta: { align: "center", sortable: true },
      }),
      columnHelper.accessor("sec_pos", {
        header: "2nd Pos",
        cell: (info) => info.getValue()?.join(", "),
        meta: { align: "center" },
      }),
      columnHelper.accessor("kit_no", {
        header: "Kit No",
        cell: (info) => (
          <PlayerKitNo
            player={info.row.original}
            setPlayer={(changes) => updatePlayer(info.row.index, changes)}
          />
        ),
        meta: { align: "center", sortable: true },
      }),
      columnHelper.accessor("ovr", {
        header: "OVR",
        cell: (info) => (
          <PlayerOvr
            player={info.row.original}
            setPlayer={(changes) => updatePlayer(info.row.index, changes)}
          />
        ),
        meta: { align: "center", sortable: true },
      }),
      columnHelper.accessor("value", {
        header: "Value",
        cell: (info) => (
          <PlayerValue
            player={info.row.original}
            setPlayer={(changes) => updatePlayer(info.row.index, changes)}
          />
        ),
        meta: { align: "end", sortable: true },
      }),
      columnHelper.accessor("wage", {
        header: "Wage",
        cell: (info) => {
          const value = info.getValue();
          return value ? (
            <NumberFormatter
              value={value}
              prefix={team?.currency}
              thousandSeparator
            />
          ) : null;
        },
        meta: { align: "end", sortable: true },
      }),
      columnHelper.accessor("contract_ends_on", {
        header: "Contract Ends",
        cell: (info) => formatDate(info.getValue()),
        meta: { align: "end", sortable: true },
      }),
    ],
    [columnHelper, team, teamId, updatePlayer],
  );

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Players", to: `/teams/${teamId}/players` },
    ]);
  }, [setBreadcrumbs, team?.name, teamId]);

  if (!team) {
    return null;
  }

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        Players
      </Title>

      <Group>
        <Button component={Link} to={`/teams/${teamId}/players/new`}>
          New Player
        </Button>
      </Group>

      <Group>
        <StatusFilterToggle
          statusFilter={statusFilter}
          onChangeStatusFilter={onChangeStatusFilter}
        />

        <PositionFilterPopover
          positionFilter={positionFilter}
          onChangePositionFilter={onChangePositionFilter}
        />
      </Group>

      <DataTable
        data={players}
        columns={columns}
        tableState={tableState}
        setTableState={setTableState}
      />
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
  { value: PlayerStatusFilter.Injured, icon: "i-mdi:ambulance", color: "pink" },
  {
    value: PlayerStatusFilter.Loaned,
    icon: "i-mdi:transit-transfer",
    color: "orange",
  },
  {
    value: PlayerStatusFilter.Pending,
    icon: "i-mdi:lock-clock",
    color: "yellow",
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
            size="compact-lg"
            onClick={() => onChangeStatusFilter(filter.value)}
          >
            <div className={filter.icon} />
          </Button>
        </Tooltip>
      ))}
    </Button.Group>
  );
};
