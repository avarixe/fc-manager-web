import { Title } from '@mantine/core'

export const Route = createLazyFileRoute('/teams/$teamId/edit')({
  component: EditTeam,
})

function EditTeam() {
  const supabase = useAtomValue(supabaseAtom)
  const teamId = useParams({
    from: '/teams/$teamId/edit',
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
      <Title mb="xl">Edit Team</Title>

      <TeamForm record={team} />
    </>
  )
}