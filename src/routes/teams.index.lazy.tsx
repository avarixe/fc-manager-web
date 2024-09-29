import { Tables } from "@/database-generated.types"
import { Button, Title } from "@mantine/core"

export const Route = createLazyFileRoute('/teams/')({
  component: TeamsPage,
})

const columnHelper = createColumnHelper<Tables<'teams'>>()
const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: info => {
      const value = info.getValue()
      return <Button component={Link} to={`/teams/${info.row.original.id}`} variant="subtle" size="xs">{value}</Button>
    }
  }),
  columnHelper.accessor('startedOn', {
    header: 'Start Date',
    cell: info => {
      const value = info.getValue()
      return formatDate(value)
    },
  }),
  columnHelper.accessor('currentlyOn', {
    header: 'Current Date',
    cell: info => {
      const value = info.getValue()
      return formatDate(value)
    },
  }),
  columnHelper.accessor('managerName', {
    header: 'Manager Name',
  }),
  columnHelper.accessor('game', {
    header: 'Game',
  }),
]

function TeamsPage() {
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

      <Button component={Link} to="/teams/new">New Team</Button>
      &nbsp;
      <Button component={Link} to="/teams/import" variant="outline">Import Team</Button>

      <DataTable
        data={teams}
        columns={columns}
      />
    </>
  )
}
