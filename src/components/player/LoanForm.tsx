import {
  ActionIcon,
  Button,
  LoadingOverlay,
  Modal,
  NumberInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";

import { teamAtom } from "@/atoms";
import { TeamAutocomplete } from "@/components/team/TeamAutocomplete";
import { useManageOptions } from "@/hooks/useManageOptions";
import { useTeamHelpers } from "@/hooks/useTeamHelpers";
import { Loan } from "@/types";

export const LoanForm: React.FC<{
  record?: Loan;
  direction: "in" | "out";
  opened: boolean;
  onClose: () => void;
  onSubmit: (contract: Loan) => Promise<void>;
}> = ({ record, direction, opened, onClose, onSubmit }) => {
  const team = useAtomValue(teamAtom)!;
  const { endOfCurrentSeason } = useTeamHelpers(team);
  const form = useForm<Loan>({
    initialValues: {
      signed_on: record?.signed_on ?? "",
      started_on: record?.started_on ?? team.currently_on,
      ended_on: record?.ended_on ?? endOfCurrentSeason,
      origin: record?.origin ?? (direction === "in" ? "" : team.name),
      destination: record?.destination ?? (direction === "in" ? team.name : ""),
      wage_percentage: record?.wage_percentage ?? 50,
      transfer_fee: record?.transfer_fee ?? null,
      addon_clause: record?.addon_clause ?? null,
    },
  });

  useEffect(() => {
    if (opened) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const [loading, setLoading] = useState(false);
  const { saveTeamOptions } = useManageOptions();
  const handleSubmit = useCallback(async () => {
    if (!form.isValid()) {
      return;
    }

    setLoading(true);
    await onSubmit(form.values);
    saveTeamOptions([form.values.origin, form.values.destination]);
    setLoading(false);
    onClose();
  }, [form, onSubmit, saveTeamOptions, onClose]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${record ? "Edit" : "New"} Loan`}
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
        <DatePickerInput
          {...form.getInputProps("ended_on")}
          label="Return Date"
          rightSection={
            <ActionIcon
              onClick={() => form.setFieldValue("ended_on", team.currently_on)}
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
          {...form.getInputProps("wage_percentage")}
          label="Wage Percentage"
          suffix="%"
          required
          min={0}
          mb="xs"
        />
        <NumberInput
          {...form.getInputProps("transfer_fee")}
          label="Transfer Fee"
          leftSection={team.currency}
          thousandSeparator
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
