import { Booking, Match } from "@/types";
import {
  Button,
  Group,
  LoadingOverlay,
  Modal,
  NumberInput,
  SegmentedControl,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";

export const BookingForm: React.FC<{
  match: Match;
  record?: Booking;
  opened: boolean;
  onClose: () => void;
  // onSubmit: (booking: Booking) => Promise<void>;
}> = ({ match, record, opened, onClose }) => {
  const form = useForm<Booking>({
    initialValues: {
      minute: record?.minute ?? 1,
      player_name: record?.player_name ?? "",
      home: record?.home ?? true,
      red_card: record?.red_card ?? false,
    },
    onValuesChange: (values) => {
      console.log(values);
    },
  });
  form.watch("home", () => {
    form.setFieldValue("player_name", "");
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
    // await onSubmit(form.values);
    setLoading(false);
    onClose();
  }, [form, onClose]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${record ? "Edit" : "New"} Booking`}
      centered
      closeOnClickOutside={false}
    >
      <LoadingOverlay
        visible={loading}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Group>
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
          <SegmentedControl
            value={form.values.red_card ? "true" : "false"}
            onChange={(value) =>
              form.setFieldValue("red_card", value === "true")
            }
            color={form.values.red_card ? "red" : "yellow"}
            data={[
              { value: "false", label: "Yellow Card" },
              { value: "true", label: "Red Card" },
            ]}
            mb="xs"
          />
        </Group>
        <NumberInput
          {...form.getInputProps("minute")}
          label="Minute"
          suffix="'"
          required
          min={1}
          max={match.extra_time ? 120 : 90}
          mb="xs"
        />
        <TextInput
          {...form.getInputProps("player_name")}
          label="Player"
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
