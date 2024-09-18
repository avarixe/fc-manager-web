import { Button, TextInput, Title } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { useForm } from "@mantine/form"

export const Route = createLazyFileRoute('/teams/new')({
  component: NewTeam,
})

function NewTeam() {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      startedOn: new Date(),
      currentlyOn: new Date(),
      managerName: '',
      game: '',
      currency: '$',
    },
  })

  function handleSubmit(values: typeof form.values) {
    console.log(values)
  }

  return (
    <>
      <Title mb="xl">New Team</Title>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label="Name"
          required
          mb="xs"
          {...form.getInputProps('name')}
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
          label="Manager Name"
          mb="xs"
          {...form.getInputProps('managerName')}
        />
        <TextInput
          label="Game"
          mb="xs"
          {...form.getInputProps('game')}
        />
        <TextInput
          label="Currency"
          mb="xl"
          {...form.getInputProps('currency')}
        />
        <Button type="submit">Create Team</Button>
      </form>
    </>
  )
}
