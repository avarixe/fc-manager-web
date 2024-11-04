import { Cap, Player } from "@/types";
import {
  Button,
  Checkbox,
  ComboboxItem,
  Group,
  LoadingOverlay,
  Modal,
  NumberInput,
  Select,
} from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";

type CapOption = ComboboxItem & Cap;
type PlayerOption = Pick<Player, "id" | "name" | "status" | "pos" | "ovr">;
type ReplacementOption = ComboboxItem & PlayerOption;

interface SubstituteAttributes {
  start_minute: number;
  previous_id: string | null;
  player_id: string | null;
  pos: string | null;
}

export const SubstitutionForm: React.FC<{
  opened: boolean;
  onClose: () => void;
  playerOptions: PlayerOption[];
  // onSubmit: (substitution: Cap) => Promise<void>;
}> = ({ opened, onClose, playerOptions }) => {
  const form = useForm<SubstituteAttributes>({
    initialValues: {
      start_minute: 1,
      previous_id: null,
      player_id: null,
      pos: null,
    },
    validate: {
      previous_id: isNotEmpty("Player"),
      player_id: isNotEmpty("Replaced By"),
      pos: isNotEmpty("Position"),
    },
    onValuesChange: (values) => {
      console.log(values);
    },
  });
  form.watch("previous_id", ({ value }) => {
    const playerCap = capsAtMinute.find(
      (cap) => cap.player_id === Number(value),
    );

    if (playerCap) {
      form.setFieldValue("pos", playerCap.pos);
    }
  });

  useEffect(() => {
    if (opened) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const [loading, setLoading] = useState(false);
  const match = useAtomValue(matchAtom)!;
  const handleSubmit = useCallback(async () => {
    if (!form.isValid()) {
      return;
    }

    assertDefined(form.values.pos);

    setLoading(true);
    // await onSubmit(form.values);
    setLoading(false);
    onClose();
  }, [form, onClose]);

  const { capsAtMinute } = useMatchState(form.values.start_minute);
  const capOptions = useMemo(
    () =>
      capsAtMinute.map((cap) => ({
        ...cap,
        value: String(cap.player_id),
        label: `${cap.pos} · ${cap.players.name}`,
      })),
    [capsAtMinute],
  );

  const replacementOptions = useMemo(
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
      title="New Substitution"
      centered
      closeOnClickOutside={false}
    >
      <LoadingOverlay
        visible={loading}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <NumberInput
          {...form.getInputProps("start_minute")}
          label="Minute"
          suffix="'"
          required
          min={1}
          max={match.extra_time ? 120 : 90}
          mb="xs"
        />
        <Select
          {...form.getInputProps("previous_id")}
          label="Player"
          placeholder="Select player"
          required
          data={capOptions}
          renderOption={({ option }) => {
            assertType<CapOption>(option);
            return (
              <Group>
                <MText size="xs" fw="bold">
                  {option.pos}
                </MText>
                <MText size="xs">{option.players.name}</MText>
              </Group>
            );
          }}
          mb="xs"
        />
        <Select
          {...form.getInputProps("player_id")}
          label="Replaced By"
          placeholder="Select player"
          required
          data={replacementOptions}
          renderOption={({ option }) => {
            assertType<ReplacementOption>(option);
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
          required
          mb="xs"
        />
        <Checkbox {...form.getInputProps("injured")} label="Injury" mt="md" />
        <Button type="submit" fullWidth mt="xl">
          Save
        </Button>
      </form>
    </Modal>
  );
};
