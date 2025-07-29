import {
  Accordion,
  ActionIcon,
  Box,
  Button,
  Divider,
  Group,
  LoadingOverlay,
  Modal,
  NumberInput,
  SegmentedControl,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { isNotEmpty, useField, useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAtom, useSetAtom } from "jotai";
import { cloneDeep, omit } from "lodash-es";
import { useCallback, useEffect, useMemo, useState } from "react";

import { appLoadingAtom, breadcrumbsAtom, competitionAtom } from "@/atoms";
import { BaseIcon } from "@/components/base/CommonIcons";
import { MatchTable } from "@/components/match/MatchTable";
import { TeamAutocomplete } from "@/components/team/TeamAutocomplete";
import { useCompetitionHelpers } from "@/hooks/useCompetitionHelpers";
import { useManageOptions } from "@/hooks/useManageOptions";
import { useTeam } from "@/hooks/useTeam";
import {
  Competition,
  Stage,
  StageFixtureData,
  StageTableRowData,
} from "@/types";
import { assertType } from "@/utils/assert";
import { supabase } from "@/utils/supabase";

interface NewStage extends Stage {
  amount: number;
}

enum StageType {
  Group = "group",
  Knockout = "knockout",
}

export const Route = createLazyFileRoute("/teams/$teamId/competitions/$id/")({
  component: CompetitionPage,
});

function CompetitionPage() {
  const { id, teamId } = Route.useParams();
  const { team, seasonLabel } = useTeam(teamId);

  const [competition, setCompetition] = useAtom(competitionAtom);

  useEffect(() => {
    const fetchCompetition = async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select()
        .eq("team_id", Number(teamId))
        .eq("id", Number(id))
        .single();
      if (error) {
        console.error(error);
      } else {
        assertType<Competition>(data);
        setCompetition(data);
        setReadonly(data.champion !== null);
      }
    };

    fetchCompetition();
  }, [id, setCompetition, teamId]);

  const setAppLoading = useSetAtom(appLoadingAtom);
  const navigate = useNavigate();
  const onClickDelete = useCallback(() => {
    modals.openConfirmModal({
      title: "Delete Competition",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this team? This action cannot be
          undone.
        </Text>
      ),
      labels: {
        confirm: "Delete",
        cancel: "Cancel",
      },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          setAppLoading(true);
          await supabase.from("competitions").delete().eq("id", Number(id));
          navigate({ to: `/teams/${teamId}/competitions/` });
        } catch (error) {
          console.error(error);
        } finally {
          setAppLoading(false);
        }
      },
    });
  }, [id, navigate, setAppLoading, teamId]);

  const [readonly, setReadonly] = useState(false);

  const { groupStages, knockoutStages } = useCompetitionHelpers();
  const categories = useMemo(
    () => [
      {
        value: StageType.Group,
        name: "Group Stages",
        stages: groupStages,
      },
      {
        value: StageType.Knockout,
        name: "Knockout Stages",
        stages: knockoutStages,
      },
    ],
    [knockoutStages, groupStages],
  );

  const onAddStage = useCallback(
    async (stage: NewStage) => {
      if (!competition) {
        return;
      }

      const newStages: Stage[] = [];
      const baseNewStage = omit(stage, "amount");
      if (stage.amount > 1) {
        for (let i = 0; i < stage.amount; i++) {
          newStages.push({
            ...baseNewStage,
            name: `${baseNewStage.name} ${String.fromCharCode(65 + i)}`,
          });
        }
      } else {
        newStages.push(baseNewStage);
      }

      const { data, error } = await supabase
        .from("competitions")
        .update({ stages: [...competition.stages, ...newStages] })
        .eq("id", competition.id)
        .select();
      if (error) {
        console.error(error);
      } else {
        assertType<Competition[]>(data);
        setCompetition(data[0]);
      }
    },
    [competition, setCompetition],
  );

  const onChangeStage = useCallback(
    async (category: StageType, index: number, stage: Stage) => {
      if (!competition) {
        return;
      }

      const newGroupStages = [...groupStages];
      const newKnockoutStages = [...knockoutStages];
      switch (category) {
        case StageType.Group:
          newGroupStages[index] = stage;
          break;
        case StageType.Knockout:
          newKnockoutStages[index] = stage;
      }
      const stages = [...newGroupStages, ...newKnockoutStages];
      const { data, error } = await supabase
        .from("competitions")
        .update({ stages })
        .eq("id", competition.id)
        .select();
      if (error) {
        console.error(error);
      } else {
        assertType<Competition[]>(data);
        setCompetition(data[0]);
      }
    },
    [competition, groupStages, knockoutStages, setCompetition],
  );

  const onDeleteStage = useCallback(
    async (category: StageType, index: number) => {
      if (!competition) {
        return;
      }

      const newGroupStages =
        category === StageType.Group
          ? [...groupStages.slice(0, index), ...groupStages.slice(index + 1)]
          : groupStages;
      const newKnockoutStages =
        category === StageType.Knockout
          ? [
              ...knockoutStages.slice(0, index),
              ...knockoutStages.slice(index + 1),
            ]
          : knockoutStages;
      const stages = [...newGroupStages, ...newKnockoutStages];
      const { data, error } = await supabase
        .from("competitions")
        .update({ stages })
        .eq("id", competition.id)
        .select();
      if (error) {
        console.error(error);
      } else {
        assertType<Competition[]>(data);
        setCompetition(data[0]);
      }
    },
    [competition, groupStages, knockoutStages, setCompetition],
  );

  const [addStageOpened, { open: openAddStage, close: closeAddStage }] =
    useDisclosure();

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Competitions", to: `/teams/${teamId}/competitions` },
      {
        title: competition?.name ?? "",
        to: `/teams/${teamId}/competitions/${id}`,
      },
    ]);
  }, [competition?.name, id, setBreadcrumbs, team?.name, teamId]);

  if (!team || !competition) {
    return null;
  }

  return (
    <Stack>
      <Box mb="xl">
        <Title order={5}>{seasonLabel(competition.season)}</Title>
        <Title fw="lighter">{competition.name}</Title>
        {competition.champion && (
          <Group gap={4}>
            <Box className="i-mdi:trophy text-amber mr-1" />
            {competition.champion}
            <Box className="i-mdi:trophy text-amber ml-1" />
          </Group>
        )}
      </Box>
      <Switch
        label="Readonly Mode"
        checked={readonly}
        onChange={(event) => setReadonly(event.currentTarget.checked)}
      />
      {!readonly && (
        <Group>
          <Button
            component={Link}
            to={`/teams/${team.id}/competitions/${id}/edit`}
          >
            Edit
          </Button>
          <AddStageModal
            opened={addStageOpened}
            onClose={closeAddStage}
            onAdd={onAddStage}
          />
          <Button onClick={openAddStage} variant="outline">
            Add Stage
          </Button>
          <Button
            onClick={onClickDelete}
            variant="outline"
            color="red"
            className="ml-auto"
          >
            Delete
          </Button>
        </Group>
      )}

      <Box my="lg">
        <Title order={2}>
          <Group>
            <BaseIcon name="i-mdi:table" />
            Stages
          </Group>
        </Title>
        <Divider my="xs" />

        <Accordion
          key={competition.id}
          defaultValue={[StageType.Group, StageType.Knockout]}
          multiple
        >
          {categories.map((category, i) => (
            <Accordion.Item
              key={i}
              value={category.value}
              hidden={category.stages.length === 0}
            >
              <Accordion.Control>{category.name}</Accordion.Control>
              <Accordion.Panel>
                {category.stages.map((stage, j) => (
                  <StageItem
                    key={j}
                    stage={stage}
                    stageIndex={j}
                    type={category.value}
                    readonly={readonly}
                    onChange={(newStage) =>
                      onChangeStage(category.value, j, newStage)
                    }
                    onDelete={() => onDeleteStage(category.value, j)}
                  />
                ))}
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Box>

      <Box my="lg">
        <Title order={2}>
          <Group>
            <BaseIcon name="i-mdi:soccer-field" />
            Matches
          </Group>
        </Title>
        <Divider my="xs" />

        <MatchTable
          filters={{
            competition: competition.name,
            season: String(competition.season),
          }}
        />
      </Box>
    </Stack>
  );
}

const AddStageModal: React.FC<{
  opened: boolean;
  onClose: () => void;
  onAdd: (stage: NewStage) => Promise<void>;
}> = ({ opened, onClose, onAdd }) => {
  const form = useForm<NewStage>({
    // mode: "uncontrolled",
    initialValues: {
      name: "",
      table: [],
      fixtures: [],
      amount: 1,
    },
    validate: {
      name: isNotEmpty(),
    },
  });

  const [type, setType] = useState<string>(StageType.Group);
  const [numTeams, setNumTeams] = useState(2);
  const [numLegs, setNumLegs] = useState(1);
  useEffect(() => {
    switch (type) {
      case StageType.Group:
        form.setFieldValue("fixtures", []);
        form.setFieldValue(
          "table",
          Array(numTeams).fill({
            team: "",
            w: 0,
            d: 0,
            l: 0,
            gf: 0,
            ga: 0,
            pts: 0,
          }),
        );
        break;
      case StageType.Knockout:
        form.setFieldValue("table", []);
        form.setFieldValue("amount", 1);
        form.setFieldValue(
          "fixtures",
          Array(Math.ceil(numTeams / 2)).fill({
            home_team: "",
            away_team: "",
            legs: Array(numLegs).fill({
              home_score: "",
              away_score: "",
            }),
          }),
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numLegs, numTeams, type]);

  useEffect(() => {
    if (opened) {
      form.reset();
      setType(StageType.Group);
      setNumTeams(2);
      setNumLegs(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const [loading, setLoading] = useState(false);
  const handleSubmit = useCallback(async () => {
    if (!form.isValid()) {
      return;
    }

    setLoading(true);
    await onAdd(form.values);
    setLoading(false);
    onClose();
  }, [form, onAdd, onClose]);

  const preview = useMemo(() => {
    if (
      type === StageType.Group &&
      form.values.name &&
      form.values.amount > 1
    ) {
      return `Creates ${form.values.name} A, ${form.values.name} B, etc.`;
    } else {
      return null;
    }
  }, [form.values.amount, form.values.name, type]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add Stage"
      centered
      closeOnClickOutside={false}
      trapFocus
    >
      <LoadingOverlay
        visible={loading}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          {...form.getInputProps("name")}
          label="Name"
          required
          mb="xs"
        />
        <NumberInput
          value={numTeams}
          onChange={(value) => setNumTeams(Number(value))}
          label="Number of Teams"
          required
          min={2}
          mb="xs"
        />
        <SegmentedControl
          value={type}
          onChange={setType}
          data={[
            { label: "Group", value: StageType.Group },
            { label: "Knockout", value: StageType.Knockout },
          ]}
          mb="xs"
        />
        {type === StageType.Knockout ? (
          <NumberInput
            value={numLegs}
            onChange={(value) => setNumLegs(Number(value))}
            label="Number of Legs"
            required
            min={2}
            mb="xs"
          />
        ) : (
          <NumberInput
            {...form.getInputProps("amount")}
            label="Batch Amount"
            description={preview}
            required
            min={1}
            mb="xs"
          />
        )}
        <Button type="submit" fullWidth mt="xl">
          Add
        </Button>
      </form>
    </Modal>
  );
};

const StageItem: React.FC<{
  stage: Stage;
  stageIndex: number;
  type: StageType;
  readonly: boolean;
  onChange: (stage: Stage) => Promise<void>;
  onDelete: () => Promise<void>;
}> = ({ stage, stageIndex, type, readonly, onChange, onDelete }) => {
  const field = useField({
    initialValue: stage.name,
    validateOnChange: true,
    validate: isNotEmpty(),
  });

  const [isEditing, setIsEditing] = useState(false);
  useEffect(() => {
    if (readonly) {
      setIsEditing(false);
    }
  }, [readonly]);

  const [table, setTable] = useState<StageTableRowData[]>(
    cloneDeep(stage.table),
  );
  const [fixtures, setFixtures] = useState<StageFixtureData[]>(
    cloneDeep(stage.fixtures),
  );
  useEffect(() => {
    setTable(cloneDeep(stage.table));
    setFixtures(cloneDeep(stage.fixtures));
  }, [stage.fixtures, stage.table]);

  const [loading, setLoading] = useState(false);
  const { saveTeamOptions } = useManageOptions();
  const onClickSave = async () => {
    if (field.error) {
      return;
    }

    setLoading(true);
    try {
      await onChange({
        ...stage,
        name: field.getValue(),
        table,
        fixtures,
      });
      saveTeamOptions([
        ...table.filter((row) => row.team?.length).map((row) => row.team),
        ...fixtures
          .filter((fixture) => fixture.home_team?.length)
          .map((fixture) => fixture.home_team),
        ...fixtures
          .filter((fixture) => fixture.away_team?.length)
          .map((fixture) => fixture.away_team),
      ]);
    } finally {
      setIsEditing(false);
      setLoading(false);
    }
  };

  const onClickCancel = () => {
    field.reset();
    setTable(cloneDeep(stage.table));
    setFixtures(cloneDeep(stage.fixtures));
    setIsEditing(false);
  };

  const onClickDelete = () => {
    modals.openConfirmModal({
      title: `Delete Stage: ${stage.name}`,
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this stage? This action cannot be
          undone.
        </Text>
      ),
      labels: {
        confirm: "Delete",
        cancel: "Cancel",
      },
      confirmProps: { color: "red" },
      onConfirm: async () => await onDelete(),
    });
  };

  return (
    <Box pos="relative" my="md">
      <LoadingOverlay
        visible={loading}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <Group>
        <TextInput
          {...field.getInputProps()}
          disabled={!isEditing}
          style={{ flexGrow: 1 }}
        />
        {readonly ? null : isEditing ? (
          <>
            <ActionIcon onClick={onClickCancel} variant="subtle">
              <div className="i-mdi:close" />
            </ActionIcon>
            <ActionIcon
              onClick={onClickSave}
              disabled={!!field.error}
              variant="subtle"
            >
              <div className="i-mdi:content-save" />
            </ActionIcon>
          </>
        ) : (
          <>
            <ActionIcon onClick={() => setIsEditing(true)} variant="subtle">
              <div className="i-mdi:pencil" />
            </ActionIcon>
            <ActionIcon onClick={onClickDelete} variant="subtle">
              <div className="i-mdi:delete" />
            </ActionIcon>
          </>
        )}
      </Group>
      {type === StageType.Group ? (
        <StageTable table={table} isEditing={isEditing} onChange={setTable} />
      ) : (
        <StageFixtures
          fixtures={fixtures}
          stageIndex={stageIndex}
          isEditing={isEditing}
          onChange={setFixtures}
        />
      )}
    </Box>
  );
};

const StageTable: React.FC<{
  table: StageTableRowData[];
  isEditing: boolean;
  onChange: (table: StageTableRowData[]) => void;
}> = ({ table, isEditing, onChange }) => {
  const onChangeRow = (index: number, row: StageTableRowData) => {
    const newTable = [...table];
    newTable[index] = row;
    onChange(newTable);
  };

  const onClickAddRow = () => {
    onChange([...table, { team: "", w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }]);
  };

  const onClickRemoveRow = () => {
    onChange(table.slice(0, -1));
  };

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th className="w-10"></Table.Th>
            <Table.Th className="w-min-45">Team</Table.Th>
            <Table.Th className="text-right w-20">W</Table.Th>
            <Table.Th className="text-right w-20">D</Table.Th>
            <Table.Th className="text-right w-20">L</Table.Th>
            <Table.Th className="text-right w-20">GF</Table.Th>
            <Table.Th className="text-right w-20">GA</Table.Th>
            <Table.Th className="text-right w-12">GD</Table.Th>
            <Table.Th className="text-right w-12">PTS</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {table.map((row, j) => (
            <StageTableRow
              key={j}
              row={row}
              isEditing={isEditing}
              index={j + 1}
              onChange={(row) => onChangeRow(j, row)}
            />
          ))}
        </Table.Tbody>
      </Table>
      {isEditing && (
        <Group>
          <Button onClick={onClickAddRow} variant="default" size="xs">
            Add Row
          </Button>
          <Button onClick={onClickRemoveRow} variant="default" size="xs">
            Remove Row
          </Button>
        </Group>
      )}
    </Table.ScrollContainer>
  );
};

const StageTableRow: React.FC<{
  row: StageTableRowData;
  isEditing: boolean;
  index: number;
  onChange: (row: StageTableRowData) => void;
}> = ({ row, isEditing, index, onChange }) => {
  const form = useForm({
    initialValues: {
      team: row.team ?? "",
      w: row.w,
      d: row.d,
      l: row.l,
      gf: row.gf,
      ga: row.ga,
      pts: row.pts,
    },
    onValuesChange: (values) => {
      if (form.isDirty()) {
        onChange(values);
      }
    },
  });
  form.watch("w", ({ value: w }) => {
    form.setFieldValue("pts", w * 3 + form.values.d);
  });
  form.watch("d", ({ value: d }) => {
    form.setFieldValue("pts", form.values.w * 3 + d);
  });

  useEffect(() => {
    if (!isEditing) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  useEffect(() => {
    form.setValues({
      team: row.team ?? "",
      w: row.w,
      d: row.d,
      l: row.l,
      gf: row.gf,
      ga: row.ga,
      pts: row.pts,
    });
    form.resetDirty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row]);

  const { getTeamColor } = useCompetitionHelpers();
  const statField = (key: keyof StageTableRowData) => (
    <NumberInput
      {...form.getInputProps(key)}
      size="xs"
      min={0}
      variant={isEditing ? "default" : "unstyled"}
      hideControls
      readOnly={!isEditing}
      classNames={{
        input: ["text-right", getTeamColor(form.values.team)].join(" "),
      }}
    />
  );

  return (
    <Table.Tr className={getTeamColor(form.values.team)}>
      <Table.Td ta="center">{index}</Table.Td>
      <Table.Td>
        <TeamAutocomplete
          {...form.getInputProps("team")}
          size="xs"
          variant={isEditing ? "default" : "unstyled"}
          readOnly={!isEditing}
          classNames={{ input: getTeamColor(form.values.team) }}
        />
      </Table.Td>
      <Table.Td>{statField("w")}</Table.Td>
      <Table.Td>{statField("d")}</Table.Td>
      <Table.Td>{statField("l")}</Table.Td>
      <Table.Td>{statField("gf")}</Table.Td>
      <Table.Td>{statField("ga")}</Table.Td>
      <Table.Td>
        <Text size="xs" ta="right">
          {form.values.gf - form.values.ga}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="xs" ta="right">
          {form.values.pts}
        </Text>
      </Table.Td>
    </Table.Tr>
  );
};

const StageFixtures: React.FC<{
  fixtures: StageFixtureData[];
  stageIndex: number;
  isEditing: boolean;
  onChange: (fixtures: StageFixtureData[]) => void;
}> = ({ fixtures, stageIndex, isEditing, onChange }) => {
  const onChangeFixture = (index: number, fixture: StageFixtureData) => {
    const newFixtures = [...fixtures];
    newFixtures[index] = fixture;
    onChange(newFixtures);
  };

  const onClickAddFixture = () => {
    onChange([
      ...fixtures,
      {
        home_team: "",
        away_team: "",
        legs: [{ home_score: "", away_score: "" }],
      },
    ]);
  };

  const onClickRemoveFixture = () => {
    onChange(fixtures.slice(0, -1));
  };

  return (
    <Table.ScrollContainer minWidth={600}>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th ta="right" className="w-2/5">
              Home Team
            </Table.Th>
            <Table.Th ta="center" className="w-1/5">
              Score
            </Table.Th>
            <Table.Th ta="left" className="w-2/5">
              Away Team
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {fixtures.map((fixture, j) => (
            <StageFixtureRow
              key={j}
              fixture={fixture}
              stageIndex={stageIndex}
              isEditing={isEditing}
              onChange={(fixture) => onChangeFixture(j, fixture)}
            />
          ))}
        </Table.Tbody>
      </Table>
      {isEditing && (
        <Group>
          <Button onClick={onClickAddFixture} variant="default" size="xs">
            Add Fixture
          </Button>
          <Button onClick={onClickRemoveFixture} variant="default" size="xs">
            Remove Fixture
          </Button>
        </Group>
      )}
    </Table.ScrollContainer>
  );
};

const StageFixtureRow: React.FC<{
  fixture: StageFixtureData;
  stageIndex: number;
  isEditing: boolean;
  onChange: (fixture: StageFixtureData) => void;
}> = ({ fixture, stageIndex, isEditing, onChange }) => {
  const form = useForm({
    initialValues: {
      home_team: fixture.home_team ?? "",
      away_team: fixture.away_team ?? "",
      legs: fixture.legs.map((leg) => ({
        home_score: leg.home_score ?? "",
        away_score: leg.away_score ?? "",
      })),
    },
    onValuesChange: (values) => {
      if (form.isDirty()) {
        onChange(values);
      }
    },
  });

  useEffect(() => {
    if (!isEditing) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  useEffect(() => {
    form.setValues({
      home_team: fixture.home_team ?? "",
      away_team: fixture.away_team ?? "",
      legs: fixture.legs.map((leg) => ({
        home_score: leg.home_score ?? "",
        away_score: leg.away_score ?? "",
      })),
    });
    form.resetDirty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixture]);

  const onClickAddLeg = () => {
    form.setFieldValue("legs", [
      ...form.values.legs,
      { home_score: "", away_score: "" },
    ]);
  };

  const onClickRemoveLeg = () => {
    if (form.values.legs.length > 1) {
      form.setFieldValue("legs", form.values.legs.slice(0, -1));
    }
  };

  const { getTeamColor, scoreDiff, teamsFromPrevousStage } =
    useCompetitionHelpers();
  const teamOptions = useMemo(
    () => teamsFromPrevousStage(stageIndex),
    [stageIndex, teamsFromPrevousStage],
  );
  return (
    <Table.Tr>
      <Table.Td align="right">
        <TeamAutocomplete
          {...form.getInputProps("home_team")}
          data={teamOptions}
          size="xs"
          variant={isEditing ? "default" : "unstyled"}
          readOnly={!isEditing}
          classNames={{
            input: [
              "text-right",
              scoreDiff(fixture) > 0 ? "font-extrabold" : undefined,
              getTeamColor(fixture.home_team),
            ].join(" "),
          }}
        />
      </Table.Td>
      <Table.Td align="center">
        {form.values.legs.map((_leg, k) => (
          <Group
            key={k}
            justify="center"
            mt={k === 0 || !isEditing ? undefined : "xs"}
          >
            <TextInput
              {...form.getInputProps(`legs.${k}.home_score`)}
              key={form.key(`legs.${k}.home_score`)}
              size="xs"
              variant={isEditing ? "default" : "unstyled"}
              readOnly={!isEditing}
              classNames={{
                input: [
                  "w-12 text-right",
                  scoreDiff(fixture) > 0 ? "font-extrabold" : undefined,
                  getTeamColor(fixture.home_team),
                ].join(" "),
              }}
            />
            <Text size="xs">-</Text>
            <TextInput
              {...form.getInputProps(`legs.${k}.away_score`)}
              key={form.key(`legs.${k}.away_score`)}
              size="xs"
              variant={isEditing ? "default" : "unstyled"}
              readOnly={!isEditing}
              classNames={{
                input: [
                  "w-12",
                  scoreDiff(fixture) < 0 ? "font-extrabold" : undefined,
                  getTeamColor(fixture.away_team),
                ].join(" "),
              }}
            />
          </Group>
        ))}
        {isEditing && (
          <Group justify="center" mt="xs">
            <ActionIcon onClick={onClickAddLeg} variant="default" size="xs">
              <div className="i-mdi:plus" />
            </ActionIcon>
            <ActionIcon
              onClick={onClickRemoveLeg}
              variant="default"
              size="xs"
              disabled={form.values.legs.length < 2}
            >
              <div className="i-mdi:minus" />
            </ActionIcon>
          </Group>
        )}
      </Table.Td>
      <Table.Td align="left">
        <TeamAutocomplete
          {...form.getInputProps("away_team")}
          data={teamOptions}
          size="xs"
          variant={isEditing ? "default" : "unstyled"}
          readOnly={!isEditing}
          classNames={{
            input: [
              scoreDiff(fixture) < 0 ? "font-extrabold" : undefined,
              getTeamColor(fixture.away_team),
            ].join(" "),
          }}
        />
      </Table.Td>
    </Table.Tr>
  );
};
