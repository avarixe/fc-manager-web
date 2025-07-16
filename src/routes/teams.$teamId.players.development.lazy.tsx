import {
  Button,
  Group,
  SegmentedControl,
  Stack,
  Title,
  Tooltip,
} from "@mantine/core";

type PlayerData = Pick<
  Player,
  | "id"
  | "name"
  | "nationality"
  | "status"
  | "pos"
  | "pos_order"
  | "ovr"
  | "value"
  | "history"
  | "contracts"
  | "youth"
>;

interface PlayerRow extends PlayerData {
  numSeasons: number;
  seasons: (PlayerHistoryData | null)[];
  start: PlayerHistoryData;
  last: PlayerHistoryData;
  total: PlayerHistoryData;
}

export const Route = createLazyFileRoute("/teams/$teamId/players/development")({
  component: PlayerDevelopmentPage,
});

function PlayerDevelopmentPage() {
  const { teamId } = Route.useParams();
  const { team, currentSeason, seasonLabel, startOfSeason, endOfSeason } =
    useTeam(teamId);

  const [players, setPlayers] = useState<PlayerData[]>([]);
  const supabase = useAtomValue(supabaseAtom);
  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from("players")
        .select(
          "id, name, nationality, status, pos, pos_order, ovr, value, history, contracts, youth",
        )
        .eq("team_id", Number(teamId))
        .order("pos_order");
      assertType<PlayerData[]>(data);
      setPlayers(data);
    };

    fetchPlayers();
  }, [supabase, teamId]);

  const seasons = useMemo(
    () => Array.from(Array(currentSeason + 1).keys()),
    [currentSeason],
  );
  const [statusFilter, setStatusFilter] = useState(PlayerStatusFilter.Active);
  const [positionFilter, setPositionFilter] = useState<Set<string>>(new Set());
  const items = useMemo(() => {
    return players
      .filter((player) => {
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
      })
      .map((player) => {
        const seasonData: PlayerRow["seasons"] = [];

        const sortedKeys = Object.keys(player.history).sort();
        const start = player.history[sortedKeys[0]];
        const last = player.history[sortedKeys[sortedKeys.length - 1]];

        let numSeasons = 0;
        for (const season of seasons) {
          const seasonStart = startOfSeason(season);
          const seasonEnd = endOfSeason(season);

          if (
            player.contracts.some(
              (contract) =>
                contract.started_on < seasonEnd &&
                seasonStart < contract.ended_on,
            )
          ) {
            numSeasons++;
            const seasonEndData = playerRecordAt(player, seasonEnd) ?? last;
            seasonData.push(seasonEndData);
          } else {
            seasonData.push(null);
          }
        }

        return {
          ...player,
          seasons: seasonData,
          numSeasons,
          start,
          last,
          total: {
            ovr: last.ovr - start.ovr,
            value: last.value - start.value,
          },
        };
      });
  }, [
    endOfSeason,
    players,
    seasons,
    startOfSeason,
    statusFilter,
    positionFilter,
  ]);

  const [dataType, setDataType] = useState("ovr");

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
      columnHelper.accessor("total.ovr", {
        header: "Change",
        cell: (info) => {
          const value = info.getValue();
          return (
            <MText
              c={statDiffColor(
                "ovr",
                value / (info.row.original.numSeasons || 1),
              )}
            >
              {value > 0 ? "+" : null}
              {value}
            </MText>
          );
        },
        meta: { align: "end", sortable: true },
      }),
      columnHelper.accessor("start.ovr", {
        header: "Start",
        cell: (info) => {
          const value = info.getValue();
          return <MText c={ovrColor(value)}>{value}</MText>;
        },
        meta: { align: "end", sortable: true },
      }),
      ...seasons.map((season) =>
        columnHelper.accessor(() => `seasons.${season}.ovr`, {
          header: seasonLabel(season, true),
          sortingFn: (a, b) => {
            return (
              (a.original.seasons[season]?.ovr || 0) -
              (b.original.seasons[season]?.ovr || 0)
            );
          },
          cell: (info) => {
            const value = info.row.original.seasons[season]?.ovr;
            return (
              <MText c={value ? ovrColor(value) : undefined}>{value}</MText>
            );
          },
          meta: { sortable: true, align: "end" },
        }),
      ),
      columnHelper.accessor("total.value", {
        header: "Change",
        cell: (info) => {
          const value = info.getValue();
          return (
            <MText
              c={statDiffColor("value", value / info.row.original.start.value)}
            >
              {value > 0 ? "+" : null}
              {abbrevValue(value, team?.currency)}
            </MText>
          );
        },
        meta: { align: "end", sortable: true },
      }),
      columnHelper.accessor("start.value", {
        header: "Start",
        cell: (info) => {
          const value = info.getValue();
          return (
            <MText c={playerValueColor(value)}>
              {abbrevValue(value, team?.currency)}
            </MText>
          );
        },
        meta: { align: "end", sortable: true },
      }),
      ...seasons.map((season) =>
        columnHelper.accessor(() => `seasons.${season}.value`, {
          header: seasonLabel(season, true),
          sortingFn: (a, b) => {
            return (
              (a.original.seasons[season]?.value || 0) -
              (b.original.seasons[season]?.value || 0)
            );
          },
          cell: (info) => {
            const value = info.row.original.seasons[season]?.value;
            return (
              <MText c={value ? playerValueColor(value) : undefined}>
                {abbrevValue(value, team?.currency)}
              </MText>
            );
          },
          meta: { sortable: true, align: "end" },
        }),
      ),
    ];

    if (dataType === "value") {
      accessors.splice(3, 2 + seasons.length);
    } else {
      accessors.splice(5 + seasons.length, 2 + seasons.length);
    }

    return accessors;
  }, [columnHelper, dataType, seasonLabel, seasons, team?.currency, teamId]);

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Players", to: `/teams/${teamId}/players` },
      {
        title: "Player Development",
        to: `/teams/${teamId}/players/development`,
      },
    ]);
  }, [setBreadcrumbs, team?.name, teamId]);

  if (!team) {
    return null;
  }

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        Player Development
      </Title>

      <Group>
        <StatusFilterToggle
          statusFilter={statusFilter}
          onChangeStatusFilter={setStatusFilter}
        />

        <PositionFilterPopover
          positionFilter={positionFilter}
          onChangePositionFilter={setPositionFilter}
        />

        <SegmentedControl
          value={dataType}
          onChange={setDataType}
          data={[
            {
              value: "ovr",
              label: <BaseIcon name="i-mdi:trending-up" fz="xl" c="teal" />,
            },
            {
              value: "value",
              label: <BaseIcon name="i-mdi:cash-multiple" fz="xl" c="cyan" />,
            },
          ]}
          ml="auto"
        />
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

const diffRanges = {
  ovr: [-2, 0, 2, 4, 6],
  value: [-25, 0, 25, 50, 100],
};

function statDiffColor(type: "ovr" | "value", diff: number | undefined) {
  if (!diff) {
    return undefined;
  } else if (diff > diffRanges[type][4]) {
    return "green.8";
  } else if (diff > diffRanges[type][3]) {
    return "green.6";
  } else if (diff > diffRanges[type][2]) {
    return "green.4";
  } else if (diff > diffRanges[type][1]) {
    return "green.2";
  } else if (diff > diffRanges[type][0]) {
    return "red.2";
  } else {
    return "red.4";
  }
}
