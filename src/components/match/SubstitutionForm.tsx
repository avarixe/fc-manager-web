import { Match } from "@/types";
import {
  Button,
  Checkbox,
  LoadingOverlay,
  Modal,
  NumberInput,
  Select,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";

interface SubstituteAttributes {
  start_minute: number;
  previous_id: number | null;
  player_id: number | null;
  pos: number | null;
  injured: boolean;
}

export const SubstitutionForm: React.FC<{
  match: Match;
  opened: boolean;
  onClose: () => void;
  // onSubmit: (substitution: Appearance) => Promise<void>;
}> = ({ match, opened, onClose }) => {
  const form = useForm<SubstituteAttributes>({
    initialValues: {
      start_minute: 1,
      previous_id: null,
      player_id: null,
      pos: null,
      injured: false,
    },
    onValuesChange: (values) => {
      console.log(values);
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
    // await onSubmit(form.values);
    setLoading(false);
    onClose();
  }, [form, onClose]);

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
        <TextInput
          {...form.getInputProps("previous_id")}
          label="Player"
          required
          mb="xs"
        />
        <TextInput
          {...form.getInputProps("player_id")}
          label="Replaced By"
          required
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
