import { Tables } from "@/database-generated.types";
import { Player } from "@/types";
import {
  Badge,
  Button,
  Group,
  NumberFormatter,
  Table,
  ThemeIcon,
  Timeline,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { orderBy } from "lodash-es";

enum PlayerEventType {
  Contract = "Contract",
  Injury = "Injury",
  Loan = "Loan",
  Transfer = "Transfer",
}

type PlayerEvent = {
  type: PlayerEventType;
  date: string;
  priority: number;
  index: number;
} & (
  | Player["contracts"][number]
  | Player["injuries"][number]
  | Player["loans"][number]
  | Player["transfers"][number]
);

export const PlayerTimeline: React.FC<{
  player: Player;
  setPlayer: StateSetter<Player>;
  team: Tables<"teams">;
}> = ({ player, setPlayer, team }) => {
  const items: PlayerEvent[] = useMemo(
    () =>
      orderBy(
        [
          ...player.contracts.map((contract, index) => ({
            type: PlayerEventType.Contract,
            date: contract.started_on,
            priority: 1,
            index,
            ...contract,
          })),
          ...player.injuries.map((injury, index) => ({
            type: PlayerEventType.Injury,
            date: injury.started_on,
            priority: 3,
            index,
            ...injury,
          })),
          ...player.loans.map((loan, index) => ({
            type: PlayerEventType.Loan,
            date: loan.started_on,
            priority: loan.destination === team.name ? 2 : 4,
            index,
            ...loan,
          })),
          ...player.transfers.map((transfer, index) => ({
            type: PlayerEventType.Transfer,
            date: transfer.moved_on,
            priority: transfer.destination === team.name ? 0 : 5,
            index,
            ...transfer,
          })),
        ],
        ["date", "priority"],
        ["asc", "asc"],
      ),
    [
      team.name,
      player.contracts,
      player.injuries,
      player.loans,
      player.transfers,
    ],
  );
  console.log(items);

  const supabase = useAtomValue(supabaseAtom);
  const addContract = useCallback(
    async (contract: Player["contracts"][number]) => {
      const contracts = [...player.contracts];
      let status = player.status;
      if (contract.signed_on) {
        // Update player status based on the contract.
        if (team.currently_on < contract.started_on) {
          status = "Pending";
        } else if (
          contract.started_on <= team.currently_on &&
          team.currently_on < contract.ended_on &&
          [null, "Pending"].includes(status)
        ) {
          status = "Active";
        }

        // Update previous contract as Renewed.
        const previousContract = contracts[contracts.length - 1];
        if (
          previousContract &&
          contract.started_on < previousContract.ended_on
        ) {
          previousContract.ended_on = contract.started_on;
          previousContract.conclusion = "Renewed";
        }
      }
      contracts.push(contract);

      const { error } = await supabase
        .from("players")
        .update({ status, contracts })
        .eq("id", player.id);
      if (error) {
        console.error(error);
      } else {
        setPlayer((prev: Player) => ({ ...prev, status, contracts }));
      }
    },
    [
      player.contracts,
      player.id,
      player.status,
      setPlayer,
      supabase,
      team.currently_on,
    ],
  );

  const updateContract = useCallback(
    async (index: number, contract: Player["contracts"][number]) => {
      const contracts = [...player.contracts];
      contracts[index] = contract;

      // Update player status based on the contract.
      let status = player.status;
      if (index === contracts.length - 1 && contract.signed_on) {
        // Update player status based on the contract.
        if (team.currently_on < contract.started_on) {
          status = "Pending";
        } else if (
          contract.started_on <= team.currently_on &&
          team.currently_on < contract.ended_on &&
          [null, "Pending"].includes(status)
        ) {
          status = "Active";
        }
      }

      const { error } = await supabase
        .from("players")
        .update({ status, contracts })
        .eq("id", player.id);
      if (error) {
        console.error(error);
      } else {
        setPlayer((prev: Player) => ({ ...prev, status, contracts }));
      }
    },
    [
      player.contracts,
      player.id,
      player.status,
      setPlayer,
      supabase,
      team.currently_on,
    ],
  );

  const removeContract = useCallback(
    async (index: number) => {
      modals.openConfirmModal({
        title: "Delete Contract",
        centered: true,
        children: (
          <MText size="sm">
            Are you sure you want to delete this contract? This action cannot be
            undone.
          </MText>
        ),
        labels: {
          confirm: "Delete",
          cancel: "Cancel",
        },
        confirmProps: { color: "red" },
        onConfirm: async () => {
          const contracts = [...player.contracts];
          contracts.splice(index, 1);

          // Update player status based on the contract.
          let status = player.status;
          if (index === player.contracts.length - 1) {
            status = null;
          }

          const { error } = await supabase
            .from("players")
            .update({ status, contracts })
            .eq("id", player.id);
          if (error) {
            console.error(error);
          } else {
            setPlayer((prev: Player) => ({ ...prev, status, contracts }));
          }
        },
      });
    },
    [player.contracts, player.id, player.status, setPlayer, supabase],
  );

  const renderItem = useCallback(
    (item: PlayerEvent, index: number) => {
      switch (item.type) {
        case PlayerEventType.Contract:
          assertType<Player["contracts"][number]>(item);
          return (
            <ContractEvent
              contract={item}
              team={team}
              onSubmit={(contract) => updateContract(index, contract)}
              onRemove={() => removeContract(index)}
            />
          );
        case PlayerEventType.Injury:
          assertType<Player["injuries"][number]>(item);
          return <InjuryEvent injury={item} team={team} index={index} />;
        case PlayerEventType.Loan:
          assertType<Player["loans"][number]>(item);
          return <LoanEvent loan={item} team={team} index={index} />;
        case PlayerEventType.Transfer:
          assertType<Player["transfers"][number]>(item);
          return <TransferEvent transfer={item} team={team} index={index} />;
      }
    },
    [removeContract, team, updateContract],
  );

  const [
    newContractOpened,
    { open: openNewContract, close: closeNewContract },
  ] = useDisclosure();

  return (
    <Timeline bulletSize={36}>
      <Timeline.Item
        bullet={
          <ThemeIcon size="md" radius="xl" color="lime">
            <div className="i-mdi:plus" />
          </ThemeIcon>
        }
      >
        <Button
          onClick={openNewContract}
          color="indigo"
          leftSection={<div className="i-mdi:file-sign" />}
        >
          Contract
        </Button>
        <ContractForm
          team={team}
          opened={newContractOpened}
          onClose={closeNewContract}
          onSubmit={addContract}
        />
      </Timeline.Item>

      {items.map((item, index) => (
        <Timeline.Item
          key={index}
          bullet={
            <ThemeIcon
              size="md"
              radius="xl"
              color={playerEventColor(item, team)}
            >
              <div className={playerEventIconName(item, team)} />
            </ThemeIcon>
          }
        >
          {renderItem(item, index)}
        </Timeline.Item>
      ))}
    </Timeline>
  );
};

const ContractEvent: React.FC<{
  contract: Player["contracts"][number];
  team: Tables<"teams">;
  onSubmit: (contract: Player["contracts"][number]) => Promise<void>;
  onRemove: () => Promise<void>;
}> = ({ contract, team, onSubmit, onRemove }) => {
  const [opened, { open, close }] = useDisclosure();

  return (
    <div>
      <Title c="indigo" order={4}>
        Contract
      </Title>
      <Title c="indigo" order={6}>
        {!contract.signed_on && (
          <Badge variant="outline" color="red" mr="xs">
            UNSIGNED
          </Badge>
        )}
        {formatDate(contract.started_on)} - {formatDate(contract.ended_on)}
        {contract.conclusion ? ` (${contract.conclusion})` : ""}
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
          {Boolean(contract.performance_bonus) && (
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
          {Boolean(contract.release_clause) && (
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

      <Group mt="sm">
        <Button
          onClick={open}
          variant="subtle"
          size="compact-sm"
          color="orange"
        >
          Edit
        </Button>
        <ContractForm
          record={contract}
          team={team}
          opened={opened}
          onClose={close}
          onSubmit={onSubmit}
        />
        <Button
          onClick={onRemove}
          variant="subtle"
          size="compact-sm"
          color="gray"
        >
          Delete
        </Button>
      </Group>
    </div>
  );
};

const InjuryEvent: React.FC<{
  injury: Player["injuries"][number];
  team: Tables<"teams">;
  index: number;
}> = ({ injury, team }) => {
  const duration = dayjs.duration(
    dayjs(injury.ended_on).diff(dayjs(injury.started_on)),
  );

  return (
    <div>
      <Title c="pink" order={4}>
        {injury.description} Injury
      </Title>
      <Title c="pink" order={6}>
        {formatDate(injury.started_on)} -&nbsp;
        {injury.ended_on < team.currently_on
          ? formatDate(injury.ended_on)
          : "Present"}
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
  );
};

const LoanEvent: React.FC<{
  loan: Player["loans"][number];
  team: Tables<"teams">;
  index: number;
}> = ({ loan, team }) => {
  const title =
    loan.destination === team.name
      ? `Loan from ${loan.origin}`
      : `Loan at ${loan.destination}`;

  const subtitle = useMemo(() => {
    if (loan.started_on > team.currently_on) {
      return `Scheduled on ${formatDate(loan.started_on)}`;
    } else if (loan.ended_on > team.currently_on) {
      return `${formatDate(loan.started_on)} - Present`;
    } else {
      return `${formatDate(loan.started_on)} - ${formatDate(loan.ended_on)}`;
    }
  }, [loan.ended_on, loan.started_on, team.currently_on]);

  const timeBeforeDeparture = dayjs(loan.started_on).diff(
    dayjs(team.currently_on),
  );

  const duration = dayjs.duration(
    dayjs(loan.ended_on).diff(dayjs(loan.started_on)),
  );

  return (
    <div>
      <Title c="orange" order={4}>
        {title}
      </Title>
      <Title c="orange" order={6}>
        {!loan.signed_on && (
          <Badge variant="outline" color="red" mr="xs">
            UNSIGNED
          </Badge>
        )}
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
                <Table.Td colSpan={2} ta="center" fs="italic">
                  Loan-to-Buy Option
                </Table.Td>
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
  );
};

const TransferEvent: React.FC<{
  transfer: Player["transfers"][number];
  team: Tables<"teams">;
  index: number;
}> = ({ transfer, team }) => {
  const title =
    transfer.destination === team.name
      ? `Transfer from ${transfer.origin}`
      : `Transfer to ${transfer.destination}`;

  const color = transfer.destination === team.name ? "green" : "red";

  return (
    <div>
      <Title c={color} order={4}>
        {title}
      </Title>
      <Title c={color} order={6}>
        {!transfer.signed_on && (
          <Badge variant="outline" color="red" mr="xs">
            UNSIGNED
          </Badge>
        )}
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
  );
};

function playerEventIconName(item: PlayerEvent, team: Tables<"teams">): string {
  switch (item.type) {
    case PlayerEventType.Contract:
      return "i-mdi:file-sign";
    case PlayerEventType.Injury:
      return "i-mdi:ambulance";
    case PlayerEventType.Loan:
      return "i-mdi:transit-transfer";
    case PlayerEventType.Transfer:
      assertType<Player["transfers"][number]>(item);
      if (item.destination === team.name) {
        return "i-mdi:airplane-landing";
      } else {
        return "i-mdi:airplane-takeoff";
      }
  }
}

function playerEventColor(item: PlayerEvent, team: Tables<"teams">): string {
  switch (item.type) {
    case PlayerEventType.Contract:
      return "indigo";
    case PlayerEventType.Injury:
      return "pink";
    case PlayerEventType.Loan:
      return "orange";
    case PlayerEventType.Transfer:
      assertType<Player["transfers"][number]>(item);
      if (item.destination === team.name) {
        return "green";
      } else {
        return "red";
      }
  }
}
