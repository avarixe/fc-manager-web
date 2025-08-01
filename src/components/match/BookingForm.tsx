import {
  Button,
  Group,
  LoadingOverlay,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";

import { capsAtom, matchAtom, teamAtom } from "@/atoms";
import { RedCardIcon, YellowCardIcon } from "@/components/base/CommonIcons";
import { useMatchState } from "@/hooks/useMatchState";
import { Booking, Cap, ComboboxItem } from "@/types";
import { assertType } from "@/utils/assert";

type CapOption = ComboboxItem<Cap>;

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
  const form = useForm({
    initialValues: {
      timestamp: record?.timestamp ?? new Date().valueOf(),
      minute: record?.minute ?? "",
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
    assertType<Booking>(form.values);
    await onSubmit(form.values);
    setLoading(false);
  }, [form, onSubmit]);

  const { capsAtMinute, inStoppageTime } = useMatchState(
    Number(form.values.minute),
  );
  const caps = useAtomValue(capsAtom);
  const capOptions = useMemo(() => {
    const options = [...capsAtMinute];
    if (record) {
      const recordCap = caps.find(
        (cap) => cap.players.name === record.player_name,
      );
      if (recordCap && capsAtMinute.every((cap) => cap.id !== recordCap.id)) {
        options.push(recordCap);
      }
    }

    return options.map((cap) => ({
      ...cap,
      value: cap.players.name,
      label: `${cap.pos} · ${cap.players.name}`,
    }));
  }, [caps, capsAtMinute, record]);

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
        {inStoppageTime && (
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
          renderOption={({ option }: { option: CapOption }) => {
            return (
              <Group>
                <Text size="xs" fw="bold">
                  {option.pos}
                </Text>
                <Text size="xs">{option.value}</Text>
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
