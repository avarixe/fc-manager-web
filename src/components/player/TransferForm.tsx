import { Transfer } from "@/types";
import {
  ActionIcon,
  Button,
  LoadingOverlay,
  Modal,
  NumberInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";

export const TransferForm: React.FC<{
  record?: Transfer;
  direction: "in" | "out";
  opened: boolean;
  onClose: () => void;
  onSubmit: (transfer: Transfer) => Promise<void>;
}> = ({ record, direction, opened, onClose, onSubmit }) => {
  const team = useAtomValue(teamAtom)!;
  const form = useForm<Transfer>({
    initialValues: {
      signed_on: record?.signed_on ?? null,
      moved_on: record?.moved_on ?? team.currently_on,
      origin: record?.origin ?? (direction === "in" ? "" : team.name),
      destination: record?.destination ?? (direction === "in" ? team.name : ""),
      fee: record?.fee ?? 0,
      addon_clause: record?.addon_clause ?? 0,
    },
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
  }, [form, onSubmit, onClose]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${record ? "Edit" : "New"} Transfer`}
      centered
      closeOnClickOutside={false}
    >
      <LoadingOverlay
        visible={loading}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <DatePickerInput
          {...form.getInputProps("signed_on")}
          label="Signed Date"
          rightSection={
            <ActionIcon
              onClick={() => form.setFieldValue("signed_on", team.currently_on)}
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
          {...form.getInputProps("moved_on")}
          label="Effective Date"
          rightSection={
            <ActionIcon
              onClick={() => form.setFieldValue("moved_on", team.currently_on)}
              variant="transparent"
              color="gray"
            >
              <div className="i-mdi:calendar-arrow-left" />
            </ActionIcon>
          }
          required
          mb="xs"
        />
        <TeamAutocomplete
          {...form.getInputProps("origin")}
          label="Origin"
          required
          disabled={direction === "out"}
          mb="xs"
        />
        <TeamAutocomplete
          {...form.getInputProps("destination")}
          label="Destination"
          required
          disabled={direction === "in"}
          mb="xs"
        />
        <NumberInput
          {...form.getInputProps("fee")}
          label="Fee"
          leftSection={team.currency}
          thousandSeparator
          required
          min={0}
          mb="xs"
        />
        <NumberInput
          {...form.getInputProps("addon_clause")}
          label="Add-On Clause"
          suffix="%"
          min={0}
          mb="xs"
        />
        <Button type="submit" fullWidth mt="xl">
          Save
        </Button>
      </form>
    </Modal>
  );
};
