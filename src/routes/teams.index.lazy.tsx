import { Tables } from "@/database-generated.types"
import { Button, Title } from "@mantine/core"

export const Route = createLazyFileRoute('/teams/')({
  component: Teams,
})

function Teams() {
  const supabase = useAtomValue(supabaseAtom)
  const [teams, setTeams] = useState<Tables<'teams'>[]>([])
  useEffect(() => {
    const loadTeams = async () => {
      const { data, error } = await supabase.from('teams').select()
      if (error) {
        console.error(error)
      } else {
        setTeams(data)
      }
    }

    loadTeams()
  }, [supabase])

  return (
    <>
      <Title mb="xl">Teams</Title>

      <Button component={Link} to="/teams/new">Create Team</Button>

      <div>{JSON.stringify(teams)}</div>
    </>
  )
}
