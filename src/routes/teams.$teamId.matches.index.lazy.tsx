import { Tables } from "@/database-generated.types";
import { Box, Button, Group, Stack, Title } from "@mantine/core";

type Match = Pick<
  Tables<"matches">,
  | "id"
  | "home_team"
  | "away_team"
  | "home_score"
  | "away_score"
  | "home_penalty_score"
  | "away_penalty_score"
  | "played_on"
  | "competition"
  | "season"
  | "stage"
>;

export const Route = createLazyFileRoute("/teams/$teamId/matches/")({
  component: MatchesPage,
});

function MatchesPage() {
  const { teamId } = Route.useParams();
  const { team } = useTeam(teamId);

  const [matches, setMatches] = useState<Match[]>([]);
  const supabase = useAtomValue(supabaseAtom);
  const [tableState, setTableState] = useState({
    pageIndex: 0,
    pageSize: 10,
    rowCount: 0,
    sorting: {
      id: "played_on",
      desc: true,
    },
  });
  useEffect(() => {
    const fetchPage = async () => {
      const pageQuery = supabase
        .from("matches")
        .select(
          "id, home_team, away_team, home_score, away_score, played_on, competition, season, stage, home_penalty_score, away_penalty_score",
        )
        .range(
          tableState.pageSize * tableState.pageIndex,
          tableState.pageSize * (tableState.pageIndex + 1) - 1,
        )
        .eq("team_id", teamId);

      // TODO: filtering

      pageQuery.order(tableState.sorting.id, {
        ascending: !tableState.sorting.desc,
      });
      pageQuery.order("id", { ascending: !tableState.sorting.desc });

      const { count } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("team_id", teamId);
      const { data, error } = await pageQuery;
      if (error) {
        console.error(error);
      } else {
        setMatches(data);
        setTableState((prev) => ({
          ...prev,
          rowCount: count ?? 0,
        }));
      }
    };

    fetchPage();
  }, [
    supabase,
    tableState.pageIndex,
    tableState.pageSize,
    tableState.sorting,
    teamId,
  ]);

  const columnHelper = createColumnHelper<Match>();
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "teams",
        header: "Match",
        cell: ({ row }) => {
          const match = row.original;
          const color = matchScoreColor(match, team?.name);
          return (
            <>
              <Button
                component={Link}
                to={`/teams/${teamId}/matches/${match.id}`}
                variant="subtle"
                size="compact-xs"
              >
                {match.home_team} v {match.away_team}
              </Button>
              <Box c={color}>{matchScore(match)}</Box>
            </>
          );
        },
        meta: { align: "center" },
      }),
      columnHelper.accessor("competition", {
        header: "Competition",
        cell: (info) => {
          const value = info.getValue();
          return (
            <>
              <div>{value}</div>
              <i>{info.row.original.stage}</i>
            </>
          );
        },
      }),
      columnHelper.accessor("played_on", {
        header: "Date Played",
        cell: (info) => {
          const value = info.getValue();
          return formatDate(value);
        },
        meta: { align: "center", sortable: true },
      }),
    ],
    [columnHelper, team?.name, teamId],
  );

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Matches", to: `/teams/${teamId}/matches` },
    ]);
  }, [setBreadcrumbs, team?.name, teamId]);

  if (!team) {
    return null;
  }

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        Matches
      </Title>

      <Group>
        <Button component={Link} to={`/teams/${teamId}/matches/new`}>
          New Match
        </Button>
      </Group>

      <DataTable
        data={matches}
        columns={columns}
        tableState={tableState}
        setTableState={setTableState}
      />
    </Stack>
  );
}
