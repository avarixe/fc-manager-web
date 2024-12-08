import { Cap, Match, Player, Squad } from "@/types";
import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Group,
  Menu,
  NumberInput,
  SegmentedControl,
  Stack,
  Switch,
  Table,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";

type PlayerOption = Pick<
  Player,
  "id" | "name" | "status" | "pos" | "ovr" | "kit_no"
>;

export const Route = createLazyFileRoute("/teams/$teamId/matches/$id/")({
  component: MatchPage,
});

function MatchPage() {
  const { id, teamId } = Route.useParams();
  const { team } = useTeam(teamId);

  const [match, setMatch] = useAtom(matchAtom);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [playerOptions, setPlayerOptions] = useState<PlayerOption[]>([]);
  const playerOvrByIdRef = useRef(new Map<number, number>());
  const playerKitNoByIdRef = useRef(new Map<number, number | null>());
  const setCaps = useSetAtom(capsAtom);
  const supabase = useAtomValue(supabaseAtom);
  useEffect(() => {
    const fetchMatch = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*, caps(*, players(name))")
        .eq("team_id", teamId)
        .eq("id", id)
        .single();
      if (error) {
        console.error(error);
      } else {
        assertType<Match>(data);
        setMatch(data);

        assertType<Cap[]>(data.caps);
        setCaps(data.caps);
      }
    };

    const fetchSquads = async () => {
      const { data, error } = await supabase
        .from("squads")
        .select()
        .eq("team_id", teamId)
        .order("id");
      if (error) {
        console.error(error);
      } else {
        assertType<Squad[]>(data);
        setSquads(data);
      }
    };

    const fetchPlayerOvr = async () => {
      const { data } = await supabase
        .from("players")
        .select("id, name, status, pos, ovr, kit_no")
        .eq("team_id", teamId)
        .order("pos_order");
      setPlayerOptions(data ?? []);
      data?.forEach((item) => {
        playerOvrByIdRef.current.set(item.id, item.ovr);
        playerKitNoByIdRef.current.set(item.id, item.kit_no);
      });
    };

    fetchMatch();
    fetchSquads();
    fetchPlayerOvr();
  }, [id, setCaps, setMatch, supabase, teamId]);

  const [prevId, setPrevId] = useState<number>();
  const [nextId, setNextId] = useState<number>();
  useEffect(() => {
    const fetchPrevMatch = async () => {
      const { data: prev } = await supabase
        .from("matches")
        .select("id")
        .eq("team_id", teamId)
        .lt("played_on", match?.played_on)
        .order("played_on", { ascending: false })
        .limit(1)
        .single();
      setPrevId(prev?.id);
    };

    const fetchNextMatch = async () => {
      const { data: next } = await supabase
        .from("matches")
        .select("id")
        .eq("team_id", teamId)
        .gt("played_on", match?.played_on)
        .order("played_on")
        .limit(1)
        .single();
      setNextId(next?.id);
    };

    if (match?.played_on) {
      fetchPrevMatch();
      fetchNextMatch();
    }
  }, [match?.played_on, supabase, teamId]);

  const setAppLoading = useSetAtom(appLoadingAtom);
  const navigate = useNavigate();
  const onClickDelete = useCallback(() => {
    modals.openConfirmModal({
      title: "Delete Match",
      centered: true,
      children: (
        <MText size="sm">
          Are you sure you want to delete this match? This action cannot be
          undone.
        </MText>
      ),
      labels: {
        confirm: "Delete",
        cancel: "Cancel",
      },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          setAppLoading(true);
          await supabase.from("matches").delete().eq("id", id);
          navigate({ to: `/teams/${teamId}/matches/` });
        } catch (error) {
          console.error(error);
        } finally {
          setAppLoading(false);
        }
      },
    });
  }, [id, navigate, setAppLoading, supabase, teamId]);

  const caps = useAtomValue(capsAtom);
  const session = useAtomValue(sessionAtom);
  const applySquad = useCallback(
    async (squad: Squad) => {
      // Delete existing caps.
      await supabase
        .from("caps")
        .delete()
        .in(
          "id",
          caps.map((cap) => cap.id),
        );

      // Reset all match events.
      const matchChanges = {
        goals: [],
        bookings: [],
        changes: [],
        extra_time: false,
        home_score: 0,
        away_score: 0,
        home_xg: 0,
        away_xg: 0,
        home_possession: 50,
        away_possession: 50,
        home_penalty_score: null,
        away_penalty_score: null,
      };
      await supabase.from("matches").update(matchChanges).eq("id", id);
      setMatch((prev) => {
        if (!prev) {
          return prev;
        }
        return { ...prev, ...matchChanges };
      });

      // Apply squad.
      const capData = Object.entries(squad.formation).map(
        ([pos, player_id]) => ({
          user_id: session?.user?.id,
          match_id: Number(id),
          player_id,
          pos,
          ovr: playerOvrByIdRef.current.get(player_id) ?? 0,
          kit_no: playerKitNoByIdRef.current.get(player_id) ?? 0,
        }),
      );
      const { data, error } = await supabase
        .from("caps")
        .insert(capData)
        .select("*, players(name)");
      if (error) {
        console.error(error);
      } else {
        assertType<Cap[]>(data);
        setCaps(data);
      }
    },
    [caps, id, session?.user?.id, setCaps, setMatch, supabase],
  );

  const [squadName, setSquadName] = useState("");
  const saveToSquad = useCallback(
    async (squad?: Squad) => {
      if (!squad && !squadName) {
        return;
      }

      const startingFormation: Record<string, number> = {};
      caps.forEach((cap) => {
        if (cap.start_minute === 0) {
          startingFormation[cap.pos] = cap.player_id;
        }
      });

      const { data, error } = await supabase
        .from("squads")
        .upsert({
          id: squad?.id,
          user_id: session?.user?.id,
          team_id: Number(teamId),
          name: squad?.name ?? squadName,
          formation: startingFormation,
        })
        .select()
        .single();
      if (error) {
        console.error(error);
      } else {
        assertType<Squad>(data);
        setSquads((prev) => {
          const index = prev.findIndex((s) => s.id === data.id);
          if (index === -1) {
            return [...prev, data];
          }
          return [...prev.slice(0, index), data, ...prev.slice(index + 1)];
        });
      }
    },
    [caps, session?.user?.id, squadName, supabase, teamId],
  );

  const [newCapOpened, { open: openNewCap, close: closeNewCap }] =
    useDisclosure();
  const [
    formationFormOpened,
    { open: openFormationForm, close: closeFormationForm },
  ] = useDisclosure();

  const [readonly, setReadonly] = useState(false);
  useEffect(() => {
    setReadonly(match?.played_on !== team?.currently_on);
  }, [match?.played_on, team?.currently_on]);

  const formationOvrData = useMemo(
    () =>
      caps.map((cap) => ({
        type: matchPositionTypes[cap.pos],
        value: cap.ovr,
        weight: cap.stop_minute - cap.start_minute,
      })),
    [caps],
  );

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Matches", to: `/teams/${teamId}/matches` },
      {
        title: `${match?.home_team} v ${match?.away_team}`,
        to: `/teams/${teamId}/matches/${id}`,
      },
    ]);
  }, [
    id,
    match?.away_team,
    match?.home_team,
    setBreadcrumbs,
    team?.name,
    teamId,
  ]);

  const [lineupMode, setLineupMode] = useState("formation");

  if (!team || !match) {
    return null;
  }

  return (
    <Stack>
      <Box mb="xl">
        <Title fw="lighter">
          {match.home_team} v {match.away_team}
        </Title>
        <Title order={4} fw="bolder">
          {match.competition} {match.stage}
          {match.friendly ? " (Friendly)" : null}
        </Title>
        <Title order={6}>{formatDate(match.played_on)}</Title>
      </Box>
      <Switch
        label="Readonly Mode"
        checked={readonly}
        onChange={(event) => setReadonly(event.currentTarget.checked)}
      />
      <Group>
        {!readonly && (
          <Button component={Link} to={`/teams/${team.id}/matches/${id}/edit`}>
            Edit
          </Button>
        )}
        {prevId && (
          <Button
            component={Link}
            to={`/teams/${team.id}/matches/${prevId}`}
            variant="default"
          >
            Prev Match
          </Button>
        )}
        {nextId ? (
          <Button
            component={Link}
            to={`/teams/${team.id}/matches/${nextId}`}
            variant="default"
          >
            Next Match
          </Button>
        ) : (
          <Button
            component={Link}
            to={`/teams/${team.id}/matches/new`}
            variant="default"
          >
            New Match
          </Button>
        )}
        {!readonly && (
          <Button
            onClick={onClickDelete}
            variant="outline"
            color="red"
            className="ml-auto"
          >
            Delete
          </Button>
        )}
      </Group>
      <MatchInfo readonly={readonly} />

      <Box my="lg">
        <Title order={2}>
          <Group>
            <div className="i-mdi:account-multiple" />
            Lineup
          </Group>
        </Title>
        <Divider my="xs" />

        {!readonly && (
          <Group mb="md">
            <Menu>
              <Menu.Target>
                <Button variant={caps.length >= 11 ? "default" : "filled"}>
                  Apply Squad
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {squads.map((squad) => (
                  <Menu.Item key={squad.id} onClick={() => applySquad(squad)}>
                    {squad.name}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
            {caps.length < 11 ? (
              <>
                <Button onClick={openNewCap} variant="default">
                  Add Player
                </Button>
                <CapForm
                  opened={newCapOpened}
                  onClose={closeNewCap}
                  playerOptions={playerOptions}
                />
              </>
            ) : (
              <>
                <Menu>
                  <Menu.Target>
                    <Button variant="default">Save Lineup</Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item component="div" closeMenuOnClick={false}>
                      <TextInput
                        value={squadName}
                        onChange={(event) =>
                          setSquadName(event.currentTarget.value)
                        }
                        label="New Squad"
                        placeholder="Squad Name"
                        rightSection={
                          <ActionIcon
                            onClick={() => saveToSquad()}
                            color="blue"
                          >
                            <div className="i-mdi:content-save" />
                          </ActionIcon>
                        }
                      />
                    </Menu.Item>
                    {squads.map((squad) => (
                      <Menu.Item
                        key={squad.id}
                        onClick={() => saveToSquad(squad)}
                      >
                        {squad.name}
                      </Menu.Item>
                    ))}
                  </Menu.Dropdown>
                </Menu>
                <Button
                  onClick={openFormationForm}
                  leftSection={<div className="i-mdi:vector-polygon" />}
                >
                  Edit Formation
                </Button>
                <MatchFormationForm
                  opened={formationFormOpened}
                  onClose={closeFormationForm}
                />
              </>
            )}
          </Group>
        )}

        {[match.home_team, match.away_team].includes(team.name) && (
          <>
            <SegmentedControl
              value={lineupMode}
              onChange={(value) => setLineupMode(value)}
              data={[
                {
                  value: "formation",
                  label: <BaseIcon name="i-mdi:vector-polygon" fz="xl" />,
                },
                {
                  value: "lineup",
                  label: <BaseIcon name="i-mdi:format-list-bulleted" fz="xl" />,
                },
              ]}
            />
            <Stack gap="xl">
              <FormationOvr data={formationOvrData} />
              {lineupMode === "formation" ? (
                <MatchFormation
                  readonly={readonly}
                  playerOptions={playerOptions}
                />
              ) : (
                <MatchLineup
                  readonly={readonly}
                  playerOptions={playerOptions}
                />
              )}
            </Stack>
          </>
        )}
      </Box>

      <Box my="lg">
        <Title order={2}>
          <Group>
            <div className="i-mdi:timer" />
            Events
          </Group>
        </Title>
        <Divider my="xs" />

        <MatchTimeline readonly={readonly} playerOptions={playerOptions} />
      </Box>
    </Stack>
  );
}

const MatchInfo: React.FC<{
  readonly: boolean;
}> = ({ readonly }) => {
  const [match, setMatch] = useAtom(matchAtom);
  assertType<Match>(match);
  const form = useForm({
    initialValues: {
      home_xg: match.home_xg,
      away_xg: match.away_xg,
      home_possession: match.home_possession ?? 50,
      away_possession: match.away_possession ?? 50,
    },
  });
  form.watch("home_possession", ({ value }) => {
    if (0 <= value && value <= 100) {
      form.setFieldValue("away_possession", 100 - value);
    }
  });
  form.watch("away_possession", ({ value }) => {
    if (0 <= value && value <= 100) {
      form.setFieldValue("home_possession", 100 - value);
    }
  });
  form.watch("home_xg", ({ value }) => {
    if (typeof value === "string" && value === "") {
      form.setFieldValue("home_xg", null);
    }
  });
  form.watch("away_xg", ({ value }) => {
    if (typeof value === "string" && value === "") {
      form.setFieldValue("away_xg", null);
    }
  });

  useEffect(() => {
    if (readonly) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readonly]);

  useEffect(() => {
    form.setValues({
      home_xg: match.home_xg,
      away_xg: match.away_xg,
      home_possession: match.home_possession ?? 50,
      away_possession: match.away_possession ?? 50,
    });
    form.resetDirty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    match.away_possession,
    match.away_xg,
    match.home_possession,
    match.home_xg,
  ]);

  const supabase = useAtomValue(supabaseAtom);
  const onClick = useCallback(async () => {
    if (!form.validate()) {
      return;
    }

    const changes = form.getValues();
    const { error } = await supabase
      .from("matches")
      .update(changes)
      .eq("id", match.id);
    if (error) {
      console.error(error);
    } else {
      setMatch((prev) => (prev ? { ...prev, ...changes } : prev));
      form.resetDirty();
    }
  }, [form, match.id, setMatch, supabase]);

  const team = useAtomValue(teamAtom);
  const scoreColor = useMemo(
    () => matchScoreColor(match, team?.name),
    [match, team?.name],
  );

  return (
    <Table withRowBorders={false}>
      <Table.Tbody>
        <Table.Tr>
          <Table.Td w="40%" ta="end" fz="xl" fw={1000} c="cyan">
            {match.home_team}
          </Table.Td>
          <Table.Td w="20%" ta="center">
            Team
          </Table.Td>
          <Table.Td w="40%" fz="xl" fw={1000} c="teal">
            {match.away_team}
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td ta="end" fz="xl" fw={1000} c={scoreColor}>
            {match.home_score}
            {match.home_penalty_score ? ` (${match.home_penalty_score})` : null}
          </Table.Td>
          <Table.Td ta="center">
            <div>Score</div>
            {match.extra_time && (
              <Box c="grey" fz="xs">
                After Extra Time
              </Box>
            )}
          </Table.Td>
          <Table.Td fz="xl" fw={1000} c={scoreColor}>
            {match.away_score}
            {match.away_penalty_score !== null
              ? ` (${match.away_penalty_score})`
              : null}
          </Table.Td>
        </Table.Tr>
        {((match.home_xg !== null && match.away_xg !== null) || !readonly) && (
          <Table.Tr>
            <Table.Td ta="end">
              <NumberInput
                {...form.getInputProps("home_xg")}
                variant={readonly ? "unstyled" : "default"}
                hideControls
                allowNegative={false}
                readOnly={readonly}
                classNames={{ input: "text-right" }}
              />
            </Table.Td>
            <Table.Td ta="center">Expected Goals</Table.Td>
            <Table.Td>
              <NumberInput
                {...form.getInputProps("away_xg")}
                variant={readonly ? "unstyled" : "default"}
                hideControls
                allowNegative={false}
                readOnly={readonly}
              />
            </Table.Td>
          </Table.Tr>
        )}
        <Table.Tr>
          <Table.Td ta="end">
            <NumberInput
              {...form.getInputProps("home_possession")}
              suffix="%"
              variant={readonly ? "unstyled" : "default"}
              hideControls
              allowNegative={false}
              allowDecimal={false}
              readOnly={readonly}
              classNames={{ input: "text-right" }}
            />
          </Table.Td>
          <Table.Td ta="center">Possession</Table.Td>
          <Table.Td>
            <NumberInput
              {...form.getInputProps("away_possession")}
              suffix="%"
              variant={readonly ? "unstyled" : "default"}
              hideControls
              allowNegative={false}
              allowDecimal={false}
              readOnly={readonly}
            />
          </Table.Td>
        </Table.Tr>
        {form.isDirty() && (
          <Table.Tr>
            <Table.Td ta="center" colSpan={3}>
              <Button onClick={onClick} color="blue" variant="light" mt="md">
                Save
              </Button>
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
};
