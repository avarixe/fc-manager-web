import { DonutChart, ScatterChart } from "@mantine/charts";
import { Card, Group, Stack, Title } from "@mantine/core";

export const Route = createLazyFileRoute("/teams/$teamId/players/analytics")({
  component: PlayerAnalyticsPage,
});

function PlayerAnalyticsPage() {
  const { teamId } = Route.useParams();
  const { team } = useTeam(teamId);

  const [players, setPlayers] = useState<Player[]>([]);
  const supabase = useAtomValue(supabaseAtom);
  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from("players")
        .select("id, name, nationality, status, pos, youth, ovr, wage")
        .eq("team_id", Number(teamId))
        .in("status", ["Active", "Injured"])
        .order("pos_order");
      assertType<Player[]>(data);
      setPlayers(data);
    };

    fetchPlayers();
  }, [supabase, teamId]);

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Players", to: `/teams/${teamId}/players` },
      { title: "Analytics", to: `/teams/${teamId}/players/analytics` },
    ]);
  }, [setBreadcrumbs, team?.name, teamId]);

  const formationOvrData = useMemo(
    () =>
      players.map((player) => ({
        type: matchPositionTypes[player.pos],
        value: player.ovr,
        weight: 1,
      })),
    [players],
  );

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        Player Analytics
      </Title>

      <FormationOvr data={formationOvrData} />

      <Group grow align="start" mt="xl">
        <Stack>
          <Card bg="transparent" withBorder>
            <Title order={4} mb="lg">
              Position Distribution
            </Title>
            <PositionDistribution players={players} />
          </Card>
        </Stack>
        <Stack>
          <Card bg="transparent" withBorder>
            <Title order={4} mb="lg">
              Wage Distribution
            </Title>
            <WageDistribution players={players} />
          </Card>
        </Stack>
      </Group>
    </Stack>
  );
}

enum PositionColor {
  GK = "orange.6",
  DEF = "yellow.6",
  MID = "green.6",
  FWD = "blue.6",
}

const PositionDistribution: React.FC<{
  players: Player[];
}> = ({ players }) => {
  const counts = {
    GK: 0,
    DEF: 0,
    MID: 0,
    FWD: 0,
  };
  players.forEach((player) => {
    if (player.pos === "GK") {
      counts.GK++;
    } else {
      counts[matchPositionTypes[player.pos]]++;
    }
  });

  const chartData = [
    { name: "GK", value: counts.GK, color: PositionColor.GK },
    { name: "DEF", value: counts.DEF, color: PositionColor.DEF },
    { name: "MID", value: counts.MID, color: PositionColor.MID },
    { name: "FWD", value: counts.FWD, color: PositionColor.FWD },
  ];

  const totalCount = counts.GK + counts.DEF + counts.MID + counts.FWD;

  return (
    <Group grow>
      <DonutChart
        data={chartData}
        chartLabel={totalCount}
        withTooltip={false}
        styles={{
          label: {
            fontSize: 40,
            fontWeight: 700,
          },
        }}
        size={250}
      />
      <Stack gap="xs">
        {chartData.map(({ name, value, color }) => (
          <Group key={name} align="center">
            <BaseIcon name="i-mdi:circle" c={color} />
            <MText>{name}</MText>
            <MText ml="auto">{value}</MText>
          </Group>
        ))}
      </Stack>
    </Group>
  );
};

const WageDistribution: React.FC<{
  players: Player[];
}> = ({ players }) => {
  const chartData = players.map((player) => ({
    color:
      player.pos === "GK"
        ? PositionColor.GK
        : PositionColor[matchPositionTypes[player.pos]],
    name: `${player.pos} · ${player.name}`,
    data: [{ ovr: player.ovr, wage: player.wage ?? 0 }],
  }));

  const minOvr = Math.min(...players.map((player) => player.ovr));
  const maxOvr = Math.max(...players.map((player) => player.ovr));

  return (
    <ScatterChart
      data={chartData}
      dataKey={{ x: "ovr", y: "wage" }}
      xAxisLabel="OVR Rating"
      yAxisLabel="Wage"
      labels={{
        x: "OVR Rating",
        y: "Wage",
      }}
      xAxisProps={{
        domain: [minOvr, maxOvr],
      }}
      valueFormatter={{
        y: (value) => new Intl.NumberFormat("en-US").format(value),
      }}
      h={250}
    />
  );
};
