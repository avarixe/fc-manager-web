import { Cap, Booking } from "@/types";
import {
  Button,
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

export const BookingForm: React.FC<{
  record?: Booking;
  opened: boolean;
  onClose: () => void;
  onSubmit: (booking: Booking) => Promise<void>;
}> = ({ record, opened, onClose, onSubmit }) => {
  const submitAndClose = useCallback(
    async (booking: Booking) => {
      await onSubmit(booking);
      onClose();
    },
    [onClose, onSubmit],
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${record ? "Edit" : "New"} Booking`}
      centered
      closeOnClickOutside={false}
      trapFocus
      size="md"
    >
      <BaseBookingForm
        record={record}
        opened={opened}
        onSubmit={submitAndClose}
      />
    </Modal>
  );
};

export const BaseBookingForm: React.FC<{
  record?: Booking;
  prefill?: Partial<Booking>;
  opened: boolean;
  onSubmit: (booking: Booking) => Promise<void>;
}> = ({ record, prefill, opened, onSubmit }) => {
  const form = useForm<Booking>({
    initialValues: {
      timestamp: record?.timestamp ?? new Date().valueOf(),
      minute: record?.minute ?? 1,
      stoppage_time: record?.stoppage_time,
      player_name: record?.player_name ?? prefill?.player_name ?? "",
      home: record?.home ?? prefill?.home ?? true,
      red_card: record?.red_card ?? false,
    },
  });
  form.watch("home", () => {
    form.setFieldValue("player_name", "");
  });
  form.watch("minute", () => {
    form.setFieldValue("stoppage_time", undefined);
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
  }, [form, onSubmit]);

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

  const team = useAtomValue(teamAtom)!;
  const match = useAtomValue(matchAtom)!;
  const isUserGoal = form.values.home
    ? team.name === match.home_team
    : team.name === match.away_team;

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <LoadingOverlay
        visible={loading}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <Group mb="xs">
        {prefill?.home === undefined && (
          <SegmentedControl
            value={form.values.home ? "true" : "false"}
            onChange={(value) => form.setFieldValue("home", value === "true")}
            color={form.values.home ? "cyan" : "teal"}
            data={[
              { value: "true", label: match.home_team },
              { value: "false", label: match.away_team },
            ]}
          />
        )}
        <SegmentedControl
          value={form.values.red_card ? "true" : "false"}
          onChange={(value) => form.setFieldValue("red_card", value === "true")}
          data={[
            { value: "false", label: <YellowCardIcon /> },
            { value: "true", label: <RedCardIcon /> },
          ]}
        />
      </Group>
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
      {prefill?.player_name !== undefined ? null : isUserGoal ? (
        <Select
          {...form.getInputProps("player_name")}
          label="Player"
          placeholder="Select player"
          searchable
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
      ) : (
        <TextInput
          {...form.getInputProps("player_name")}
          label="Player"
          required
          mb="xs"
        />
      )}
      <Button type="submit" fullWidth mt="xl">
        Save
      </Button>
    </form>
  );
};
