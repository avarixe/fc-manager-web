import { Tables } from '@/database-generated.types'
import { Title } from '@mantine/core'

export const Route = createLazyFileRoute(
  '/teams/$teamId/competitions/$id/edit',
)({
  component: EditCompetitionPage,
})

function EditCompetitionPage() {
  const { id, teamId } = Route.useParams()
  const { team } = useTeam(teamId)

  const [competition, setCompetition] = useState<Tables<'competitions'> | null>(null)
  const supabase = useAtomValue(supabaseAtom)
  useEffect(() => {
    const fetchCompetition = async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select()
        .eq('teamId', teamId)
        .eq('id', id)
        .single()
      if (error) {
        console.error(error)
      } else {
        setCompetition(data)
      }
    }

    fetchCompetition()
  }, [id, supabase, teamId])

  if (!team || !competition) {
    return null
  }

  return (
    <>
      <Title mb="xl">Edit Competition</Title>

      <CompetitionForm record={competition} team={team} />
    </>
  )
}
