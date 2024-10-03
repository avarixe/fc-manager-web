import { Tables } from "@/database-generated.types"
import { Button, Group, Stack, Title } from "@mantine/core"

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
  columnHelper.accessor('started_on', {
    header: 'Start Date',
    cell: info => {
      const value = info.getValue()
      return formatDate(value)
    },
  }),
  columnHelper.accessor('currently_on', {
    header: 'Current Date',
    cell: info => {
      const value = info.getValue()
      return formatDate(value)
    },
  }),
  columnHelper.accessor('manager_name', {
    header: 'Manager Name',
  }),
  columnHelper.accessor('game', {
    header: 'Game',
  }),
]

function TeamsPage() {
  const supabase = useAtomValue(supabaseAtom)
  const [teams, setTeams] = useState<Tables<'teams'>[]>([])
  const [tableState, setTableState] = useState({
    pageIndex: 0,
    pageSize: 10,
    rowCount: 0,
  })
  useEffect(() => {
    const fetchPage = async () => {
      const pageQuery = supabase.from('teams').select().range(
        tableState.pageSize * tableState.pageIndex,
        tableState.pageSize * (tableState.pageIndex + 1)
      )

      // TODO: add sorting

      const { count } = await supabase.from('teams').select('id', { count: 'exact', head: true })
      const { data, error } = await pageQuery
      if (error) {
        console.error(error)
      } else {
        setTeams(data)
        setTableState((prev) => ({
          ...prev,
          rowCount: count ?? 0
        }))
      }
    }

    fetchPage()
  }, [supabase, tableState.pageIndex, tableState.pageSize])


  return (
    <Stack>
      <Title mb="xl">Teams</Title>

      <Group>
        <Button component={Link} to="/teams/new">New Team</Button>
        <Button component={Link} to="/teams/import" variant="outline">Import Team</Button>
      </Group>

      <DataTable
        data={teams}
        columns={columns}
        tableState={tableState}
        setTableState={setTableState}
      />
    </Stack>
  )
}
