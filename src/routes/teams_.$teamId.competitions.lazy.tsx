import { Title } from '@mantine/core'

export const Route = createLazyFileRoute('/teams/$teamId/competitions')({
  component: Competitions,
})

function Competitions() {
  const supabase = useAtomValue(supabaseAtom)
  const teamId = useParams({
    from: '/teams/$teamId/competitions',
    select: (params) => params.teamId,
  })
  const [team, setTeam] = useAtom(teamAtom)
  useEffect(() => {
    const loadTeam = async () => {
      const { data, error } = await supabase
        .from('teams')
        .select()
        .eq('id', teamId)
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
      <Title mb="xl">Competitions</Title>

      <div>TODO</div>
    </>
  )
}
