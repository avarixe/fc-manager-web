import { Player } from "@/types";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  NumberFormatter,
  Stack,
  Table,
  Title,
} from "@mantine/core";
import { orderBy, sumBy } from "lodash-es";

export const Route = createLazyFileRoute("/teams/$teamId/seasons/$id")({
  component: SeasonPage,
});

type PlayerData = Pick<
  Player,
  | "id"
  | "name"
  | "pos"
  | "youth"
  | "transfers"
  | "loans"
  | "contracts"
  | "history"
>;

enum TransferActivityColor {
  TransferIn = "green",
  TransferOut = "red",
  LoanOut = "orange",
  LoanIn = "lime",
  Youth = "cyan",
  FreeIn = "blue",
  FreeOut = "grape",
}

function SeasonPage() {
  const { teamId, id } = Route.useParams();
  const { team, seasonLabel, currentSeason } = useTeam(teamId);
  const season = Number(id);

  const [players, setPlayers] = useState<PlayerData[]>([]);
  const supabase = useAtomValue(supabaseAtom);
  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from("players")
        .select("id, name, pos, youth, transfers, loans, contracts, history")
        .eq("team_id", teamId)
        .order("name", { ascending: true });
      if (data) {
        assertType<PlayerData[]>(data);
        setPlayers(data);
      }
    };
    fetchPlayers();
  }, [season, supabase, teamId]);

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Seasons", to: `/teams/${teamId}/competitions` },
      {
        title: `${seasonLabel(season)} Season`,
        to: `/teams/${teamId}/seasons/${id}`,
      },
    ]);
  }, [id, season, seasonLabel, setBreadcrumbs, team?.name, teamId]);

  if (!team) {
    return null;
  }

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        {seasonLabel(season)} Season
      </Title>

      <Group>
        <Button
          component={Link}
          to={`/teams/${team.id}/seasons/${season - 1}`}
          variant="default"
          disabled={season === 0}
        >
          Prev Season
        </Button>
        <Button
          component={Link}
          to={`/teams/${team.id}/matches/${season + 1}`}
          variant="default"
          disabled={season === currentSeason}
        >
          Next Season
        </Button>
      </Group>

      <Box my="lg">
        <Title order={2}>
          <Group>
            <div className="i-mdi:calendar-month" />
            Summary
          </Group>
        </Title>
        <Divider my="xs" />
        TODO
      </Box>

      <Box my="lg">
        <Title order={2}>
          <Group>
            <div className="i-mdi:trophy" />
            Competitions
          </Group>
        </Title>
        <Divider my="xs" />
        TODO
      </Box>

      <Box my="lg">
        <Title order={2}>
          <Group>
            <div className="i-mdi:airplane" />
            Transfer Activity
          </Group>
        </Title>
        <Divider my="xs" />
        <TransferActivity season={season} players={players} />
      </Box>
    </Stack>
  );
}

interface TransferActivityItem {
  playerId: number;
  name: string;
  pos: string;
  date: string;
  icon: {
    name: string;
    color: TransferActivityColor;
  };
  fromTo: string;
  value?: number;
  fee?: number;
  netValue?: number;
  addonClause?: number;
}

const TransferActivity: React.FC<{
  season: number;
  players: PlayerData[];
}> = ({ season, players }) => {
  const team = useAtomValue(teamAtom)!;
  const { seasonOn, startOfSeason, endOfSeason, currentSeason } =
    useTeamHelpers(team);

  const transferItems = useMemo(() => {
    return players.reduce((transfers: TransferActivityItem[], player) => {
      player.transfers.forEach((transfer) => {
        if (seasonOn(transfer.moved_on) === season && transfer.signed_on) {
          const direction = transfer.origin === team.name ? "out" : "in";
          const playerValue = playerValueAt(player, transfer.moved_on);
          const value = (direction === "out" ? -1 : 1) * (playerValue ?? 0);
          const fee = (direction === "out" ? 1 : -1) * transfer.fee;
          transfers.push({
            playerId: player.id,
            name: player.name,
            pos: player.pos,
            date: transfer.signed_on,
            icon: {
              name:
                direction === "out"
                  ? "i-mdi:airplane-takeoff"
                  : "i-mdi:airplane-landing",
              color:
                direction === "out"
                  ? TransferActivityColor.TransferOut
                  : TransferActivityColor.TransferIn,
            },
            fromTo:
              direction === "out" ? transfer.destination : transfer.origin,
            value,
            fee,
            netValue: value + fee,
          });
        }
      });
      return transfers;
    }, []);
  }, [players, season, seasonOn, team.name]);

  const loanItems = useMemo(() => {
    return players.reduce((loans: TransferActivityItem[], player) => {
      player.loans.forEach((loan) => {
        if (loan.signed_on) {
          const direction = loan.origin === team.name ? "out" : "in";
          const fromTo = direction === "out" ? loan.destination : loan.origin;

          if (seasonOn(loan.started_on) === season) {
            loans.push({
              playerId: player.id,
              name: player.name,
              pos: player.pos,
              date: loan.started_on,
              icon: {
                name:
                  direction === "out"
                    ? "i-mdi:account-arrow-right"
                    : "i-mdi:account-arrow-left",
                color:
                  direction === "out"
                    ? TransferActivityColor.LoanOut
                    : TransferActivityColor.LoanIn,
              },
              fromTo,
            });
          }

          const loanEndedByTransfer = transferItems.some((item) => {
            return item.playerId === player.id && item.date === loan.ended_on;
          });
          if (seasonOn(loan.ended_on) === season && !loanEndedByTransfer) {
            loans.push({
              playerId: player.id,
              name: player.name,
              pos: player.pos,
              date: loan.ended_on,
              icon: {
                name:
                  direction === "out"
                    ? "i-mdi:account-arrow-left"
                    : "i-mdi:account-arrow-right",
                color:
                  direction === "out"
                    ? TransferActivityColor.LoanIn
                    : TransferActivityColor.LoanOut,
              },
              fromTo,
            });
          }
        }
      });

      return loans;
    }, []);
  }, [players, season, seasonOn, team.name, transferItems]);

  const arrivalItems = useMemo(() => {
    return players.reduce((arrivals: TransferActivityItem[], player) => {
      player.contracts.forEach((contract, i) => {
        // Don't show arrivals for players who were already at the club.
        if (team.started_on === contract.started_on) return;

        // Don't include renewal contracts.
        const previousContract = player.contracts[i - 1];
        const isRenewal = previousContract?.conclusion === "Renewed";
        if (isRenewal) return;

        // Don't include transfers since they are already included.
        const isTransfer = transferItems.some((item) => {
          return (
            item.playerId === player.id &&
            item.date === contract.started_on &&
            item.icon.color === TransferActivityColor.TransferIn
          );
        });
        if (isTransfer) return;

        // Don't include loans since they are already included.
        const isLoan = loanItems.some((item) => {
          return (
            item.playerId === player.id &&
            item.date === contract.started_on &&
            item.icon.color === TransferActivityColor.LoanIn
          );
        });
        if (isLoan) return;

        if (seasonOn(contract.started_on) === season) {
          const playerValue = playerValueAt(player, contract.started_on);
          arrivals.push({
            playerId: player.id,
            name: player.name,
            pos: player.pos,
            date: contract.started_on,
            icon: {
              name: player.youth ? "i-mdi:school" : "i-mdi:human-greeting",
              color: player.youth
                ? TransferActivityColor.Youth
                : TransferActivityColor.FreeIn,
            },
            fromTo: player.youth ? "Youth Academy" : "Free Agent",
            value: playerValue ?? 0,
            netValue: playerValue ?? 0,
          });
        }
      });
      return arrivals;
    }, []);
  }, [loanItems, players, season, seasonOn, team.started_on, transferItems]);

  const seasonStart = useMemo(
    () => startOfSeason(season),
    [season, startOfSeason],
  );
  const seasonEnd = useMemo(() => endOfSeason(season), [season, endOfSeason]);
  const departureItems = useMemo(() => {
    return players.reduce((departures: TransferActivityItem[], player) => {
      player.contracts.forEach((contract) => {
        if (
          seasonStart <= contract.ended_on &&
          contract.ended_on <= seasonEnd &&
          !["Renewed", "Transferred"].includes(contract.conclusion ?? "") &&
          !loanItems.some(
            (loan) =>
              loan.playerId === player.id &&
              loan.date === contract.ended_on &&
              loan.icon.color === TransferActivityColor.LoanOut,
          )
        ) {
          const playerValue = playerValueAt(player, contract.ended_on);
          departures.push({
            playerId: player.id,
            name: player.name,
            pos: player.pos,
            date: contract.ended_on,
            icon: {
              name: "i-mdi:exit-run",
              color: TransferActivityColor.FreeOut,
            },
            fromTo: `(${contract.conclusion ?? "Expired"})`,
            value: -(playerValue ?? 0),
            netValue: -(playerValue ?? 0),
          });
        }
      });
      return departures;
    }, []);
  }, [loanItems, players, seasonEnd, seasonStart]);

  const [showUpcoming, setShowUpcoming] = useState(false);
  const items = useMemo(() => {
    return orderBy(
      [...transferItems, ...loanItems, ...arrivalItems, ...departureItems],
      ["date"],
      ["asc"],
    ).filter((item) => showUpcoming || item.date <= team.currently_on);
  }, [
    arrivalItems,
    departureItems,
    loanItems,
    showUpcoming,
    team.currently_on,
    transferItems,
  ]);

  const activityCounts = useMemo(() => {
    return items.reduce(
      (counts, item) => {
        counts[item.icon.color] += 1;
        return counts;
      },
      {
        [TransferActivityColor.Youth]: 0,
        [TransferActivityColor.FreeIn]: 0,
        [TransferActivityColor.FreeOut]: 0,
        [TransferActivityColor.TransferIn]: 0,
        [TransferActivityColor.TransferOut]: 0,
        [TransferActivityColor.LoanIn]: 0,
        [TransferActivityColor.LoanOut]: 0,
      },
    );
  }, [items]);
  const totalValue = useMemo(() => sumBy(items, "value"), [items]);
  const totalFee = useMemo(() => sumBy(items, "fee"), [items]);
  const totalNetValue = useMemo(() => sumBy(items, "netValue"), [items]);

  return (
    <Table.ScrollContainer minWidth={600}>
      <Table highlightOnHover captionSide="top">
        {season >= currentSeason && (
          <Table.Caption>
            <Checkbox
              checked={showUpcoming}
              onChange={(event) => setShowUpcoming(event.currentTarget.checked)}
              label="Show upcoming transfer activity"
            />
          </Table.Caption>
        )}
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Player</Table.Th>
            <Table.Th ta="center">Pos</Table.Th>
            <Table.Th ta="center">Date</Table.Th>
            <Table.Th></Table.Th>
            <Table.Th>From/To</Table.Th>
            <Table.Th ta="end">Value</Table.Th>
            <Table.Th ta="end">Fee</Table.Th>
            <Table.Th ta="end">Net Value</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((item, i) => (
            <Table.Tr key={i} opacity={item.date > team.currently_on ? 0.5 : 1}>
              <Table.Td>
                <Button
                  component={Link}
                  to={`/teams/${team.id}/players/${item.playerId}`}
                  variant="subtle"
                  size="compact-xs"
                >
                  {item.name}
                </Button>
              </Table.Td>
              <Table.Td ta="center">{item.pos}</Table.Td>
              <Table.Td ta="center" className="min-w-16">
                {formatDate(item.date, "MMM DD")}
              </Table.Td>
              <Table.Td>
                <BaseIcon name={item.icon.name} c={item.icon.color} />
              </Table.Td>
              <Table.Td>{item.fromTo}</Table.Td>
              <Table.Td ta="end" c={numberCellColor(item.value)}>
                <NumberFormatter
                  value={item.value}
                  prefix={team.currency}
                  thousandSeparator
                />
              </Table.Td>
              <Table.Td ta="end" c={numberCellColor(item.fee)}>
                <NumberFormatter
                  value={item.fee}
                  prefix={team.currency}
                  thousandSeparator
                />
              </Table.Td>
              <Table.Td ta="end" c={numberCellColor(item.netValue)}>
                <NumberFormatter
                  value={item.netValue}
                  prefix={team.currency}
                  thousandSeparator
                />
              </Table.Td>
            </Table.Tr>
          ))}
          <Table.Tr>
            <Table.Th pl="md">Summary</Table.Th>
            <Table.Th colSpan={4}>
              <Box>
                <Group gap="xs">
                  {String(activityCounts[TransferActivityColor.Youth])}
                  <BaseIcon
                    name="i-mdi:school"
                    c={TransferActivityColor.Youth}
                  />
                  Youth Academy
                </Group>
                <Group gap="xs">
                  {String(activityCounts[TransferActivityColor.FreeIn])}
                  <BaseIcon
                    name="i-mdi:human-greeting"
                    c={TransferActivityColor.FreeIn}
                  />
                  Free Agents
                </Group>
                <Group gap="xs">
                  {String(activityCounts[TransferActivityColor.TransferIn])}
                  <BaseIcon
                    name="i-mdi:airplane-landing"
                    c={TransferActivityColor.TransferIn}
                  />
                  Transfers In
                </Group>
                <Group gap="xs">
                  {String(activityCounts[TransferActivityColor.TransferOut])}
                  <BaseIcon
                    name="i-mdi:airplane-takeoff"
                    c={TransferActivityColor.TransferOut}
                  />
                  Transfers Out
                </Group>
                <Group gap="xs">
                  {String(activityCounts[TransferActivityColor.FreeOut])}
                  <BaseIcon
                    name="i-mdi:exit-run"
                    c={TransferActivityColor.FreeOut}
                  />
                  Departures
                </Group>
              </Box>
            </Table.Th>
            <Table.Th ta="end" c={numberCellColor(totalValue)}>
              <NumberFormatter
                value={totalValue}
                prefix={team.currency}
                thousandSeparator
              />
            </Table.Th>
            <Table.Th ta="end" c={numberCellColor(totalFee)}>
              <NumberFormatter
                value={totalFee}
                prefix={team.currency}
                thousandSeparator
              />
            </Table.Th>
            <Table.Th ta="end" c={numberCellColor(totalNetValue)}>
              <NumberFormatter
                value={totalNetValue}
                prefix={team.currency}
                thousandSeparator
              />
            </Table.Th>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
};

function numberCellColor(value?: number) {
  if (!value) return undefined;

  return value < 0 ? "red" : "green";
}
