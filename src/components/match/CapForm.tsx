import { Cap, Player } from "@/types";
import {
  Button,
  ComboboxItem,
  Group,
  LoadingOverlay,
  Modal,
  Select,
} from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";

type PlayerOption = Pick<Player, "id" | "name" | "status" | "pos" | "ovr">;
type PlayerIdOption = ComboboxItem & PlayerOption;

export const CapForm: React.FC<{
  opened: boolean;
  onClose: () => void;
  playerOptions: PlayerOption[];
}> = ({ opened, onClose, playerOptions }) => {
  const form = useForm({
    initialValues: {
      playerId: "",
      pos: "",
    },
    validate: {
      playerId: isNotEmpty("Player"),
      pos: isNotEmpty("Position"),
    },
  });

  useEffect(() => {
    if (opened) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const [loading, setLoading] = useState(false);
  const supabase = useAtomValue(supabaseAtom);
  const session = useAtomValue(sessionAtom)!;
  const match = useAtomValue(matchAtom)!;
  const setCaps = useSetAtom(capsAtom);
  const handleSubmit = useCallback(async () => {
    if (!form.isValid()) {
      return;
    }

    setLoading(true);

    const player = playerOptions.find(
      (player) => player.id === Number(form.values.playerId),
    )!;
    const { data } = await supabase
      .from("caps")
      .insert({
        user_id: session.user.id,
        match_id: match.id,
        player_id: Number(form.values.playerId),
        pos: form.values.pos,
        ovr: player.ovr,
        start_minute: 0,
        stop_minute: match.extra_time ? 120 : 90,
      })
      .select("*, players(name)")
      .single();
    if (data) {
      assertType<Cap>(data);
      setCaps((prev) => [...prev, data]);
    }

    setLoading(false);
    onClose();
  }, [
    form,
    match.extra_time,
    match.id,
    onClose,
    playerOptions,
    session.user.id,
    setCaps,
    supabase,
  ]);

  const playerIdOptions = useMemo(
    () =>
      playerOptions
        .filter((player) => player.status === "Active")
        .map((player) => ({
          ...player,
          value: String(player.id),
          label: `${player.pos} · ${player.name}`,
        })),
    [playerOptions],
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add Player"
      centered
      closeOnClickOutside={false}
      trapFocus
    >
      <LoadingOverlay
        visible={loading}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Select
          {...form.getInputProps("playerId")}
          label="Player"
          searchable
          required
          data={playerIdOptions}
          renderOption={({ option }) => {
            assertType<PlayerIdOption>(option);
            return (
              <Group>
                <MText size="xs" fw="bold">
                  {option.pos}
                </MText>
                <MText size="xs">{option.name}</MText>
              </Group>
            );
          }}
          mb="xs"
        />
        <Select
          {...form.getInputProps("pos")}
          label="Position"
          data={matchPositions}
          searchable
          required
          mb="xs"
        />
        <Button type="submit" fullWidth mt="xl">
          Save
        </Button>
      </form>
    </Modal>
  );
};
