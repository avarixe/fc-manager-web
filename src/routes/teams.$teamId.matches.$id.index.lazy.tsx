import { Appearance, Match, Squad } from "@/types";
import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Group,
  Menu,
  NumberInput,
  Stack,
  Switch,
  Table,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";

export const Route = createLazyFileRoute("/teams/$teamId/matches/$id/")({
  component: MatchPage,
});

function MatchPage() {
  const { id, teamId } = Route.useParams();
  const { team } = useTeam(teamId);

  const [match, setMatch] = useState<Match | null>(null);
  const [squads, setSquads] = useState<Squad[]>([]);
  const playerOvrByIdRef = useRef(new Map<number, number>());
  const setAppearanceMap = useSetAtom(appearanceMapAtom);
  const supabase = useAtomValue(supabaseAtom);
  useEffect(() => {
    const fetchMatch = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          *,
          appearances(
            *,
            players(name),
            next:next_id(players(name), pos),
            previous:appearances(players(name), injured, pos)
          )
        `,
        )
        .eq("team_id", teamId)
        .eq("id", id)
        .single();
      if (error) {
        console.error(error);
      } else {
        assertType<Match>(data);
        setMatch(data);

        assertType<Appearance[]>(data.appearances);
        setAppearanceMap(
          new AppearanceMap(
            data.appearances.map((appearance: Appearance) => [
              appearance.id,
              atom(appearance),
            ]),
          ),
        );
      }
    };

    const fetchSquads = async () => {
      const { data, error } = await supabase
        .from("squads")
        .select()
        .eq("team_id", teamId);
      if (error) {
        console.error(error);
      } else {
        assertType<Squad[]>(data);
        setSquads(data);
      }
    };

    const fetchPlayerOvr = async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, ovr")
        .eq("team_id", teamId);
      if (error) {
        console.error(error);
      } else {
        data.forEach((item) => {
          playerOvrByIdRef.current.set(item.id, item.ovr);
        });
      }
    };

    fetchMatch();
    fetchSquads();
    fetchPlayerOvr();
  }, [id, setAppearanceMap, supabase, teamId]);

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

  const appearances = useAtomValue(appearancesArrayAtom);
  const session = useAtomValue(sessionAtom);
  const applySquad = useCallback(
    async (squad: Squad) => {
      // Delete existing appearances.
      await supabase
        .from("appearances")
        .delete()
        .in(
          "id",
          appearances.map((appearance) => appearance.id),
        );

      // Reset all match events.
      const matchChanges = {
        goals: [],
        bookings: [],
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
      const appearanceData = Object.entries(squad.formation).map(
        ([pos, player_id]) => ({
          user_id: session?.user?.id,
          match_id: Number(id),
          player_id,
          pos,
          ovr: playerOvrByIdRef.current.get(player_id) ?? 0,
        }),
      );
      const { data, error } = await supabase
        .from("appearances")
        .insert(appearanceData).select(`
        *,
        players(name),
        next:next_id(players(name), pos),
        previous:appearances(players(name), injured, pos)
      `);
      if (error) {
        console.error(error);
      } else {
        assertType<Appearance[]>(data);
        setAppearanceMap(
          new AppearanceMap(
            data.map((appearance: Appearance) => [
              appearance.id,
              atom(appearance),
            ]),
          ),
        );
      }
    },
    [appearances, id, session?.user?.id, setAppearanceMap, supabase],
  );

  const [squadName, setSquadName] = useState("");
  const saveToSquad = useCallback(
    async (squad?: Squad) => {
      if (!squad && !squadName) {
        return;
      }

      const startingFormation: Record<string, number> = {};
      appearances.forEach((appearance) => {
        if (appearance.start_minute === 0) {
          startingFormation[appearance.pos] = appearance.player_id;
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
    [appearances, session?.user?.id, squadName, supabase, teamId],
  );

  const [readonly, setReadonly] = useState(false);

  if (!team || !match) {
    return null;
  }

  return (
    <Stack>
      <Box mb="xl">
        <Title order={6}>{formatDate(match.played_on)}</Title>
        <Title order={4} fw="bolder">
          {match.competition} {match.stage}
        </Title>
        <Title fw="lighter">
          {match.home_team} v {match.away_team}
        </Title>
      </Box>
      <Switch
        label="Readonly Mode"
        checked={readonly}
        onChange={(event) => setReadonly(event.currentTarget.checked)}
      />
      <Group>
        <Button component={Link} to={`/teams/${team.id}/matches/${id}/edit`}>
          Edit
        </Button>
        <Button
          onClick={onClickDelete}
          variant="outline"
          color="red"
          className="ml-auto"
        >
          Delete
        </Button>
      </Group>
      <MatchInfo match={match} setMatch={setMatch} readonly={readonly} />

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
                <Button
                  variant={appearances.length >= 11 ? "default" : "filled"}
                >
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
            {appearances.length >= 11 && (
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
                  onClick={() => alert("TODO")}
                  leftSection={<div className="i-mdi:vector-polygon" />}
                >
                  Edit Formation
                </Button>
              </>
            )}
          </Group>
        )}
        <MatchLineup match={match} />
      </Box>

      <Box my="lg">
        <Title order={2}>
          <Group>
            <div className="i-mdi:timer" />
            Events
          </Group>
        </Title>
        <Divider my="xs" />

        <MatchTimeline match={match} setMatch={setMatch} readonly={readonly} />
      </Box>
    </Stack>
  );
}

const MatchInfo: React.FC<{
  match: Match;
  setMatch: StateSetter<Match>;
  readonly: boolean;
}> = ({ match, setMatch, readonly }) => {
  const form = useForm({
    initialValues: {
      home_xg: match.home_xg ?? 0,
      away_xg: match.away_xg ?? 0,
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

  useEffect(() => {
    if (readonly) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readonly]);

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
      setMatch((prev: Match) => ({ ...prev, ...changes }));
      form.resetDirty();
    }
  }, [form, match.id, setMatch, supabase]);

  return (
    <Table withRowBorders={false}>
      <Table.Tbody>
        <Table.Tr>
          <Table.Td w="40%" ta="end">
            {match.home_team}
          </Table.Td>
          <Table.Td w="20%" ta="center">
            Team
          </Table.Td>
          <Table.Td w="40%">{match.away_team}</Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td ta="end">
            {match.home_score}{" "}
            {match.home_penalty_score ? `(${match.home_penalty_score})` : null}
          </Table.Td>
          <Table.Td ta="center">Score</Table.Td>
          <Table.Td>
            {match.away_score}{" "}
            {match.away_penalty_score ? `(${match.away_penalty_score})` : null}
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td ta="end">
            <NumberInput
              {...form.getInputProps("home_xg")}
              variant={readonly ? "unstyled" : "default"}
              hideControls
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
              readOnly={readonly}
            />
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td ta="end">
            <NumberInput
              {...form.getInputProps("home_possession")}
              suffix="%"
              variant={readonly ? "unstyled" : "default"}
              hideControls
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
