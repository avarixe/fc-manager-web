import { Injury } from "@/types";
import {
  ActionIcon,
  Button,
  Group,
  LoadingOverlay,
  Modal,
  NumberInput,
  Select,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";

export const InjuryForm: React.FC<{
  record?: Injury;
  opened: boolean;
  onClose: () => void;
  onSubmit: (injury: Injury) => Promise<void>;
}> = ({ record, opened, onClose, onSubmit }) => {
  const team = useAtomValue(teamAtom)!;
  const form = useForm<Injury>({
    initialValues: {
      started_on: record?.started_on ?? team.currently_on,
      ended_on: record?.ended_on ?? "",
      description: record?.description ?? "",
    },
  });

  useEffect(() => {
    if (opened) {
      form.reset();
      if (!record) {
        calculateEndedOn();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const [duration, setDuration] = useState(1);
  const [timespan, setTimespan] = useState("month");
  const calculateEndedOn = useCallback(() => {
    form.setFieldValue(
      "ended_on",
      dayjs(form.values.started_on)
        .add(duration, timespan)
        .format("YYYY-MM-DD"),
    );
  }, [duration, form, timespan]);
  useEffect(() => {
    calculateEndedOn();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, timespan]);

  const [loading, setLoading] = useState(false);
  const handleSubmit = useCallback(async () => {
    if (!form.isValid()) {
      return;
    }

    setLoading(true);
    await onSubmit(form.values);
    setLoading(false);
    onClose();
  }, [form, onSubmit, onClose]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${record ? "Edit" : "New"} Injury`}
      centered
      closeOnClickOutside={false}
      trapFocus
    >
      <LoadingOverlay
        visible={loading}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <DatePickerInput
          {...form.getInputProps("started_on")}
          label="Effective Date"
          rightSection={
            <ActionIcon
              onClick={() =>
                form.setFieldValue("started_on", team.currently_on)
              }
              variant="transparent"
              color="gray"
            >
              <div className="i-mdi:calendar-arrow-left" />
            </ActionIcon>
          }
          required
          mb="xs"
        />
        <DatePickerInput
          {...form.getInputProps("ended_on")}
          label="End Date"
          required
          disabled={!record}
          mb="xs"
        />
        {!record && (
          <Group grow>
            <NumberInput
              value={duration}
              onChange={(value) => setDuration(Number(value))}
              label="Length of Duration"
              required
              min={1}
              mb="xs"
            />
            <Select
              value={timespan}
              onChange={(value) => value && setTimespan(value)}
              label="Timespan"
              data={[
                { label: "Days", value: "day" },
                { label: "Weeks", value: "week" },
                { label: "Months", value: "month" },
              ]}
              required
              mb="xs"
            />
          </Group>
        )}
        <TextInput
          {...form.getInputProps("description")}
          label="Description"
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
