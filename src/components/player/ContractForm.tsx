import { Contract } from "@/types";
import {
  ActionIcon,
  Button,
  Group,
  LoadingOverlay,
  Modal,
  NumberInput,
  Select,
} from "@mantine/core";
import { useForm } from "@mantine/form";

export const ContractForm: React.FC<{
  record?: Contract;
  opened: boolean;
  onClose: () => void;
  onSubmit: (contract: Contract) => Promise<void>;
}> = ({ record, opened, onClose, onSubmit }) => {
  const form = useForm<Contract>({
    initialValues: {
      signed_on: record?.signed_on ?? "",
      started_on: record?.started_on ?? "",
      ended_on: record?.ended_on ?? "",
      wage: record?.wage ?? 0,
      signing_bonus: record?.signing_bonus ?? 0,
      release_clause: record?.release_clause ?? 0,
      performance_bonus: record?.performance_bonus ?? 0,
      bonus_req: record?.bonus_req ?? null,
      bonus_req_type: record?.bonus_req_type ?? null,
      conclusion: record?.conclusion ?? null,
    },
  });
  form.watch("performance_bonus", ({ value }) => {
    if (value === 0) {
      form.setFieldValue("bonus_req", null);
      form.setFieldValue("bonus_req_type", null);
    } else {
      form.setFieldValue("bonus_req", 0);
      form.setFieldValue("bonus_req_type", "Appearances");
    }
  });

  useEffect(() => {
    if (opened) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const [numSeasons, setNumSeasons] = useState(1);
  const team = useAtomValue(teamAtom)!;
  const { currentSeason } = useTeamHelpers(team);
  useEffect(() => {
    form.setFieldValue(
      "ended_on",
      dayjs(team.started_on)
        .add(numSeasons + currentSeason, "year")
        .format("YYYY-MM-DD"),
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.started_on, numSeasons]);

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
      title={`${record ? "Edit" : "New"} Contract`}
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
        {record ? (
          <DatePickerInput
            {...form.getInputProps("ended_on")}
            label="End Date"
            required
            mb="xs"
          />
        ) : (
          <NumberInput
            value={numSeasons}
            onChange={(value) => setNumSeasons(Number(value))}
            label="Number of Seasons"
            description={
              form.values.ended_on
                ? `Ends on ${formatDate(form.values.ended_on)}`
                : null
            }
            required
            min={1}
            mb="xs"
          />
        )}
        <NumberInput
          {...form.getInputProps("wage")}
          label="Wage"
          leftSection={team.currency}
          thousandSeparator
          required
          min={0}
          mb="xs"
        />
        <NumberInput
          {...form.getInputProps("signing_bonus")}
          label="Signing Bonus"
          leftSection={team.currency}
          thousandSeparator
          required
          min={0}
          mb="xs"
        />
        <NumberInput
          {...form.getInputProps("release_clause")}
          label="Release Clause"
          leftSection={team.currency}
          thousandSeparator
          min={0}
          mb="xs"
        />
        <NumberInput
          {...form.getInputProps("performance_bonus")}
          label="Performance Bonus"
          leftSection={team.currency}
          thousandSeparator
          min={0}
          mb="xs"
        />
        {form.values.performance_bonus > 0 && (
          <Group grow>
            <NumberInput
              {...form.getInputProps("bonus_req")}
              label="Bonus Requirement"
              required
              min={0}
              mb="xs"
            />
            <Select
              {...form.getInputProps("bonus_req_type")}
              label="Bonus Requirement Type"
              required
              data={["Appearances", "Goals", "Assists", "Clean Sheets"]}
              mb="xs"
            />
          </Group>
        )}
        <Button type="submit" fullWidth mt="xl">
          Save
        </Button>
      </form>
    </Modal>
  );
};
