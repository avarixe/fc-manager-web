import { Change, Player } from "@/types";
import {
  Box,
  Button,
  Group,
  LoadingOverlay,
  Modal,
  NumberInput,
  Select,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { keyBy } from "lodash-es";

interface FormationChange {
  minute: number;
  stoppage_time?: number;
  formation: Record<string, number>;
}

interface FormationItem {
  pos: string;
  playerId: number;
}

type PlayerOption = Pick<Player, "id" | "name" | "pos">;

export const MatchFormationForm: React.FC<{
  opened: boolean;
  onClose: () => void;
}> = ({ opened, onClose }) => {
  const form = useForm<FormationChange>({
    initialValues: {
      minute: 1,
      stoppage_time: undefined,
      formation: {},
    },
    validate: {
      formation: (value) => {
        return Object.values(value).filter((id) => id).length !== 11
          ? "Formation must have 11 players"
          : null;
      },
    },
    validateInputOnChange: true,
  });
  form.watch("minute", () => {
    form.setFieldValue("stoppage_time", undefined);
  });

  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const team = useAtomValue(teamAtom)!;
  const supabase = useAtomValue(supabaseAtom);
  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from("players")
        .select("id, name, pos")
        .eq("team_id", team.id)
        .eq("status", "Active")
        .order("pos_order");
      setPlayers(data ?? []);
    };

    fetchPlayers();
  }, [supabase, team.id]);
  const playersById = useMemo(() => keyBy(players, "id"), [players]);

  const [loading, setLoading] = useState(false);
  const [match, setMatch] = useAtom(matchAtom)!;
  const { resolveFormationChanges } = useMatchCallbacks();
  const { capsAtMinute } = useMatchState(form.values.minute);
  const handleSubmit = useCallback(async () => {
    if (!form.isValid()) {
      return;
    }

    setLoading(true);

    const oldItems: FormationItem[] = capsAtMinute.map((cap) => ({
      pos: cap.pos,
      playerId: cap.player_id,
    }));
    const newItems: FormationItem[] = Object.entries(form.values.formation).map(
      ([pos, playerId]) => ({
        pos,
        playerId,
      }),
    );
    for (let i = newItems.length - 1; i >= 0; i--) {
      const item = newItems[i];
      const oldIndex = oldItems.findIndex(
        (cap) => cap.pos === item.pos && cap.playerId === item.playerId,
      );

      if (oldIndex >= 0) {
        oldItems.splice(oldIndex, 1);
        newItems.splice(i, 1);
      }
    }

    const changes: Change[] = [];

    // Match by player id to prioritize position changes
    for (let i = newItems.length - 1; i >= 0; i--) {
      const item = newItems[i];
      const oldItemIndex = oldItems.findIndex(
        (cap) => cap.playerId === item.playerId,
      );
      if (oldItemIndex >= 0) {
        const oldItem = oldItems[oldItemIndex];
        changes.push({
          minute: form.values.minute,
          stoppage_time: form.values.stoppage_time,
          injured: false,
          out: {
            pos: oldItem.pos,
            name: playersById[oldItem.playerId].name,
          },
          in: {
            pos: item.pos,
            name: playersById[item.playerId].name,
          },
        });
        oldItems.splice(oldItemIndex, 1);
        newItems.splice(i, 1);
      }
    }

    // Then match by position to prioritize position changes
    for (let i = newItems.length - 1; i >= 0; i--) {
      const item = newItems[i];
      const oldItemIndex = oldItems.findIndex((cap) => cap.pos === item.pos);
      if (oldItemIndex >= 0) {
        const oldItem = oldItems[oldItemIndex];
        changes.push({
          minute: form.values.minute,
          stoppage_time: form.values.stoppage_time,
          injured: false,
          out: {
            pos: oldItem.pos,
            name: playersById[oldItem.playerId].name,
          },
          in: {
            pos: item.pos,
            name: playersById[item.playerId].name,
          },
        });
        oldItems.splice(oldItemIndex, 1);
        newItems.splice(i, 1);
      }
    }

    // Then match remaining items
    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      const oldItem = oldItems[i];
      changes.push({
        minute: form.values.minute,
        stoppage_time: form.values.stoppage_time,
        injured: false,
        out: {
          pos: oldItem.pos,
          name: playersById[oldItem.playerId].name,
        },
        in: {
          pos: item.pos,
          name: playersById[item.playerId].name,
        },
      });
    }

    // Update match.changes
    await supabase.from("matches").update({ changes }).eq("id", match!.id);
    setMatch((prev) => (prev ? { ...prev, changes } : prev));
    resolveFormationChanges({ ...match!, changes });

    setLoading(false);
  }, [
    capsAtMinute,
    form,
    match,
    playersById,
    resolveFormationChanges,
    setMatch,
    supabase,
  ]);

  useEffect(() => {
    const formation: Record<string, number> = {};
    capsAtMinute.forEach((cap) => {
      formation[cap.pos] = cap.player_id;
    });
    form.setFieldValue("formation", formation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capsAtMinute]);

  const playerOptions = useMemo(() => {
    const inFormation = Object.values(form.values.formation);
    return players
      .filter((player) => !inFormation.includes(player.id))
      .map((player) => ({
        value: String(player.id),
        label: player.name,
      }));
  }, [form.values.formation, players]);

  const [assigningPlayerId, setAssigningPlayerId] = useState<string | null>(
    null,
  );
  const onClickPosition = useCallback(
    (position: string) => {
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
    [assigningPlayerId, form],
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Formation Change"
      centered
      closeOnClickOutside={false}
      trapFocus
      size="100%"
    >
      <LoadingOverlay
        visible={loading}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Group mb="md">
          <Select
            value={assigningPlayerId}
            onChange={setAssigningPlayerId}
            label="Assign player"
            placeholder="Select player"
            clearable
            data={playerOptions}
            renderOption={({ option }) => (
              <Group>
                <MText size="xs" fw="bold">
                  {playersById[option.value]?.pos}
                </MText>
                <MText size="xs">{option.label}</MText>
              </Group>
            )}
          />
          <NumberInput
            {...form.getInputProps("minute")}
            label="Minute"
            suffix="'"
            required
            min={1}
            max={match!.extra_time ? 120 : 90}
          />
          {[45, 90, 105, 120].includes(form.values.minute) && (
            <NumberInput
              {...form.getInputProps("stoppage_time")}
              label="Stoppage Time"
              prefix="+"
              min={0}
            />
          )}
        </Group>
        <FormationGrid
          cells={form.values.formation}
          renderCell={(position, playerId) => (
            <Button
              component={"div"}
              variant={
                String(playerId) === assigningPlayerId ? "light" : "transparent"
              }
              onClick={() => onClickPosition(position)}
              color={
                String(playerId) === assigningPlayerId ? undefined : "gray"
              }
              size="lg"
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
        />
        <Button type="submit" fullWidth mt="xl">
          Save
        </Button>
      </form>
    </Modal>
  );
};
