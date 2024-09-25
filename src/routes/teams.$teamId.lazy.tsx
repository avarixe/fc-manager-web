import { Button, Title } from '@mantine/core'

export const Route = createLazyFileRoute('/teams/$teamId')({
  component: Team,
})

function Team() {
  const supabase = useAtomValue(supabaseAtom)
  const teamId = useParams({ from: '/teams/$teamId', select: (params) => params.teamId})
  const [team, setTeam] = useAtom(teamAtom)
  useEffect(() => {
    const loadTeam = async () => {
      const { data, error } = await supabase.from('teams').select().eq('id', teamId)
      if (error) {
        console.error(error)
      } else {
        setTeam(data[0])
      }
    }

    loadTeam()
  }, [setTeam, supabase, teamId])

  if (!team) {
    return null
  }

  return (
    <>
      <Title mb="xl">{team.name}</Title>
      <Button component={Link} to={`/teams/${team.id}/edit`}>
        Edit Team
      </Button>
    </>
  )
}
