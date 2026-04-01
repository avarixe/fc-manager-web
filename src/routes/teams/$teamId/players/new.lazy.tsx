import {
  ActionIcon,
  Autocomplete,
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  Group,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";

import { breadcrumbsAtom, sessionAtom } from "@/atoms";
import { TeamAutocomplete } from "@/components/team/TeamAutocomplete";
import { positions } from "@/constants";
import { countryCodes } from "@/constants/countryCodes";
import { TablesInsert } from "@/database.types";
import { usePlayerCallbacks } from "@/hooks/usePlayerCallbacks";
import { useTeam } from "@/hooks/useTeam";
import { useTeamHelpers } from "@/hooks/useTeamHelpers";
import { Player, Team } from "@/types";
import { formatDate } from "@/utils/format";
import { supabase } from "@/utils/supabase";

export const Route = createLazyFileRoute("/teams/$teamId/players/new")({
  component: NewPlayerPage,
});

function NewPlayerPage() {
  const { teamId } = Route.useParams();
  const { team } = useTeam(teamId);

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Players", to: `/teams/${teamId}/players` },
      { title: "New Player", to: `/teams/${teamId}/players/new` },
    ]);
  }, [setBreadcrumbs, team?.name, teamId]);

  if (!team) {
    return null;
  }

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        New Player
      </Title>

      <PlayerForm team={team} />
    </Stack>
  );
}

const PlayerForm: React.FC<{ team: Team }> = ({ team }) => {
  const { currentYear } = useTeamHelpers(team);

  const session = useAtomValue(sessionAtom)!;
  const form = useForm<
    Omit<TablesInsert<"players">, "history" | "injuries"> &
      Pick<Player, "contracts" | "loans" | "transfers">
  >({
    initialValues: {
      user_id: session.user.id,
      team_id: team.id,
      name: "",
      nationality: "",
      pos: "",
      sec_pos: [],
      ovr: 0,
      value: 0,
      birth_year: 0,
      youth: false,
      kit_no: null,
      contracts: [],
      loans: [],
      transfers: [],
    },
  });
  form.watch("youth", () => {
    form.setFieldValue("transfers", []);
    form.setFieldValue("loans", []);
  });

  const navigate = useNavigate();
  const { updatePlayerStatus } = usePlayerCallbacks();
  const handleSubmit = useCallback(
    async (values: typeof form.values) => {
      const { data, error } = await supabase
        .from("players")
        .insert({
          ...values,
          history: {
            [team.currently_on]: {
              ovr: values.ovr,
              value: values.value,
            },
          },
          injuries: [],
        })
        .select()
        .single();
      if (data) {
        updatePlayerStatus(data, team.currently_on);
        navigate({ to: `/teams/${team.id}/players/${data.id}` });
      } else {
        console.error(error);
      }
    },
    [form, navigate, team.currently_on, team.id, updatePlayerStatus],
  );

  const addContract = useCallback(() => {
    form.setFieldValue("contracts", [
      {
        signed_on: team.currently_on,
        started_on: team.currently_on,
        ended_on: "",
        wage: 0,
        signing_bonus: 0,
        release_clause: 0,
        performance_bonus: 0,
        bonus_req: null,
        bonus_req_type: null,
        conclusion: null,
      },
    ]);
  }, [form, team.currently_on]);

  const [numSeasons, setNumSeasons] = useState(1);
  const { currentSeason } = useTeamHelpers(team);
  useEffect(() => {
    if (!team.started_on || !form.values.contracts.length) {
      return;
    }

    form.setFieldValue(
      "contracts.0.ended_on",
      dayjs(team.started_on)
        .add(numSeasons + currentSeason, "year")
        .format("YYYY-MM-DD"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numSeasons, form.values.contracts.length, team.started_on]);

  const removeContract = useCallback(() => {
    form.setFieldValue("contracts", []);
  }, [form]);

  const addTransfer = useCallback(() => {
    form.setFieldValue("transfers", [
      {
        signed_on: team.currently_on,
        moved_on: team.currently_on,
        origin: "",
        destination: team.name,
        fee: 0,
        addon_clause: 0,
      },
    ]);
  }, [form, team.currently_on, team.name]);

  const removeTransfer = useCallback(() => {
    form.setFieldValue("transfers", []);
  }, [form]);

  const { endOfCurrentSeason } = useTeamHelpers(team);
  const addLoan = useCallback(() => {
    form.setFieldValue("loans", [
      {
        signed_on: team.currently_on,
        started_on: team.currently_on,
        ended_on: endOfCurrentSeason,
        origin: "",
        destination: team.name,
        wage_percentage: 50,
        transfer_fee: null,
        addon_clause: null,
      },
    ]);
  }, [endOfCurrentSeason, form, team.currently_on, team.name]);

  const removeLoan = useCallback(() => {
    form.setFieldValue("loans", []);
  }, [form]);

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        {...form.getInputProps("name")}
        label="Name"
        required
        mb="xs"
        autoCapitalize="words"
      />
      <Group grow>
        <Select
          {...form.getInputProps("pos")}
          label="Position"
          required
          searchable
          mb="xs"
          data={positions}
        />
        <MultiSelect
          {...form.getInputProps("sec_pos")}
          label="Secondary Position(s)"
          searchable
          data={positions}
          mb="xs"
        />
      </Group>
      <Group grow>
        <NumberInput
          {...form.getInputProps("birth_year")}
          label="Age"
          required
          mb="xs"
          min={0}
          max={100}
          value={
            form.values.birth_year ? currentYear - form.values.birth_year : ""
          }
          onChange={(value) => {
            form.setFieldValue(
              "birth_year",
              value ? currentYear - Number(value) : 0,
            );
          }}
        />
        <Autocomplete
          {...form.getInputProps("nationality")}
          label="Nationality"
          required
          mb="xs"
          data={Object.keys(countryCodes)}
        />
      </Group>
      <Group grow>
        <NumberInput
          {...form.getInputProps("ovr")}
          label="Overall Rating"
          required
          mb="xs"
          min={0}
          max={100}
        />
        <NumberInput
          {...form.getInputProps("value")}
          label="Market Value"
          required
          leftSection={team.currency}
          thousandSeparator
          mb="xs"
          min={0}
        />
        <NumberInput
          {...form.getInputProps("kit_no")}
          label="Kit Number"
          mb="xs"
          min={0}
          max={100}
        />
      </Group>
      <Checkbox {...form.getInputProps("youth")} label="Youth Player" mt="md" />
      <Divider my="md" />
      {!form.values.youth &&
        !form.values.transfers.length &&
        !form.values.loans.length && (
          <Group>
            <Button onClick={addTransfer} variant="default">
              Add Transfer
            </Button>
            <Button onClick={addLoan} variant="default">
              Add Loan
            </Button>
          </Group>
        )}

      {/* Transfer section */}
      {form.values.transfers.length > 0 && (
        <Card withBorder bg="transparent" my="md">
          <Group mb="xs">
            <Box>Transfer</Box>
            <ActionIcon
              onClick={removeTransfer}
              variant="subtle"
              color="gray"
              ml="auto"
            >
              <div className="i-mdi:close" />
            </ActionIcon>
          </Group>
          <DatePickerInput
            {...form.getInputProps("transfers.0.signed_on")}
            label="Signed Date"
            required
            mb="xs"
          />
          <DatePickerInput
            {...form.getInputProps("transfers.0.moved_on")}
            label="Effective Date"
            required
            mb="xs"
          />
          <TeamAutocomplete
            {...form.getInputProps("transfers.0.origin")}
            label="Origin"
            required
            mb="xs"
          />
          <NumberInput
            {...form.getInputProps("transfers.0.fee")}
            label="Fee"
            leftSection={team.currency}
            thousandSeparator
            required
            min={0}
            mb="xs"
          />
          <NumberInput
            {...form.getInputProps("transfers.0.addon_clause")}
            label="Add-On Clause"
            suffix="%"
            min={0}
            mb="xs"
          />
        </Card>
      )}

      {/* Loan section */}
      {form.values.loans.length > 0 && (
        <Card withBorder bg="transparent" my="md">
          <Group mb="xs">
            <Box>Loan</Box>
            <ActionIcon
              onClick={removeLoan}
              variant="subtle"
              color="gray"
              ml="auto"
            >
              <div className="i-mdi:close" />
            </ActionIcon>
          </Group>
          <DatePickerInput
            {...form.getInputProps("loans.0.signed_on")}
            label="Signed Date"
            required
            mb="xs"
          />
          <DatePickerInput
            {...form.getInputProps("loans.0.started_on")}
            label="Effective Date"
            required
            mb="xs"
          />
          <DatePickerInput
            {...form.getInputProps("loans.0.ended_on")}
            label="Return Date"
            required
            mb="xs"
          />
          <TeamAutocomplete
            {...form.getInputProps("loans.0.origin")}
            label="Origin"
            required
            mb="xs"
          />
          <NumberInput
            {...form.getInputProps("loans.0.wage_percentage")}
            label="Wage Percentage"
            suffix="%"
            required
            min={0}
            mb="xs"
          />
          <NumberInput
            {...form.getInputProps("loans.0.transfer_fee")}
            label="Transfer Fee"
            leftSection={team.currency}
            thousandSeparator
            min={0}
            mb="xs"
          />
          <NumberInput
            {...form.getInputProps("loans.0.addon_clause")}
            label="Add-On Clause"
            suffix="%"
            min={0}
            mb="xs"
          />
        </Card>
      )}

      {/* Contract section */}
      {form.values.contracts.length > 0 ? (
        <Card withBorder bg="transparent" my="md">
          <Group mb="xs">
            <Box>Contract</Box>
            <ActionIcon
              onClick={removeContract}
              variant="subtle"
              color="gray"
              ml="auto"
            >
              <div className="i-mdi:close" />
            </ActionIcon>
          </Group>
          <DatePickerInput
            {...form.getInputProps("contracts.0.signed_on")}
            label="Signed Date"
            required
            mb="xs"
          />
          <DatePickerInput
            {...form.getInputProps("contracts.0.started_on")}
            label="Effective Date"
            required
            mb="xs"
          />
          <NumberInput
            value={numSeasons}
            onChange={(value) => setNumSeasons(Number(value))}
            label="Number of Seasons"
            description={
              form.values.contracts[0].ended_on
                ? `Ends on ${formatDate(form.values.contracts[0].ended_on)}`
                : null
            }
            required
            min={1}
            mb="xs"
          />
          <NumberInput
            {...form.getInputProps("contracts.0.wage")}
            label="Wage"
            leftSection={team.currency}
            thousandSeparator
            required
            min={0}
            mb="xs"
          />
          <NumberInput
            {...form.getInputProps("contracts.0.signing_bonus")}
            label="Signing Bonus"
            leftSection={team.currency}
            thousandSeparator
            required
            min={0}
            mb="xs"
          />
          <NumberInput
            {...form.getInputProps("contracts.0.release_clause")}
            label="Release Clause"
            leftSection={team.currency}
            thousandSeparator
            min={0}
            mb="xs"
          />
          <NumberInput
            {...form.getInputProps("contracts.0.performance_bonus")}
            label="Performance Bonus"
            leftSection={team.currency}
            thousandSeparator
            min={0}
            mb="xs"
          />
          {form.values.contracts[0].performance_bonus > 0 && (
            <Group grow>
              <NumberInput
                {...form.getInputProps("contracts.0.bonus_req")}
                label="Bonus Requirement"
                required
                min={0}
                mb="xs"
              />
              <Select
                {...form.getInputProps("contracts.0.bonus_req_type")}
                label="Bonus Requirement Type"
                required
                data={["Appearances", "Goals", "Assists", "Clean Sheets"]}
                mb="xs"
              />
            </Group>
          )}
        </Card>
      ) : (
        <Box mt="md">
          <Button onClick={addContract} variant="default">
            Add Contract
          </Button>
        </Box>
      )}

      <Button mt="xl" type="submit">
        Save Player
      </Button>
    </form>
  );
};
