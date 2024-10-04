import { Tables } from "@/database-generated.types"
import { Player } from "@/types"
import { Badge, NumberFormatter, Table, ThemeIcon, Timeline, Title } from "@mantine/core"
import { orderBy } from "lodash-es"

enum PlayerEventType {
  Contract = 'Contract',
  Injury = 'Injury',
  Loan = 'Loan',
  Transfer = 'Transfer',
}

type PlayerEvent = { type: PlayerEventType; date: string; priority: number } & (
  Player['contracts'][number] |
  Player['injuries'][number] |
  Player['loans'][number] |
  Player['transfers'][number]
)

export const PlayerTimeline: React.FC<{
  player: Player
  team: Tables<'teams'>
}> = ({ player, team }) => {
  const items: PlayerEvent[] = useMemo(() => orderBy(
    [
      ...player.contracts.map((contract) => ({
        type: PlayerEventType.Contract,
        date: contract.started_on,
        priority: 1,
        ...contract,
      })),
      ...player.injuries.map((injury) => ({
        type: PlayerEventType.Injury,
        date: injury.started_on,
        priority: 3,
        ...injury,
      })),
      ...player.loans.map((loan) => ({
        type: PlayerEventType.Loan,
        date: loan.started_on,
        priority: loan.destination === team.name ? 2 : 4,
        ...loan,
      })),
      ...player.transfers.map((transfer) => ({
        type: PlayerEventType.Transfer,
        date: transfer.moved_on,
        priority: transfer.destination === team.name ? 0 : 5,
        ...transfer,
      }))
    ],
    ['date', 'priority'],
    ['asc', 'asc'],
  ), [team.name, player.contracts, player.injuries, player.loans, player.transfers])

  const renderItem = useCallback((item: PlayerEvent) => {
    switch (item.type) {
      case PlayerEventType.Contract:
        assertType<Player['contracts'][number]>(item)
        return <ContractEvent contract={item} team={team} />
      case PlayerEventType.Injury:
        assertType<Player['injuries'][number]>(item)
        return <InjuryEvent injury={item} team={team} />
      case PlayerEventType.Loan:
        assertType<Player['loans'][number]>(item)
        return <LoanEvent loan={item} team={team} />
      case PlayerEventType.Transfer:
        assertType<Player['transfers'][number]>(item)
        return <TransferEvent transfer={item} team={team} />
    }
  }, [team])

  return(
    <Timeline bulletSize={36}>
      <Timeline.Item>

      </Timeline.Item>
      {items.map((item, index) => (
        <Timeline.Item
          key={index}
          bullet={(
            <ThemeIcon size="md" radius="xl" color={playerEventColor(item, team)}>
              <div className={playerEventIconName(item, team)} />
            </ThemeIcon>
          )}
        >
          {renderItem(item)}
        </Timeline.Item>
      ))}
    </Timeline>
  )
}

const ContractEvent: React.FC<{
  contract: Player['contracts'][number];
  team: Tables<'teams'>
}> = ({ contract, team }) => {
  return (
    <div>
      <Title c="blue" order={4}>Contract</Title>
      <Title c="blue" order={6}>
        {!contract.signed_on && <Badge variant="outline" color="red" mr="xs">UNSIGNED</Badge>}
        {formatDate(contract.started_on)} - {formatDate(contract.ended_on)}
        {contract.conclusion ? ` (${contract.conclusion})` : ''}
      </Title>

      <Table withRowBorders={false} verticalSpacing={2} w="auto" mt="xs">
        <Table.Tbody>
          <Table.Tr>
            <Table.Th>Wage</Table.Th>
            <Table.Td>
              <NumberFormatter
                value={contract.wage}
                prefix={team.currency}
                thousandSeparator
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Th>Signing Bonus</Table.Th>
            <Table.Td>
              <NumberFormatter
                value={contract.signing_bonus ?? 0}
                prefix={team.currency}
                thousandSeparator
              />
            </Table.Td>
          </Table.Tr>
          {contract.performance_bonus && (
            <Table.Tr>
              <Table.Th>Performance Bonus</Table.Th>
              <Table.Td>
                <NumberFormatter
                  value={contract.performance_bonus}
                  prefix={team.currency}
                  thousandSeparator
                />
                &nbsp;if {contract.bonus_req} {contract.bonus_req_type}
              </Table.Td>
            </Table.Tr>
          )}
          {contract.release_clause && (
            <Table.Tr>
              <Table.Th>Release Clause</Table.Th>
              <Table.Td>
                <NumberFormatter
                  value={contract.release_clause}
                  prefix={team.currency}
                  thousandSeparator
                />
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </div>
  )
}

const InjuryEvent: React.FC<{
  injury: Player['injuries'][number];
  team: Tables<'teams'>
}> = ({ injury, team }) => {
  const duration = dayjs.duration(dayjs(injury.ended_on).diff(dayjs(injury.started_on)))

  return (
    <div>
      <Title c="pink" order={4}>{injury.description} Injury</Title>
      <Title c="pink" order={6}>
        {formatDate(injury.started_on)} -&nbsp;
        {injury.ended_on < team.currently_on ? formatDate(injury.ended_on) : 'Present'}
      </Title>

      <Table withRowBorders={false} verticalSpacing={2} w="auto" mt="xs">
        <Table.Tbody>
          <Table.Tr>
            <Table.Th>Duration</Table.Th>
            <Table.Td>{duration.humanize()}</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </div>
  )
}

const LoanEvent: React.FC<{
  loan: Player['loans'][number];
  team: Tables<'teams'>
}> = ({ loan, team }) => {
  const title = loan.destination === team.name
    ? `Loan from ${loan.origin}`
    : `Loan at ${loan.destination}`

  const subtitle = useMemo(() => {
    if (loan.started_on > team.currently_on) {
      return `Scheduled on ${formatDate(loan.started_on)}`
    } else if (loan.ended_on > team.currently_on) {
      return `${formatDate(loan.started_on)} - Present`
    } else {
      return `${formatDate(loan.started_on)} - ${formatDate(loan.ended_on)}`
    }
  }, [loan.ended_on, loan.started_on, team.currently_on])

  const timeBeforeDeparture = dayjs(loan.started_on).diff(dayjs(team.currently_on))

  const duration = dayjs.duration(dayjs(loan.ended_on).diff(dayjs(loan.started_on)))

  return (
    <div>
      <Title c="orange" order={4}>{title}</Title>
      <Title c="orange" order={6}>
        {!loan.signed_on && <Badge variant="outline" color="red" mr="xs">UNSIGNED</Badge>}
        {subtitle}
      </Title>

      <Table withRowBorders={false} verticalSpacing={2} w="auto" mt="xs">
        <Table.Tbody>
          <Table.Tr>
            <Table.Th>Origin</Table.Th>
            <Table.Td>{loan.origin}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Th>Destination</Table.Th>
            <Table.Td>{loan.destination}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Th>Wage Percentage</Table.Th>
            <Table.Td>{loan.wage_percentage}%</Table.Td>
          </Table.Tr>
          {loan.started_on > team.currently_on && (
            <Table.Tr>
              <Table.Th>Departs In</Table.Th>
              <Table.Td>{timeBeforeDeparture.humanize(true)}</Table.Td>
            </Table.Tr>
          )}
          <Table.Tr>
            <Table.Th>Duration</Table.Th>
            <Table.Td>{duration.humanize()}</Table.Td>
          </Table.Tr>
          {Boolean(loan.transfer_fee || loan.addon_clause) && (
            <>
              <Table.Tr>
                <Table.Td colSpan={2} ta="center" fs="italic">Loan-to-Buy Option</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th>Transfer Fee</Table.Th>
                <Table.Td>
                  <NumberFormatter
                    value={loan.transfer_fee ?? 0}
                    prefix={team.currency}
                    thousandSeparator
                  />
                </Table.Td>
              </Table.Tr>
              {Boolean(loan.addon_clause) && (
                <Table.Tr>
                  <Table.Th>Add-On Clause</Table.Th>
                  <Table.Td>{loan.addon_clause}%</Table.Td>
                </Table.Tr>
              )}
            </>
          )}
        </Table.Tbody>
      </Table>
    </div>
  )
}

const TransferEvent: React.FC<{
  transfer: Player['transfers'][number];
  team: Tables<'teams'>
}> = ({ transfer, team }) => {
  const title = transfer.destination === team.name
    ? `Transfer from ${transfer.origin}`
    : `Transfer to ${transfer.destination}`

  const color = transfer.destination === team.name ? 'green' : 'red'

  return (
    <div>
      <Title c={color} order={4}>{title}</Title>
      <Title c={color} order={6}>
        {!transfer.signed_on && <Badge variant="outline" color="red" mr="xs">UNSIGNED</Badge>}
        {formatDate(transfer.moved_on)}
      </Title>

      <Table withRowBorders={false} verticalSpacing={2} w="auto" mt="xs">
        <Table.Tbody>
          <Table.Tr>
            <Table.Th>Origin</Table.Th>
            <Table.Td>{transfer.origin}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Th>Destination</Table.Th>
            <Table.Td>{transfer.destination}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Th>Transfer Fee</Table.Th>
            <Table.Td>
              <NumberFormatter
                value={transfer.fee ?? 0}
                prefix={team.currency}
                thousandSeparator
              />
            </Table.Td>
          </Table.Tr>
          {Boolean(transfer.addon_clause) && (
            <Table.Tr>
              <Table.Th>Add-On Clause</Table.Th>
              <Table.Td>{transfer.addon_clause}%</Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </div>
  )
}

function playerEventIconName(item: PlayerEvent, team: Tables<'teams'>): string {
  switch (item.type) {
    case PlayerEventType.Contract:
      return 'i-tabler:contract'
    case PlayerEventType.Injury:
      return 'i-tabler:ambulance'
    case PlayerEventType.Loan:
      return 'i-tabler:transfer'
    case PlayerEventType.Transfer:
      assertType<Player['transfers'][number]>(item)
      if (item.destination === team.name) {
        return 'i-tabler:plane-arrival'
      } else {
        return 'i-tabler:plane-departure'
      }
  }
}

function playerEventColor(item: PlayerEvent, team: Tables<'teams'>): string {
  switch (item.type) {
    case PlayerEventType.Contract:
      return 'blue'
    case PlayerEventType.Injury:
      return 'pink'
    case PlayerEventType.Loan:
      return 'orange'
    case PlayerEventType.Transfer:
      assertType<Player['transfers'][number]>(item)
      if (item.destination === team.name) {
        return 'green'
      } else {
        return 'red'
      }
  }
}
