import { Cap, Goal } from "@/types";
import {
  Button,
  Checkbox,
  ComboboxItem,
  Group,
  LoadingOverlay,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";

type CapOption = ComboboxItem & Cap;

export const GoalForm: React.FC<{
  record?: Goal;
  opened: boolean;
  onClose: () => void;
  onSubmit: (goal: Goal) => Promise<void>;
}> = ({ record, opened, onClose, onSubmit }) => {
  const form = useForm<Goal>({
    initialValues: {
      minute: record?.minute ?? 1,
      player_name: record?.player_name ?? "",
      assisted_by: record?.assisted_by ?? null,
      home: record?.home ?? true,
      set_piece: record?.set_piece ?? null,
      own_goal: record?.own_goal ?? false,
    },
  });
  form.watch("home", () => {
    form.setFieldValue("player_name", "");
    form.setFieldValue("assisted_by", null);
  });
  form.watch("player_name", ({ value }) => {
    if (value === form.values.assisted_by) {
      form.setFieldValue("assisted_by", null);
    }
  });
  form.watch("own_goal", ({ value }) => {
    if (value) {
      form.setFieldValue("assisted_by", null);
      form.setFieldValue("set_piece", null);
    }
  });
  form.watch("set_piece", ({ value }) => {
    if (value === "PK" || value === "FK") {
      form.setFieldValue("assisted_by", null);
      form.setFieldValue("own_goal", false);
    }
  });

  useEffect(() => {
    if (opened) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const [loading, setLoading] = useState(false);
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
  const assistedByOptions = useMemo(
    () => capOptions.filter((cap) => cap.value !== form.values.player_name),
    [capOptions, form.values.player_name],
  );

  const team = useAtomValue(teamAtom)!;
  const match = useAtomValue(matchAtom)!;
  const isUserGoal = form.values.home
    ? team.name === match.home_team
    : team.name === match.away_team;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${record ? "Edit" : "New"} Goal`}
      centered
      closeOnClickOutside={false}
      trapFocus
    >
      <LoadingOverlay
        visible={loading}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <SegmentedControl
          value={form.values.home ? "true" : "false"}
          onChange={(value) => form.setFieldValue("home", value === "true")}
          color={form.values.home ? "cyan" : "teal"}
          data={[
            { value: "true", label: match.home_team },
            { value: "false", label: match.away_team },
          ]}
          mb="xs"
        />
        <NumberInput
          {...form.getInputProps("minute")}
          label="Minute"
          suffix="'"
          required
          min={1}
          max={match.extra_time ? 120 : 90}
          mb="xs"
        />
        {isUserGoal ? (
          <>
            <Select
              {...form.getInputProps("player_name")}
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
                    <MText size="xs">{option.value}</MText>
                  </Group>
                );
              }}
              mb="xs"
            />
            <Select
              {...form.getInputProps("assisted_by")}
              label="Assisted By"
              placeholder="Select player"
              data={assistedByOptions}
              renderOption={({ option }) => {
                assertType<CapOption>(option);
                return (
                  <Group>
                    <MText size="xs" fw="bold">
                      {option.pos}
                    </MText>
                    <MText size="xs">{option.value}</MText>
                  </Group>
                );
              }}
              mb="xs"
            />
          </>
        ) : (
          <>
            <TextInput
              {...form.getInputProps("player_name")}
              label="Player"
              required
              mb="xs"
            />
            <TextInput
              {...form.getInputProps("assisted_by")}
              label="Assisted By"
              mb="xs"
            />
          </>
        )}
        <Select
          {...form.getInputProps("set_piece")}
          label="Set Piece"
          data={[
            { value: "PK", label: "Penalty Kick" },
            { value: "CK", label: "Corner Kick" },
            { value: "DFK", label: "Direct Free Kick" },
            { value: "IFK", label: "Indirect Free Kick" },
          ]}
          clearable
          mb="xs"
        />
        <Checkbox
          checked={form.values.own_goal}
          {...form.getInputProps("own_goal")}
          label="Own Goal"
          mt="md"
        />
        <Button type="submit" fullWidth mt="xl">
          Save
        </Button>
      </form>
    </Modal>
  );
};
