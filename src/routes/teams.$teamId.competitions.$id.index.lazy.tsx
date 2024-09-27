import { Tables } from '@/database-generated.types'
import { Accordion, Box, Button, Table, Title } from '@mantine/core'

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
      gd: number;
      pts: number;
    }[];
    fixtures: {
      homeTeam: string;
      awayTeam: string;
      legs: {
        homeScore: number;
        awayScore: number;
      }[];
    }[];
  }[]
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

  const tableStages = useMemo(() => (
    competition?.stages?.filter(stage => stage.table.length > 0) ?? []
  ), [competition])

  const knockoutStages = useMemo(() => (
    competition?.stages?.filter(stage => stage.fixtures.length > 0) ?? []
  ), [competition])

  console.log(tableStages)
  console.log(knockoutStages)

  if (!team || !competition) {
    return null
  }

  return (
    <>
      <Title order={5}>{seasonLabel(competition.season)}</Title>
      <Title mb="xl">{competition.name}</Title>
      <Button component={Link} to={`/teams/${team.id}/competitions/${id}/edit`}>
        Edit Competition
      </Button>
      <Accordion defaultValue={['groups', 'knockout']} multiple>
        {tableStages.length > 0 && (
          <Accordion.Item value="groups">
            <Accordion.Control>Group Stages</Accordion.Control>
            <Accordion.Panel>
              {tableStages.map((stage, i) => (
                <Box key={i} my="md">
                  <Title order={6}>{tableStages.length > 1 ? stage.name : null}</Title>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th></Table.Th>
                        <Table.Th>Team</Table.Th>
                        <Table.Th>W</Table.Th>
                        <Table.Th>D</Table.Th>
                        <Table.Th>L</Table.Th>
                        <Table.Th>GF</Table.Th>
                        <Table.Th>GA</Table.Th>
                        <Table.Th>GD</Table.Th>
                        <Table.Th>PTS</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {stage.table.map((row, j) => (
                        <Table.Tr key={j}>
                          <Table.Td>{j + 1}</Table.Td>
                          <Table.Td>{row.team}</Table.Td>
                          <Table.Td>{row.w}</Table.Td>
                          <Table.Td>{row.d}</Table.Td>
                          <Table.Td>{row.l}</Table.Td>
                          <Table.Td>{row.gf}</Table.Td>
                          <Table.Td>{row.ga}</Table.Td>
                          <Table.Td>{row.gf - row.ga}</Table.Td>
                          <Table.Td>{row.pts}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Box>
              ))}
            </Accordion.Panel>
          </Accordion.Item>
        )}
        {knockoutStages.length > 0 && (
          <Accordion.Item value="knockout">
            <Accordion.Control>Knockout Stages</Accordion.Control>
            <Accordion.Panel>
              {knockoutStages.map((stage, i) => (
                <Box key={i} my="md">
                  <Title order={6}>{stage.name}</Title>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th className="text-right w-2/5">Home Team</Table.Th>
                        <Table.Th className="text-center w-1/5">Score</Table.Th>
                        <Table.Th className="text-left w-2/5">Away Team</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {stage.fixtures.map((fixture, j) => (
                        <Table.Tr key={j}>
                          <Table.Td align="right">{fixture.homeTeam}</Table.Td>
                          <Table.Td align="center">
                            {fixture.legs.map((leg, k) => (
                              <Box key={k}>
                                {leg.homeScore} - {leg.awayScore}
                              </Box>
                            ))}
                          </Table.Td>
                          <Table.Td align="left">{fixture.awayTeam}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Box>
              ))}
            </Accordion.Panel>
          </Accordion.Item>
        )}
      </Accordion>
    </>
  )
}
