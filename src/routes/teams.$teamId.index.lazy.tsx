import {
  Avatar,
  Box,
  Button,
  Card,
  Group,
  Indicator,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { useEffect, useState } from "react";

import { appLoadingAtom, breadcrumbsAtom, teamAtom } from "@/atoms";
import { BaseIcon } from "@/components/base/CommonIcons";
import { CompetitionList } from "@/components/competition/CompetitionList";
import { TeamBadgeUploader } from "@/components/team/TeamBadgeUploader";
import { Tables } from "@/database.types";
import { useTeam } from "@/hooks/useTeam";
import { Player } from "@/types";
import { formatDate } from "@/utils/format";
import { matchScore } from "@/utils/match";
import { abbrevValue, playerValueColor } from "@/utils/player";
import { supabase } from "@/utils/supabase";

type CompetitionInfo = Pick<Tables<"competitions">, "id" | "name" | "champion">;
type MatchInfo = Pick<
  Tables<"matches">,
  | "id"
  | "home_team"
  | "away_team"
  | "home_score"
  | "away_score"
  | "home_penalty_score"
  | "away_penalty_score"
  | "competition"
  | "stage"
  | "played_on"
>;
type InjuryInfo = Pick<Player, "id" | "name" | "pos" | "injuries">;
type LoanInfo = Pick<Player, "id" | "name" | "pos" | "value" | "loans">;
type PlayerContractInfo = Pick<
  Player,
  "id" | "name" | "pos" | "value" | "wage" | "contracts"
>;

export const Route = createLazyFileRoute("/teams/$teamId/")({
  component: TeamPage,
});

function TeamPage() {
  const { teamId } = Route.useParams();
  const { team, currentSeason, endOfCurrentSeason } = useTeam(teamId);
  const setTeam = useSetAtom(teamAtom);

  const [competitions, setCompetitions] = useState<CompetitionInfo[]>([]);

  useEffect(() => {
    const fetchCompetitions = async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, name, champion")
        .eq("team_id", Number(teamId))
        .eq("season", currentSeason)
        .order("id", { ascending: true });
      if (error) {
        console.error(error);
      } else {
        setCompetitions(data);
      }
    };

    fetchCompetitions();
  }, [teamId, currentSeason]);

  const [latestMatch, setLatestMatch] = useState<MatchInfo | null>(null);
  useEffect(() => {
    const fetchLatestMatch = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(
          "id, home_team, away_team, home_score, away_score, home_penalty_score, away_penalty_score, competition, stage, played_on",
        )
        .eq("team_id", Number(teamId))
        .order("played_on", { ascending: false })
        .limit(1)
        .single();
      if (error) {
        console.error(error);
      } else {
        setLatestMatch(data);
      }
    };

    fetchLatestMatch();
  }, [teamId]);

  const [injuredPlayers, setInjuredPlayers] = useState<InjuryInfo[]>([]);
  useEffect(() => {
    const fetchInjuredPlayers = async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, pos, injuries")
        .eq("team_id", Number(teamId))
        .eq("status", "Injured");
      if (error) {
        console.error(error);
      } else {
        setInjuredPlayers(data);
      }
    };

    fetchInjuredPlayers();
  }, [teamId]);

  const [loanedPlayers, setLoanedPlayers] = useState<LoanInfo[]>([]);
  useEffect(() => {
    const fetchLoanedPlayers = async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, pos, value, loans")
        .eq("team_id", Number(teamId))
        .eq("status", "Loaned");
      if (error) {
        console.error(error);
      } else {
        setLoanedPlayers(data);
      }
    };

    fetchLoanedPlayers();
  }, [teamId]);

  const [expiringContracts, setExpiringContracts] = useState<
    PlayerContractInfo[]
  >([]);
  const [releaseClausePlayers, setReleaseClausePlayers] = useState<
    PlayerContractInfo[]
  >([]);
  useEffect(() => {
    const fetchContractData = async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, pos, value, wage, contracts, contract_ends_on")
        .eq("team_id", Number(teamId))
        .neq("status", null);
      if (error) {
        console.error(error);
      } else {
        // Filter expiring contracts
        const expiring = data.filter((player) => {
          if (!endOfCurrentSeason) return false;
          return (
            player.contract_ends_on &&
            player.contract_ends_on <= endOfCurrentSeason
          );
        });

        // Filter players with release clauses
        const withReleaseClauses = data.filter((player) => {
          if (!player.contracts || !Array.isArray(player.contracts))
            return false;
          const latestContract = player.contracts[player.contracts.length - 1];
          return latestContract && latestContract.release_clause;
        });

        setExpiringContracts(expiring);
        setReleaseClausePlayers(withReleaseClauses);
      }
    };

    fetchContractData();
  }, [endOfCurrentSeason, teamId]);

  const setAppLoading = useSetAtom(appLoadingAtom);
  const navigate = useNavigate();
  const onClickDelete = () => {
    modals.openConfirmModal({
      title: "Delete Team",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this team? This action cannot be
          undone.
        </Text>
      ),
      labels: {
        confirm: "Delete",
        cancel: "Cancel",
      },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          setAppLoading(true);
          await supabase.from("teams").delete().eq("id", Number(teamId));
          setTeam(null);
          navigate({ to: "/teams" });
        } catch (error) {
          console.error(error);
        } finally {
          setAppLoading(false);
        }
      },
    });
  };

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
    ]);
  }, [setBreadcrumbs, team?.name, teamId]);

  const [badgeFormOpened, { open: openBadgeForm, close: closeBadgeForm }] =
    useDisclosure();

  if (!team) {
    return null;
  }

  return (
    <Stack>
      <Box mb="xl">
        <Group>
          <Indicator
            onClick={openBadgeForm}
            label={<BaseIcon name="i-mdi:circle-edit-outline" fz={15} />}
            color="transparent"
            inline
            position="top-end"
            zIndex={1}
            className="cursor-pointer"
          >
            <Avatar src={team.badge_path}>
              <BaseIcon name="i-mdi:shield-half-full" fz={20} />
            </Avatar>
          </Indicator>
          <TeamBadgeUploader
            opened={badgeFormOpened}
            onClose={closeBadgeForm}
          />
          <Box>
            <Title fw="lighter">{team.name}</Title>
            <Title order={6}>Manager: {team.manager_name}</Title>
            <Title order={6}>Game: {team.game}</Title>
          </Box>
        </Group>
      </Box>
      <Group>
        <Button component={Link} to={`/teams/${team.id}/edit`}>
          Edit
        </Button>
        <Button
          onClick={onClickDelete}
          variant="outline"
          color="red"
          className="ml-auto"
        >
          Delete
        </Button>
      </Group>

      <Group grow align="start">
        <Stack>
          {latestMatch && (
            <Card bg="transparent" withBorder>
              <Title order={4} mb="lg">
                Latest Match
              </Title>
              <Box ta="center">
                <Box fz="sm">
                  {latestMatch.competition}
                  {latestMatch.stage && ` · ${latestMatch.stage}`}
                </Box>
                <Box fz="xl" fw="bold">
                  {latestMatch.home_team} v {latestMatch.away_team}
                </Box>
                <Box fz="xl" fw="bolder" mt="md">
                  {matchScore(latestMatch)}
                </Box>
                <Box fz="sm">{formatDate(latestMatch.played_on)}</Box>

                <Button
                  component={Link}
                  to={`/teams/${teamId}/matches/${latestMatch.id}`}
                  variant="subtle"
                  mt="md"
                >
                  Go to Match
                </Button>
              </Box>
            </Card>
          )}
          <Card bg="transparent" withBorder>
            <Title order={4} mb="lg">
              Current Season
            </Title>
            <CompetitionList
              competitions={competitions}
              season={currentSeason}
              team={team}
            />
          </Card>
        </Stack>
        <Stack>
          <Card bg="transparent" withBorder>
            <Title order={4} mb="lg">
              Injured Players
            </Title>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Player</Table.Th>
                  <Table.Th ta="center">Position</Table.Th>
                  <Table.Th>Injury</Table.Th>
                  <Table.Th ta="end">Recovers On</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {injuredPlayers.map((player) => {
                  const latestInjury =
                    player.injuries[player.injuries.length - 1];
                  return (
                    <Table.Tr key={player.id}>
                      <Table.Td>
                        <Button
                          component={Link}
                          to={`/teams/${teamId}/players/${player.id}`}
                          variant="subtle"
                          size="compact-sm"
                        >
                          {player.name}
                        </Button>
                      </Table.Td>
                      <Table.Td ta="center">{player.pos}</Table.Td>
                      <Table.Td>{latestInjury.description}</Table.Td>
                      <Table.Td ta="end">
                        {formatDate(latestInjury.ended_on)}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
                {injuredPlayers.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={4} ta="center" fs="italic">
                      No Injured Players
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>
          <Card bg="transparent" withBorder>
            <Title order={4} mb="lg">
              Loaned Players
            </Title>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Player</Table.Th>
                  <Table.Th ta="center">Position</Table.Th>
                  <Table.Th ta="end">Value</Table.Th>
                  <Table.Th ta="end">Transfer Fee</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {loanedPlayers.map((player) => {
                  const latestLoan = player.loans[player.loans.length - 1];
                  const isValueHigher =
                    player.value > (latestLoan.transfer_fee ?? 0);
                  return (
                    <Table.Tr key={player.id}>
                      <Table.Td>
                        <Button
                          component={Link}
                          to={`/teams/${teamId}/players/${player.id}`}
                          variant="subtle"
                          size="compact-sm"
                        >
                          {player.name}
                        </Button>
                      </Table.Td>
                      <Table.Td ta="center">{player.pos}</Table.Td>
                      <Table.Td ta="end" c={playerValueColor(player.value)}>
                        {abbrevValue(player.value, team.currency)}
                      </Table.Td>
                      <Table.Td ta="end" c={isValueHigher ? "red" : undefined}>
                        {abbrevValue(
                          latestLoan.transfer_fee ?? undefined,
                          team.currency,
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
                {loanedPlayers.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={4} ta="center" fs="italic">
                      No Loaned Players
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>
          <Card bg="transparent" withBorder>
            <Title order={4} mb="lg">
              Expiring Contracts
            </Title>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Player</Table.Th>
                  <Table.Th ta="center">Position</Table.Th>
                  <Table.Th ta="end">Value</Table.Th>
                  <Table.Th ta="end">Wage</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {expiringContracts.map((player) => (
                  <Table.Tr key={player.id}>
                    <Table.Td>
                      <Button
                        component={Link}
                        to={`/teams/${teamId}/players/${player.id}`}
                        variant="subtle"
                        size="compact-sm"
                      >
                        {player.name}
                      </Button>
                    </Table.Td>
                    <Table.Td ta="center">{player.pos}</Table.Td>
                    <Table.Td ta="end" c={playerValueColor(player.value)}>
                      {abbrevValue(player.value, team.currency)}
                    </Table.Td>
                    <Table.Td ta="end">
                      {abbrevValue(player.wage ?? 0, team.currency)}
                    </Table.Td>
                  </Table.Tr>
                ))}
                {expiringContracts.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={4} ta="center" fs="italic">
                      No Expiring Contracts
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>
          <Card bg="transparent" withBorder>
            <Title order={4} mb="lg">
              Release Clauses
            </Title>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Player</Table.Th>
                  <Table.Th ta="center">Position</Table.Th>
                  <Table.Th ta="end">Value</Table.Th>
                  <Table.Th ta="end">Release Clause</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {releaseClausePlayers.map((player) => {
                  const latestContract =
                    player.contracts[player.contracts.length - 1];
                  const releaseClause = latestContract?.release_clause;
                  const isValueHigher = player.value > (releaseClause ?? 0);

                  return (
                    <Table.Tr key={player.id}>
                      <Table.Td>
                        <Button
                          component={Link}
                          to={`/teams/${teamId}/players/${player.id}`}
                          variant="subtle"
                          size="compact-sm"
                        >
                          {player.name}
                        </Button>
                      </Table.Td>
                      <Table.Td ta="center">{player.pos}</Table.Td>
                      <Table.Td ta="end" c={playerValueColor(player.value)}>
                        {abbrevValue(player.value, team.currency)}
                      </Table.Td>
                      <Table.Td ta="end" c={isValueHigher ? "red" : undefined}>
                        {abbrevValue(releaseClause ?? 0, team.currency)}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
                {releaseClausePlayers.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={4} ta="center" fs="italic">
                      No Release Clauses
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>
        </Stack>
      </Group>
    </Stack>
  );
}
