import {
  Button,
  Group,
  LoadingOverlay,
  Modal,
  NumberInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";

import { matchAtom } from "@/atoms";
import { Match } from "@/types";

export const PenaltyShootoutForm: React.FC<{
  opened: boolean;
  onClose: () => void;
  onSubmit: (changes: Partial<Match>) => Promise<void>;
}> = ({ opened, onClose, onSubmit }) => {
  const match = useAtomValue(matchAtom)!;
  const form = useForm({
    initialValues: {
      home_penalty_score: match.home_penalty_score,
      away_penalty_score: match.away_penalty_score,
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
  }, [form, onClose, onSubmit]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Penalty Shootout"
      centered
      closeOnClickOutside={false}
      trapFocus
    >
      <LoadingOverlay
        visible={loading}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Group grow>
          <NumberInput
            {...form.getInputProps("home_penalty_score")}
            label={match.home_team}
            required
            min={0}
            mb="xs"
          />
          <NumberInput
            {...form.getInputProps("away_penalty_score")}
            label={match.away_team}
            required
            min={0}
            mb="xs"
          />
        </Group>
        <Button type="submit" fullWidth mt="xl">
          Save
        </Button>
      </form>
    </Modal>
  );
};
