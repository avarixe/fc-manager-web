import {
  ActionIcon,
  Box,
  Button,
  Card,
  CardProps,
  Group,
  LoadingOverlay,
  Select,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { keyBy } from "lodash-es";

type PlayerOption = Pick<Player, "id" | "name" | "status" | "pos" | "ovr">;

export const Route = createLazyFileRoute("/teams/$teamId/squads/")({
  component: SquadsPage,
});

function SquadsPage() {
  const { teamId } = Route.useParams();
  const { team } = useTeam(teamId);

  const [squads, setSquads] = useState<Squad[]>([]);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const supabase = useAtomValue(supabaseAtom);
  useEffect(() => {
    const fetchCompetitions = async () => {
      const { data, error } = await supabase
        .from("squads")
        .select()
        .eq("team_id", Number(teamId))
        .order("id");
      if (error) {
        console.error(error);
      } else {
        assertType<Squad[]>(data);
        setSquads(data);
      }
    };
    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, status, pos, ovr")
        .eq("team_id", Number(teamId))
        .order("pos_order");
      if (error) {
        console.error(error);
      } else {
        setPlayers(data);
      }
    };

    fetchCompetitions();
    fetchPlayers();
  }, [supabase, teamId]);

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Squads", to: `/teams/${teamId}/squads` },
    ]);
  }, [setBreadcrumbs, team?.name, teamId]);

  if (!team) {
    return null;
  }

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        Squads
      </Title>

      <NewSquadSection players={players} teamId={teamId} />

      {squads.map((squad) => (
        <SquadCard
          key={squad.id}
          squad={squad}
          players={players}
          teamId={teamId}
        />
      ))}
    </Stack>
  );
}

const NewSquadSection: React.FC<{
  players: PlayerOption[];
  teamId: string;
}> = ({ players, teamId }) => {
  const [squads, setSquads] = useState<number[]>([]);
  const onClickNew = async () => {
    setSquads((prev) => [...prev, prev.length + 1]);
  };

  const onCancel = (index: number) => {
    setSquads((prev) => prev.filter((i) => i !== index));
  };

  return (
    <>
      <Group>
        <Button onClick={onClickNew}>New Squad</Button>
      </Group>

      {squads.map((tempId) => (
        <SquadCard
          key={tempId}
          players={players}
          teamId={teamId}
          onCancel={() => onCancel(tempId)}
          my="md"
        />
      ))}
    </>
  );
};

const SquadCard: React.FC<
  CardProps & {
    squad?: Squad;
    players: PlayerOption[];
    teamId: string;
    onCancel?: () => void;
  }
> = ({ squad, players, teamId, onCancel, ...rest }) => {
  const form = useForm({
    initialValues: {
      id: squad?.id,
      name: squad?.name || "",
      formation: { ...squad?.formation },
    },
    validate: {
      name: isNotEmpty(),
      formation: (value) => {
        return Object.values(value).filter((id) => id).length !== 11
          ? "Formation must have 11 players"
          : null;
      },
    },
    validateInputOnChange: true,
  });

  const [isEditing, setIsEditing] = useState(!squad);
  const onClickCancel = () => {
    if (form.values.id) {
      form.reset();
      setIsEditing(false);
    } else {
      onCancel?.();
    }
  };

  const supabase = useAtomValue(supabaseAtom);
  const session = useAtomValue(sessionAtom);
  const [loading, setLoading] = useState(false);
  const onClickSave = async () => {
    if (!form.isValid()) {
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("squads")
      .upsert({
        ...form.values,
        user_id: session?.user?.id,
        team_id: Number(teamId),
      })
      .select("id");
    if (error) {
      console.error(error);
    } else {
      form.setFieldValue("id", data?.[0]?.id);
      form.resetDirty();
      setIsEditing(false);
    }
    setLoading(false);
  };

  const [deleted, setDeleted] = useState(false);
  const onClickDelete = async () => {
    modals.openConfirmModal({
      title: `Delete Squad: ${form.values.name}`,
      centered: true,
      children: (
        <MText size="sm">
          Are you sure you want to delete this squad? This action cannot be
          undone.
        </MText>
      ),
      labels: {
        confirm: "Delete",
        cancel: "Cancel",
      },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        if (!form.values.id) return;

        try {
          setLoading(true);
          await supabase.from("squads").delete().eq("id", form.values.id);
          setDeleted(true);
        } catch (error) {
          console.error(error);
          setLoading(false);
        }
      },
    });
  };

  const playerOptions = useMemo(() => {
    const inFormation = Object.values(form.values.formation);
    return players
      .filter((player) => !!player.status && !inFormation.includes(player.id))
      .map((player) => ({
        ...player,
        value: String(player.id),
        label: `${player.pos} · ${player.name}`,
      }));
  }, [form.values.formation, players]);

  const [assigningPlayerId, setAssigningPlayerId] = useState<string | null>(
    null,
  );
  const playersById = useMemo(() => keyBy(players, "id"), [players]);
  const onClickPosition = useCallback(
    (position: string) => {
      if (!isEditing) return;

      const formation = { ...form.values.formation };
      const playersIn = Object.values(formation);
      const playerId = formation[position] ? String(formation[position]) : null;
      if (assigningPlayerId) {
        if (playerId === assigningPlayerId) {
          setAssigningPlayerId(null);
        } else {
          // Skip if formation is full
          if (
            playersIn.length === 11 &&
            playersIn.every((id) => String(id) !== assigningPlayerId) &&
            playerId === null
          ) {
            return;
          }

          for (const pos in formation) {
            if (String(formation[pos]) === assigningPlayerId) {
              if (playerId) {
                formation[pos] = Number(playerId);
              } else {
                delete formation[pos];
              }
            }
          }
          formation[position] = Number(assigningPlayerId);
          form.setFieldValue("formation", formation);
          setAssigningPlayerId(null);
        }
      } else if (playerId) {
        setAssigningPlayerId(playerId);
      }
    },
    [assigningPlayerId, form, isEditing],
  );

  const formationOvrData = useMemo(
    () =>
      Object.entries(form.values.formation).map(([pos, playerId]) => {
        const player = playersById[playerId];
        return {
          type: matchPositionTypes[pos],
          value: player?.ovr || 0,
          weight: player ? 1 : 0,
        };
      }),
    [form.values.formation, playersById],
  );

  return (
    <Card pos="relative" className={deleted ? "hidden" : ""} {...rest}>
      <LoadingOverlay
        visible={loading}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <Group mb="md">
        <TextInput
          {...form.getInputProps("name")}
          disabled={!isEditing}
          style={{ flexGrow: 1 }}
        />
        {isEditing ? (
          <>
            <ActionIcon onClick={onClickCancel} variant="subtle">
              <div className="i-mdi:close" />
            </ActionIcon>
            <ActionIcon
              onClick={onClickSave}
              disabled={Object.keys(form.errors).length > 0}
              variant="subtle"
            >
              <div className="i-mdi:content-save" />
            </ActionIcon>
          </>
        ) : (
          <>
            <ActionIcon onClick={() => setIsEditing(true)} variant="subtle">
              <div className="i-mdi:pencil" />
            </ActionIcon>
            <ActionIcon onClick={onClickDelete} variant="subtle">
              <div className="i-mdi:delete" />
            </ActionIcon>
          </>
        )}
      </Group>
      <FormationOvr data={formationOvrData} />
      {isEditing && (
        <Group mb="md">
          <Select
            value={assigningPlayerId}
            onChange={setAssigningPlayerId}
            label="Assign player"
            placeholder="Select player"
            searchable
            clearable
            data={playerOptions}
            renderOption={({ option }) => {
              assertType<PlayerOption>(option);
              return (
                <Group>
                  <MText size="xs" fw="bold">
                    {option.pos}
                  </MText>
                  <MText size="xs">{option.name}</MText>
                </Group>
              );
            }}
          />
        </Group>
      )}
      <FormationGrid
        cells={form.values.formation}
        renderCell={(position, playerId) => (
          <Button
            component={"div"}
            variant={
              String(playerId) === assigningPlayerId ? "light" : "transparent"
            }
            onClick={() => onClickPosition(position)}
            color={String(playerId) === assigningPlayerId ? undefined : "gray"}
            size="lg"
            disabled={!isEditing}
          >
            <Box>
              <MText fw="bold">{position}</MText>
              <MText size="xs">{playersById[playerId]?.name}</MText>
            </Box>
          </Button>
        )}
        renderEmptyCell={(position) => (
          <Button
            component={"div"}
            variant="transparent"
            onClick={() => onClickPosition(position)}
            color="gray"
            size="md"
          >
            <Box>
              <MText fw="bold">{position}</MText>
              <MText size="xs">-</MText>
            </Box>
          </Button>
        )}
        hideEmptyCells={!isEditing}
      />
    </Card>
  );
};
