import { Tables } from '@/database-generated.types'
import { Accordion, ActionIcon, Box, Button, Group, LoadingOverlay, NumberInput, Switch, Table, TextInput, Title } from '@mantine/core'
import { isNotEmpty, useField, useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { cloneDeep } from 'lodash-es';

interface Competition extends Tables<'competitions'> {
  stages: {
    name: string;
    table: {
      team: string;
      w: number;
      d: number;
      l: number;
      gf: number;
      ga: number;
      pts: number;
    }[];
    fixtures: {
      homeTeam: string;
      awayTeam: string;
      legs: {
        homeScore: string;
        awayScore: string;
      }[];
    }[];
  }[]
}

type Stage = Competition['stages'][number]
type StageTableRowData = Stage['table'][number]
type StageFixtureData = Stage['fixtures'][number]

enum StageType {
  Group = 'group',
  Knockout = 'knockout',
}

export const Route = createLazyFileRoute('/teams/$teamId/competitions/$id/')({
  component: CompetitionPage,
})

function CompetitionPage() {
  const { id, teamId } = Route.useParams()
  const { team, seasonLabel } = useTeam(teamId)

  const [competition, setCompetition] = useState<Competition | null>(null)
  const supabase = useAtomValue(supabaseAtom)
  useEffect(() => {
    const fetchCompetition = async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select()
        .eq('teamId', teamId)
        .eq('id', id)
      if (error) {
        console.error(error)
      } else {
        assertType<Competition[]>(data)
        setCompetition(data[0])
      }
    }

    fetchCompetition()
  }, [id, supabase, teamId])

  const groupStages = useMemo(() => (
    competition?.stages?.filter(stage => stage.table.length > 0) ?? []
  ), [competition])

  const knockoutStages = useMemo(() => (
    competition?.stages?.filter(stage => stage.fixtures.length > 0) ?? []
  ), [competition])

  const [readonly, setReadonly] = useState(false)

  const categories = useMemo(() => ([
    {
      value: StageType.Group,
      name: 'Group Stages',
      stages: groupStages
    },
    {
      value: StageType.Knockout,
      name: 'Knockout Stages',
      stages: knockoutStages
    }
  ]), [knockoutStages, groupStages])

  const onChangeStage = async (category: StageType, index: number, stage: Stage) => {
    if (!competition) {
      return
    }

    const newGroupStages = [...groupStages]
    const newKnockoutStages = [...knockoutStages]
    switch (category) {
      case StageType.Group:
        newGroupStages[index] = stage
        break
      case StageType.Knockout:
        newKnockoutStages[index] = stage
    }
    const stages = [...newGroupStages, ...newKnockoutStages]
    const { data, error } = await supabase.from('competitions')
      .update({ stages })
      .eq('id', competition.id)
      .select()
    if (error) {
      console.error(error)
    } else {
      assertType<Competition[]>(data)
      setCompetition(data[0])
    }
  }

  const onDeleteStage = async (category: StageType, index: number) => {
    if (!competition) {
      return
    }

    const newGroupStages = category === StageType.Group
      ? [...groupStages.slice(0, index), ...groupStages.slice(index + 1)]
      : groupStages
    const newKnockoutStages = category === StageType.Knockout
      ? [...knockoutStages.slice(0, index), ...knockoutStages.slice(index + 1)]
      : knockoutStages
    const stages = [...newGroupStages, ...newKnockoutStages]
    const { data, error } = await supabase.from('competitions')
      .update({ stages })
      .eq('id', competition.id)
      .select()
    if (error) {
      console.error(error)
    } else {
      assertType<Competition[]>(data)
      setCompetition(data[0])
    }
  }

  if (!team || !competition) {
    return null
  }

  return (
    <>
      <Title order={5}>{seasonLabel(competition.season)}</Title>
      <Title mb="xl">{competition.name}</Title>
      <Switch
        label="Readonly Mode"
        checked={readonly}
        onChange={(event) => setReadonly(event.currentTarget.checked)}
        my="md"
      />
      <Group>
        <Button component={Link} to={`/teams/${team.id}/competitions/${id}/edit`}>
          Edit
        </Button>
        <Button onClick={() => alert("TODO")} variant="outline">
          Add Stage
        </Button>
        <Button onClick={() => alert("TODO")} variant="outline" color="red" className="ml-auto">
          Delete
        </Button>
      </Group>
      <Accordion defaultValue={[StageType.Group, StageType.Knockout]} multiple mt="lg">
        {categories.map((category, i) => (
          <Accordion.Item key={i} value={category.value} hidden={category.stages.length === 0}>
            <Accordion.Control>{category.name}</Accordion.Control>
            <Accordion.Panel>
              {category.stages.map((stage, j) => (
                <StageItem
                  key={j}
                  stage={stage}
                  type={category.value}
                  readonly={readonly}
                  onChange={(newStage) => onChangeStage(category.value, j, newStage)}
                  onDelete={() => onDeleteStage(category.value, j)}
                />
              ))}
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </>
  )
}

const StageItem: React.FC<{
  stage: Stage,
  type: StageType,
  readonly: boolean,
  onChange: (stage: Stage) => Promise<void>
  onDelete: () => Promise<void>
}> = ({ stage, type, readonly, onChange, onDelete }) => {
  const field = useField({
    initialValue: stage.name,
    validateOnChange: true,
    validate: isNotEmpty()
  })

  const [isEditing, setIsEditing] = useState(false)
  useEffect(() => {
    if (readonly) {
      setIsEditing(false)
    }
  }, [readonly])

  const [table, setTable] = useState<StageTableRowData[]>(cloneDeep(stage.table))
  const [fixtures, setFixtures] = useState<StageFixtureData[]>(cloneDeep(stage.fixtures))
  useEffect(() => {
    setTable(cloneDeep(stage.table))
    setFixtures(cloneDeep(stage.fixtures))
  }, [stage.fixtures, stage.table])

  const [loading, setLoading] = useState(false)
  const onClickSave = async () => {
    if (field.error) {
      return
    }

    setLoading(true)
    try {
      await onChange({
        ...stage,
        name: field.getValue(),
        table,
        fixtures,
      })
    } finally {
      setIsEditing(false)
      setLoading(false)
    }
  }

  const onClickCancel = () => {
    field.reset()
    setTable(cloneDeep(stage.table))
    setFixtures(cloneDeep(stage.fixtures))
    setIsEditing(false)
  }

  const onClickDelete = () => {
    modals.openConfirmModal({
      title: `Delete Stage: ${stage.name}`,
      centered: true,
      children: (
        <MText size="sm">
          Are you sure you want to delete this stage? This action cannot be undone.
        </MText>
      ),
      labels: {
        confirm: 'Delete',
        cancel: 'Cancel'
      },
      confirmProps: { color: 'red' },
      onConfirm: async () => await onDelete()
    })
  }

  return (
    <Box pos="relative" my="md">
      <LoadingOverlay visible={loading} overlayProps={{ radius: 'sm', blur: 2 }} />
      <Group>
        <TextInput
          {...field.getInputProps()}
          disabled={!isEditing}
          style={{ flexGrow: 1}}
        />
        {readonly ? null : isEditing ? (
          <>
            <ActionIcon onClick={onClickCancel} variant="subtle">
              <div className="i-tabler:x" />
            </ActionIcon>
            <ActionIcon onClick={onClickSave} disabled={!!field.error} variant="subtle">
              <div className="i-tabler:device-floppy" />
            </ActionIcon>
          </>
        ) : (
          <>
            <ActionIcon onClick={() => setIsEditing(true)} variant="subtle">
              <div className="i-tabler:edit" />
            </ActionIcon>
            <ActionIcon onClick={onClickDelete} variant="subtle">
              <div className="i-tabler:trash" />
            </ActionIcon>
          </>
        )}
      </Group>
      {type === StageType.Group ? (
        <StageTable
          table={table}
          isEditing={isEditing}
          onChange={setTable}
        />
      ) : (
        <StageFixtures
          fixtures={fixtures}
          isEditing={isEditing}
          onChange={setFixtures}
        />
      )}
    </Box>
  )
}

const StageTable: React.FC<{
  table: StageTableRowData[]
  isEditing: boolean
  onChange: (table: StageTableRowData[]) => void
 }> = ({ table, isEditing, onChange }) => {
  const onChangeRow = (index: number, row: StageTableRowData) => {
    const newTable = [...table]
    newTable[index] = row
    onChange(newTable)
  }

  const onClickAddRow = () => {
    onChange([...table, { team: '', w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }])
  }

   const onClickRemoveRow = () => {
    onChange(table.slice(0, -1))
   }

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th className="w-2"></Table.Th>
            <Table.Th className="w-min-50">Team</Table.Th>
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
  )
}

const StageTableRow: React.FC<{
  row: StageTableRowData
  isEditing: boolean
  index: number
  onChange: (row: StageTableRowData) => void
}> = ({ row, isEditing, index, onChange }) => {
  const form = useForm({
    initialValues: {
      team: row.team ?? '',
      w: row.w,
      d: row.d,
      l: row.l,
      gf: row.gf,
      ga: row.ga,
      pts: row.pts,
    },
    onValuesChange: (values) => {
      if (form.isDirty()) {
        onChange(values)
      }
    }
  })
  form.watch('w', ({ value: w }) => {
    form.setFieldValue('pts', w * 3 + form.values.d)
  })
  form.watch('d', ({ value: d }) => {
    form.setFieldValue('pts', form.values.w * 3 + d)
  })

  useEffect(() => {
    if (!isEditing) {
      form.reset()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  useEffect(() => {
    form.setValues({
      team: row.team ?? '',
      w: row.w,
      d: row.d,
      l: row.l,
      gf: row.gf,
      ga: row.ga,
      pts: row.pts,
    })
    form.resetDirty()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row])

  const statField = (key: keyof StageTableRowData) => (
    <NumberInput
      {...form.getInputProps(key)}
      size="xs"
      min={0}
      variant={isEditing ? 'default' : 'unstyled'}
      hideControls
      readOnly={!isEditing}
      classNames={{ input: 'text-right' }}
    />
  )

  return (
    <Table.Tr>
      <Table.Td>{index}</Table.Td>
      <Table.Td>
        {/* TODO: use Team combobox */}
        <TextInput
          {...form.getInputProps('team')}
          size="xs"
          variant={isEditing ? 'default' : 'unstyled'}
          readOnly={!isEditing}
        />
      </Table.Td>
      <Table.Td>{statField('w')}</Table.Td>
      <Table.Td>{statField('d')}</Table.Td>
      <Table.Td>{statField('l')}</Table.Td>
      <Table.Td>{statField('gf')}</Table.Td>
      <Table.Td>{statField('ga')}</Table.Td>
      <Table.Td>
        <MText size="xs" className="text-right">{form.values.gf - form.values.ga}</MText>
      </Table.Td>
      <Table.Td>
        <MText size="xs" className="text-right">{form.values.pts}</MText>
      </Table.Td>
    </Table.Tr>
  )
}

const StageFixtures: React.FC<{
  fixtures: StageFixtureData[]
  isEditing: boolean
  onChange: (fixtures: StageFixtureData[]) => void
}> = ({ fixtures, isEditing, onChange }) => {
  const onChangeFixture = (index: number, fixture: StageFixtureData) => {
    const newFixtures = [...fixtures]
    newFixtures[index] = fixture
    onChange(newFixtures)
  }

  const onClickAddFixture = () => {
    onChange([...fixtures, { homeTeam: '', awayTeam: '', legs: [{ homeScore: '', awayScore: '' }] }])
  }

  const onClickRemoveFixture = () => {
    onChange(fixtures.slice(0, -1))
  }

  return (
    <Table.ScrollContainer minWidth={600}>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th className="text-right w-2/5">Home Team</Table.Th>
            <Table.Th className="text-center w-1/5">Score</Table.Th>
            <Table.Th className="text-left w-2/5">Away Team</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {fixtures.map((fixture, j) => (
            <StageFixtureRow
              key={j}
              fixture={fixture}
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
  )
}

const StageFixtureRow: React.FC<{
  fixture: StageFixtureData
  isEditing: boolean
  onChange: (fixture: StageFixtureData) => void
}> = ({ fixture, isEditing, onChange }) => {
  const form = useForm({
    initialValues: {
      homeTeam: fixture.homeTeam ?? '',
      awayTeam: fixture.awayTeam ?? '',
      legs: fixture.legs.map(leg => ({
        homeScore: leg.homeScore ?? '',
        awayScore: leg.awayScore ?? ''
      }))
    },
    onValuesChange: (values) => {
      if (form.isDirty()) {
        onChange(values)
      }
    }
  })

  useEffect(() => {
    if (!isEditing) {
      form.reset()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  useEffect(() => {
    form.setValues({
      homeTeam: fixture.homeTeam ?? '',
      awayTeam: fixture.awayTeam ?? '',
      legs: fixture.legs.map(leg => ({
        homeScore: leg.homeScore ?? '',
        awayScore: leg.awayScore ?? ''
      }))
    })
    form.resetDirty()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixture])

  const onClickAddLeg = () => {
    form.setFieldValue('legs', [
      ...form.values.legs,
      { homeScore: '', awayScore: '' }
    ])
  }

  const onClickRemoveLeg = () => {
    if (form.values.legs.length > 1) {
      form.setFieldValue('legs', form.values.legs.slice(0, -1))
    }
  }

  return (
    <Table.Tr>
      <Table.Td align="right">
        <TextInput
          {...form.getInputProps('homeTeam')}
          size="xs"
          variant={isEditing ? 'default' : 'unstyled'}
          readOnly={!isEditing}
          classNames={{ input: 'text-right' }}
        />
      </Table.Td>
      <Table.Td align="center">
        {form.values.legs.map((_leg, k) => (
          <Group key={k} justify="center" mt={k === 0 ? undefined : 'xs'}>
            <TextInput
              {...form.getInputProps(`legs.${k}.homeScore`)}
              key={form.key(`legs.${k}.homeScore`)}
              size="xs"
              variant={isEditing ? 'default' : 'unstyled'}
              readOnly={!isEditing}
              classNames={{ input: 'w-12 text-right' }}
            />
            <MText size="xs">-</MText>
            <TextInput
              {...form.getInputProps(`legs.${k}.awayScore`)}
              key={form.key(`legs.${k}.awayScore`)}
              size="xs"
              variant={isEditing ? 'default' : 'unstyled'}
              readOnly={!isEditing}
              classNames={{ input: 'w-12' }}
            />
          </Group>
        ))}
        {isEditing && (
          <Group justify="center" mt="xs">
            <ActionIcon onClick={onClickAddLeg} variant="default" size="xs">
              <div className="i-tabler:plus" />
            </ActionIcon>
            <ActionIcon
              onClick={onClickRemoveLeg}
              variant="default"
              size="xs"
              disabled={form.values.legs.length < 2}
            >
              <div className="i-tabler:minus" />
            </ActionIcon>
          </Group>
        )}
      </Table.Td>
      <Table.Td align="left">
        <TextInput
          {...form.getInputProps('awayTeam')}
          size="xs"
          variant={isEditing ? 'default' : 'unstyled'}
          readOnly={!isEditing}
        />
      </Table.Td>
    </Table.Tr>
  )
}
