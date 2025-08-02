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
import dayjs from "dayjs";
import { useAtomValue } from "jotai";
import { orderBy } from "lodash-es";
import { useCallback, useMemo } from "react";

import { teamAtom } from "@/atoms";
import {
  ContractIcon,
  InjuryIcon,
  LoanIcon,
  TransferIcon,
  TransferInIcon,
  TransferOutIcon,
} from "@/components/base/CommonIcons";
import { ContractForm } from "@/components/player/ContractForm";
import { InjuryForm } from "@/components/player/InjuryForm";
import { LoanForm } from "@/components/player/LoanForm";
import { TransferForm } from "@/components/player/TransferForm";
import { PlayerEventKey, PlayerEventType } from "@/constants";
import { useManagePlayerEvents } from "@/hooks/useManagePlayerEvents";
import { useTeamHelpers } from "@/hooks/useTeamHelpers";
import {
  Contract,
  Injury,
  Loan,
  Player,
  StateSetter,
  Team,
  Transfer,
} from "@/types";
import { formatDate } from "@/utils/format";

interface BasePlayerEvent {
  date: string;
  priority: number;
  index: number;
}

interface ContractEvent extends BasePlayerEvent, Contract {
  type: PlayerEventType.Contract;
}

interface InjuryEvent extends BasePlayerEvent, Injury {
  type: PlayerEventType.Injury;
}

interface LoanEvent extends BasePlayerEvent, Loan {
  type: PlayerEventType.Loan;
}

interface TransferEvent extends BasePlayerEvent, Transfer {
  type: PlayerEventType.Transfer;
}

type PlayerTimelineEvent =
  | ContractEvent
  | InjuryEvent
  | LoanEvent
  | TransferEvent;

export const PlayerTimeline: React.FC<{
  player: Player;
  setPlayer: StateSetter<Player | null>;
}> = ({ player, setPlayer }) => {
  const team = useAtomValue(teamAtom)!;
  const items: PlayerTimelineEvent[] = useMemo(
    () =>
      orderBy(
        [
          ...player.contracts.map((contract, index) => ({
            type: PlayerEventType.Contract as const,
            date: contract.started_on,
            priority: 2,
            index,
            ...contract,
          })),
          ...player.injuries.map((injury, index) => ({
            type: PlayerEventType.Injury as const,
            date: injury.started_on,
            priority: 3,
            index,
            ...injury,
          })),
          ...player.loans.map((loan, index) => ({
            type: PlayerEventType.Loan as const,
            date: loan.started_on,
            priority: loan.destination === team.name ? 1 : 4,
            index,
            ...loan,
          })),
          ...player.transfers.map((transfer, index) => ({
            type: PlayerEventType.Transfer as const,
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

  const {
    create: createContract,
    update: updateContract,
    remove: removeContract,
  } = useManagePlayerEvents(player, setPlayer, PlayerEventKey.Contract, {
    beforeCreate: (contracts) => {
      const contract = contracts[contracts.length - 1];
      if (contract.signed_on) {
        // Update previous contract as Renewed.
        const previousContract = contracts[contracts.length - 2];
        if (
          previousContract &&
          contract.started_on < previousContract.ended_on
        ) {
          previousContract.ended_on = contract.started_on;
          previousContract.conclusion = "Renewed";
        }

        // Update player current wage and contract end date.
        return {
          contracts,
          wage: contract.wage,
          contract_ends_on: contract.ended_on,
        };
      }

      return { contracts };
    },
    beforeUpdate: (contracts) => {
      const currentContract = contracts.find(
        (contract) => !contract.conclusion,
      );
      if (currentContract) {
        // Update player current wage and contract end date.
        return {
          contracts,
          wage: currentContract.wage,
          contract_ends_on: currentContract.ended_on,
        };
      }

      return { contracts };
    },
  });
  const {
    create: createInjury,
    update: updateInjury,
    remove: removeInjury,
  } = useManagePlayerEvents(player, setPlayer, PlayerEventKey.Injury);
  const {
    create: createLoan,
    update: updateLoan,
    remove: removeLoan,
  } = useManagePlayerEvents(player, setPlayer, PlayerEventKey.Loan);
  const {
    create: createTransfer,
    update: updateTransfer,
    remove: removeTransfer,
  } = useManagePlayerEvents(player, setPlayer, PlayerEventKey.Transfer, {
    beforeCreate: (transfers) => {
      const transfer = transfers[transfers.length - 1];
      if (transfer.signed_on && transfer.origin === team.name) {
        // End current contract if player transfers out.
        const contracts = [...player.contracts];
        const currentContract = contracts[contracts.length - 1];
        currentContract.ended_on = transfer.moved_on;
        currentContract.conclusion = "Transferred";

        return { contracts, transfers };
      }

      return { transfers };
    },
    beforeUpdate: (transfers) => {
      const transfer = transfers[transfers.length - 1];
      if (transfer.signed_on && transfer.origin === team.name) {
        // End current contract if player transfers out.
        const contracts = [...player.contracts];
        const currentContract = contracts[contracts.length - 1];
        currentContract.ended_on = transfer.moved_on;
        currentContract.conclusion = "Transferred";

        return { contracts, transfers };
      }

      return { transfers };
    },
  });

  const onClickActivateTransfer = useCallback(
    async (loan: Loan & PlayerTimelineEvent) => {
      modals.openConfirmModal({
        title: `Activate transfer for ${player.name}?`,
        centered: true,
        labels: {
          confirm: "Yes",
          cancel: "No",
        },
        onConfirm: async () => {
          // Update loan end date to current team date
          const updatedLoan = { ...loan, ended_on: team.currently_on };
          await updateLoan(loan.index, updatedLoan);

          // Create transfer event
          const transfer: Transfer = {
            signed_on: team.currently_on,
            moved_on: team.currently_on,
            origin: loan.origin,
            destination: loan.destination,
            fee: loan.transfer_fee ?? 0,
            addon_clause: loan.addon_clause ?? 0,
          };
          await createTransfer(transfer);

          // Update current contract
          const contracts = [...player.contracts];
          const currentContract = contracts[contracts.length - 1];
          currentContract.ended_on = team.currently_on;
          currentContract.conclusion = "Transferred";
          await updateContract(contracts.length - 1, currentContract);
        },
      });
    },
    [
      team.currently_on,
      updateLoan,
      createTransfer,
      updateContract,
      player.contracts,
      player.name,
    ],
  );

  const { endOfCurrentSeason } = useTeamHelpers(team);
  const onClickRetire = useCallback(() => {
    modals.openConfirmModal({
      title: `${player.name} is retiring at the end of the season?`,
      centered: true,
      labels: {
        confirm: "Yes",
        cancel: "No",
      },
      onConfirm: async () => {
        const contracts = [...player.contracts];
        const currentContract = contracts[contracts.length - 1];
        currentContract.ended_on = endOfCurrentSeason;
        currentContract.conclusion = "Retired";
        await updateContract(contracts.length - 1, currentContract);
      },
    });
  }, [endOfCurrentSeason, player.contracts, player.name, updateContract]);
  const onClickRelease = useCallback(() => {
    modals.openConfirmModal({
      title: `Terminate contract for ${player.name}?`,
      centered: true,
      labels: {
        confirm: "Yes",
        cancel: "No",
      },
      confirmProps: { color: "red.9" },
      onConfirm: async () => {
        const contracts = [...player.contracts];
        const currentContract = contracts[contracts.length - 1];
        currentContract.ended_on = team.currently_on;
        currentContract.conclusion = "Released";
        await updateContract(contracts.length - 1, currentContract);
      },
    });
  }, [player.contracts, player.name, team.currently_on, updateContract]);

  const renderItem = useCallback(
    (item: PlayerTimelineEvent) => {
      switch (item.type) {
        case PlayerEventType.Contract:
          return (
            <ContractEvent
              contract={item}
              onSubmit={(contract) => updateContract(item.index, contract)}
              onRemove={() => removeContract(item.index)}
            />
          );
        case PlayerEventType.Injury:
          return (
            <InjuryEvent
              injury={item}
              onSubmit={(injury) => updateInjury(item.index, injury)}
              onRemove={() => removeInjury(item.index)}
            />
          );
        case PlayerEventType.Loan:
          return (
            <LoanEvent
              loan={item}
              onSubmit={(loan) => updateLoan(item.index, loan)}
              onRemove={() => removeLoan(item.index)}
              onClickActivateTransfer={() => onClickActivateTransfer(item)}
            />
          );
        case PlayerEventType.Transfer:
          return (
            <TransferEvent
              transfer={item}
              onSubmit={(transfer) => updateTransfer(item.index, transfer)}
              onRemove={() => removeTransfer(item.index)}
            />
          );
      }
    },
    [
      updateContract,
      removeContract,
      updateInjury,
      removeInjury,
      updateLoan,
      removeLoan,
      onClickActivateTransfer,
      updateTransfer,
      removeTransfer,
    ],
  );

  const [
    newContractOpened,
    { open: openNewContract, close: closeNewContract },
  ] = useDisclosure();
  const [newInjuryOpened, { open: openNewInjury, close: closeNewInjury }] =
    useDisclosure();
  const [newLoanOpened, { open: openNewLoan, close: closeNewLoan }] =
    useDisclosure();
  const [
    newTransferOpened,
    { open: openNewTransfer, close: closeNewTransfer },
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
        <Group>
          <Button
            onClick={openNewContract}
            color="indigo"
            leftSection={<ContractIcon c="white" />}
          >
            Contract
          </Button>
          <ContractForm
            opened={newContractOpened}
            onClose={closeNewContract}
            onSubmit={createContract}
          />
          <Button
            onClick={openNewInjury}
            color="pink"
            leftSection={<InjuryIcon c="white" />}
          >
            Injury
          </Button>
          <InjuryForm
            opened={newInjuryOpened}
            onClose={closeNewInjury}
            onSubmit={createInjury}
          />
          <Button
            onClick={openNewLoan}
            color="orange"
            leftSection={<LoanIcon c="white" />}
          >
            Loan
          </Button>
          <LoanForm
            direction={player.status ? "out" : "in"}
            opened={newLoanOpened}
            onClose={closeNewLoan}
            onSubmit={createLoan}
          />
          <Button
            onClick={openNewTransfer}
            color="green"
            leftSection={<TransferIcon c="white" />}
          >
            Transfer
          </Button>
          <TransferForm
            direction={player.status ? "out" : "in"}
            opened={newTransferOpened}
            onClose={closeNewTransfer}
            onSubmit={createTransfer}
          />
          <Button
            onClick={onClickRetire}
            color="gray.6"
            leftSection={<div className="i-mdi:weather-sunset" />}
          >
            Retire
          </Button>
          <Button
            onClick={onClickRelease}
            color="red.9"
            leftSection={<div className="i-mdi:file-document-remove" />}
          >
            Release
          </Button>
        </Group>
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
              {playerEventIcon(item, team)}
            </ThemeIcon>
          }
        >
          {renderItem(item)}
        </Timeline.Item>
      ))}
    </Timeline>
  );
};

const ContractEvent: React.FC<{
  contract: Contract;
  onSubmit: (contract: Contract) => Promise<void>;
  onRemove: () => Promise<void>;
}> = ({ contract, onSubmit, onRemove }) => {
  const team = useAtomValue(teamAtom)!;
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
  injury: Injury;
  onSubmit: (injury: Injury) => Promise<void>;
  onRemove: () => Promise<void>;
}> = ({ injury, onSubmit, onRemove }) => {
  const team = useAtomValue(teamAtom)!;
  const duration = dayjs.duration(
    dayjs(injury.ended_on).diff(dayjs(injury.started_on)),
  );
  const [opened, { open, close }] = useDisclosure();

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

      <Group mt="sm">
        <Button
          onClick={open}
          variant="subtle"
          size="compact-sm"
          color="orange"
        >
          Edit
        </Button>
        <InjuryForm
          record={injury}
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

const LoanEvent: React.FC<{
  loan: Loan;
  onSubmit: (loan: Loan) => Promise<void>;
  onRemove: () => Promise<void>;
  onClickActivateTransfer: () => Promise<void>;
}> = ({ loan, onSubmit, onRemove, onClickActivateTransfer }) => {
  const team = useAtomValue(teamAtom)!;

  const direction = loan.destination === team.name ? "in" : "out";
  const title =
    direction === "in"
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

  const timeBeforeDeparture = dayjs.duration(
    dayjs(loan.started_on).diff(dayjs(team.currently_on)),
  );
  const duration = dayjs.duration(
    dayjs(loan.ended_on).diff(dayjs(loan.started_on)),
  );

  const [opened, { open, close }] = useDisclosure();

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

      <Group mt="sm">
        <Button
          onClick={open}
          variant="subtle"
          size="compact-sm"
          color="orange"
        >
          Edit
        </Button>
        <LoanForm
          record={loan}
          direction={direction}
          opened={opened}
          onClose={close}
          onSubmit={onSubmit}
        />
        {Boolean(loan.transfer_fee || loan.addon_clause) && (
          <Button
            onClick={onClickActivateTransfer}
            variant="subtle"
            size="compact-sm"
            color="red"
          >
            Activate Transfer
          </Button>
        )}
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

const TransferEvent: React.FC<{
  transfer: Transfer;
  onSubmit: (injury: Transfer) => Promise<void>;
  onRemove: () => Promise<void>;
}> = ({ transfer, onSubmit, onRemove }) => {
  const team = useAtomValue(teamAtom)!;
  const direction = transfer.destination === team.name ? "in" : "out";
  const color = direction === "in" ? "green" : "red";
  const title =
    direction === "in"
      ? `Transfer from ${transfer.origin}`
      : `Transfer to ${transfer.destination}`;

  const [opened, { open, close }] = useDisclosure();

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

      <Group mt="sm">
        <Button
          onClick={open}
          variant="subtle"
          size="compact-sm"
          color="orange"
        >
          Edit
        </Button>
        <TransferForm
          record={transfer}
          direction={direction}
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

function playerEventIcon(item: PlayerTimelineEvent, team: Team) {
  switch (item.type) {
    case PlayerEventType.Contract:
      return <ContractIcon c="white" />;
    case PlayerEventType.Injury:
      return <InjuryIcon c="white" />;
    case PlayerEventType.Loan:
      return <LoanIcon c="white" />;
    case PlayerEventType.Transfer:
      if (item.destination === team.name) {
        return <TransferInIcon c="white" />;
      } else {
        return <TransferOutIcon c="white" />;
      }
  }
}

function playerEventColor(item: PlayerTimelineEvent, team: Team): string {
  switch (item.type) {
    case PlayerEventType.Contract:
      return "indigo";
    case PlayerEventType.Injury:
      return "pink";
    case PlayerEventType.Loan:
      return "orange";
    case PlayerEventType.Transfer:
      if (item.destination === team.name) {
        return "green";
      } else {
        return "red";
      }
  }
}
