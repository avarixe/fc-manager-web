import { Button, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { Tables } from '@/database-generated.types'

export function TeamForm({ record }: { record?: Tables<'teams'> }) {
  const session = useAtomValue(sessionAtom)
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      userId: session?.user?.id,
      name: record?.name ?? '',
      startedOn: record?.startedOn ?? dayjs().format('YYYY-MM-DD'),
      currentlyOn: record?.currentlyOn ?? dayjs().format('YYYY-MM-DD'),
      managerName: record?.managerName ?? '',
      game: record?.game ??'',
      currency: record?.currency ?? '$',
    },
    onValuesChange: (values) => {
      console.log(values)
    }
  })
  form.watch('startedOn', ({ value }) => {
    form.setFieldValue('currentlyOn', value)
  })

  const supabase = useAtomValue(supabaseAtom)
  const navigate = useNavigate()
  const handleSubmit = useCallback(async (values: typeof form.values) => {
    console.log(values)

    const { data, error } = await supabase.from('teams').upsert({ id: record?.id, ...values }).select()
    if (data) {
      navigate({ to: `/teams/${data[0].id}` })
    } else {
      console.error(error)
    }
  }, [form, navigate, record?.id, supabase])

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        label="Name"
        required
        mb="xs"
        {...form.getInputProps('name')}
      />
      {/* TODO: Previous Team */}
      <TextInput
        label="Manager Name"
        mb="xs"
        {...form.getInputProps('managerName')}
      />
      <TextInput
        label="Game"
        mb="xs"
        {...form.getInputProps('game')}
      />
      <DatePickerInput
        label="Start Date"
        required
        firstDayOfWeek={0}
        mb="xs"
        {...form.getInputProps('startedOn')}
      />
      <DatePickerInput
        label="Current Date"
        required
        firstDayOfWeek={0}
        mb="xs"
        {...form.getInputProps('currentlyOn')}
      />
      <TextInput
        label="Currency"
        mb="xl"
        {...form.getInputProps('currency')}
      />
      <Button type="submit">Create Team</Button>
    </form>
  )
}
