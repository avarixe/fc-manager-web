import { Cap, Change, Player } from "@/types";
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

export const ChangeForm: React.FC<{
  record?: Change;
  opened: boolean;
  onClose: () => void;
  playerOptions: PlayerOption[];
  onSubmit: (change: Change) => Promise<void>;
}> = ({ record, opened, onClose, onSubmit, playerOptions }) => {
  const form = useForm({
    initialValues: {
      minute: record?.minute ?? 1,
      stoppage_time: record?.stoppage_time,
      injured: record?.injured ?? false,
      out: {
        name: record?.out?.name ?? "",
        pos: record?.out?.pos ?? "",
      },
      in: {
        name: record?.in?.name ?? "",
        pos: record?.in?.pos ?? "",
      },
    },
    validate: {
      out: {
        name: isNotEmpty("Player"),
        pos: isNotEmpty("Position"),
      },
      in: {
        name: isNotEmpty("Replaced By"),
        pos: isNotEmpty("Position"),
      },
    },
  });
  form.watch("minute", () => {
    form.setFieldValue("stoppage_time", undefined);
  });
  form.watch("out.name", ({ value }) => {
    const playerCap = capsAtMinute.find((cap) => cap.players.name === value);

    if (playerCap) {
      form.setFieldValue("out.pos", playerCap.pos);
      form.setFieldValue("in.pos", playerCap.pos);
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

    setLoading(true);
    await onSubmit(form.values);
    setLoading(false);
    onClose();
  }, [form, onClose, onSubmit]);

  const { capsAtMinute } = useMatchState(form.values.minute);
  const capOptions = useMemo(
    () =>
      capsAtMinute.map((cap) => ({
        ...cap,
        value: cap.players.name,
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
          value: player.name,
          label: `${player.pos} · ${player.name}`,
        })),
    [playerOptions],
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${record ? "Edit" : "New"} Formation Change`}
      centered
      closeOnClickOutside={false}
      trapFocus
    >
      <LoadingOverlay
        visible={loading}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Group grow mb="xs">
          <NumberInput
            {...form.getInputProps("minute")}
            label="Minute"
            suffix="'"
            required
            min={1}
            max={match.extra_time ? 120 : 90}
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
        <Select
          {...form.getInputProps("out.name")}
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
          {...form.getInputProps("in.name")}
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
          {...form.getInputProps("in.pos")}
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
