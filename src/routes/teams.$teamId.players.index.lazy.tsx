import { Player } from "@/types";
import {
  Button,
  Group,
  NumberFormatter,
  Stack,
  Title,
  Tooltip,
} from "@mantine/core";

enum StatusFilter {
  All = "All",
  Youth = "Youth",
  Active = "Active",
  Injured = "Injured",
  Loaned = "Loaned",
  Pending = "Pending",
}

const statusFilters = [
  { value: StatusFilter.All, icon: "i-mdi:earth", color: "blue" },
  { value: StatusFilter.Youth, icon: "i-mdi:school", color: "cyan" },
  { value: StatusFilter.Active, icon: "i-mdi:account-check", color: "green" },
  { value: StatusFilter.Injured, icon: "i-mdi:ambulance", color: "pink" },
  {
    value: StatusFilter.Loaned,
    icon: "i-mdi:transit-transfer",
    color: "orange",
  },
  { value: StatusFilter.Pending, icon: "i-mdi:lock-clock", color: "yellow" },
];

export const Route = createLazyFileRoute("/teams/$teamId/players/")({
  component: PlayersPage,
});

function PlayersPage() {
  const { teamId } = Route.useParams();
  const { team } = useTeam(teamId);

  const [players, setPlayers] = useState<Player[]>([]);
  const supabase = useAtomValue(supabaseAtom);
  const [tableState, setTableState] = useState({
    pageIndex: 0,
    pageSize: 10,
    rowCount: 0,
    sorting: {
      id: "pos",
      desc: false,
    },
  });
  const [statusFilter, setStatusFilter] = useState(StatusFilter.Active);
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
        .eq("team_id", teamId);
      const countQuery = supabase
        .from("players")
        .select("id", { count: "exact", head: true })
        .eq("team_id", teamId);

      switch (statusFilter) {
        case StatusFilter.Youth:
          pageQuery.eq("youth", true);
          countQuery.eq("youth", true);
          break;
        case StatusFilter.Active:
          pageQuery.neq("status", null);
          pageQuery.neq("status", StatusFilter.Pending);
          countQuery.neq("status", null);
          countQuery.neq("status", StatusFilter.Pending);
          break;
        case StatusFilter.Injured:
        case StatusFilter.Loaned:
        case StatusFilter.Pending:
          pageQuery.eq("status", statusFilter);
          countQuery.eq("status", statusFilter);
          break;
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
    supabase,
    tableState.pageIndex,
    tableState.pageSize,
    tableState.sorting.desc,
    tableState.sorting.id,
    teamId,
    // Reload on date change to get updated statuses
    team?.currently_on,
  ]);

  const onChangeStatusFilter = useCallback((status: StatusFilter) => {
    setStatusFilter(status);
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
        header: () => <div className="i-mdi:flag" />,
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
        <PlayerStatusFilter
          statusFilter={statusFilter}
          onChangeStatusFilter={onChangeStatusFilter}
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

const PlayerStatusFilter: React.FC<{
  statusFilter: StatusFilter;
  onChangeStatusFilter: (status: StatusFilter) => void;
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
