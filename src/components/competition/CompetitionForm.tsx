import { Button, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { Tables } from '@/database-generated.types'

export function CompetitionForm({ record, team }: {
  record?: Tables<'competitions'>
  team: Tables<'teams'>
}) {
  const { currentSeason, seasonLabel } = useTeamHelpers(team)

  const session = useAtomValue(sessionAtom)
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      user_id: session?.user?.id,
      team_id: team.id,
      name: record?.name ?? '',
      season: record?.season ?? currentSeason,
      champion: record?.champion,
    },
    onValuesChange: (values) => {
      console.log(values)
    }
  })

  const supabase = useAtomValue(supabaseAtom)
  const navigate = useNavigate()
  const handleSubmit = useCallback(async (values: typeof form.values) => {
    console.log(values)

    const { data, error } = await supabase.from('competitions').upsert({ id: record?.id, ...values }).select()
    if (data) {
      navigate({ to: `/teams/${team.id}/competitions/${data[0].id}` })
    } else {
      console.error(error)
    }
  }, [form, navigate, record?.id, supabase, team.id])

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        label="Season"
        value={seasonLabel(form.values.season)}
        disabled
        mb="xs"
      />
      <TextInput
        label="Name"
        required
        mb="xl"
        {...form.getInputProps('name')}
      />
      <Button type="submit">Create Competition</Button>
    </form>
  )
}
