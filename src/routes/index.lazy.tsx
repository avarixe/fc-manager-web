import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { useSetAtom } from "jotai";
import { keyBy } from "lodash-es";
import { useEffect, useMemo, useState } from "react";

import { breadcrumbsAtom } from "@/atoms";
import { BaseIcon } from "@/components/base/CommonIcons";
import { Team } from "@/types";
import { formatDate } from "@/utils/format";
import { supabase } from "@/utils/supabase";

export const Route = createLazyFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from("teams")
        .select()
        .order("created_at", { ascending: false });
      if (data) {
        setTeams(data);
        setCurrentTeam(data[0]);
      } else {
        console.error(error);
      }
    };

    fetchTeams();
  }, []);

  const teamsById = useMemo(() => keyBy(teams, "id"), [teams]);
  const teamFiles = useMemo(() => {
    return teams.reduce((files: number[][], team) => {
      const prevId = team.previous_id;
      if (prevId) {
        const file = files.find((file) => file.includes(prevId));
        if (file) {
          file.push(team.id);
        } else {
          files.push([prevId, team.id]);
        }
      } else if (!files.some((file) => file.includes(team.id))) {
        files.push([team.id]);
      }
      return files;
    }, []);
  }, [teams]);

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  return (
    <Stack>
      <Title mb="xl">Welcome to FC Manager!</Title>

      {currentTeam && (
        <Card>
          <Group>
            <Avatar src={currentTeam.badge_path} size={200}>
              <BaseIcon name="i-mdi:shield-half-full" fz={120} />
            </Avatar>
            <Box flex={1}>
              <Group w="100%">
                <Title order={1}>{currentTeam.name}</Title>
                <Button
                  component={Link}
                  to={`/teams/${currentTeam.id}`}
                  variant="subtle"
                  ml="auto"
                  leftSection={<div className="i-mdi:arrow-right" />}
                  size="xl"
                >
                  Go to Team
                </Button>
              </Group>
              <Divider my="xs" />
              <Box>
                <Text component="span" mr="xs">
                  Game:
                </Text>
                <Text component="span" fw="bold">
                  {currentTeam.game}
                </Text>
              </Box>
              <Box>
                <Text component="span" mr="xs">
                  Manager Name:
                </Text>
                <Text component="span" fw="bold">
                  {currentTeam.manager_name}
                </Text>
              </Box>
              <Box>
                <Text component="span" mr="xs">
                  Start Date:
                </Text>
                <Text component="span" fw="bold">
                  {formatDate(currentTeam.started_on)}
                </Text>
              </Box>
              <Box>
                <Text component="span" mr="xs">
                  Current Date:
                </Text>
                <Text component="span" fw="bold">
                  {formatDate(currentTeam.currently_on)}
                </Text>
              </Box>
              <Box>
                <Text component="span" mr="xs">
                  Currency:
                </Text>
                <Text component="span" fw="bold">
                  {currentTeam.currency}
                </Text>
              </Box>
            </Box>
          </Group>
          <Card.Section p="xs">
            <Group grow>
              <Button
                component={Link}
                to={`/teams/${currentTeam.id}/seasons/${dayjs(currentTeam.currently_on).diff(currentTeam.started_on, "year")}`}
                variant="subtle"
                color="white"
                leftSection={<div className="i-mdi:calendar" />}
              >
                Current Season
              </Button>
              <Button
                component={Link}
                to={`/teams/${currentTeam.id}/players`}
                variant="subtle"
                color="white"
                leftSection={<div className="i-mdi:run" />}
              >
                Players
              </Button>
              <Button
                component={Link}
                to={`/teams/${currentTeam.id}/matches`}
                variant="subtle"
                color="white"
                leftSection={<div className="i-mdi:soccer-field" />}
              >
                Matches
              </Button>
              <Button
                component={Link}
                to={`/teams/${currentTeam.id}/squads`}
                variant="subtle"
                color="white"
                leftSection={<div className="i-mdi:clipboard-text" />}
              >
                Squads
              </Button>
            </Group>
          </Card.Section>
        </Card>
      )}

      {teamFiles.map((file, index) => {
        const firstTeam = teamsById[file[0]];
        return (
          <Box key={index} my="lg">
            <Title order={4}>{firstTeam.manager_name}</Title>
            <Title order={6}>
              {firstTeam.game} · {formatDate(firstTeam.created_at)}
            </Title>
            <Divider my="xs" />
            <Group>
              {file.map((teamId) => {
                const team = teamsById[teamId];
                return (
                  <Card key={teamId} w={300}>
                    <Group>
                      <Avatar src={team.badge_path} size={60}>
                        <BaseIcon name="i-mdi:shield-half-full" fz={40} />
                      </Avatar>
                      <Box>
                        <Button
                          component={Link}
                          to={`/teams/${team.id}`}
                          variant="subtle"
                        >
                          {team.name}
                        </Button>
                        <Text size="sm" pl="lg">
                          {formatDate(team.started_on, "YYYY")} -{" "}
                          {formatDate(team.currently_on, "YYYY")}
                        </Text>
                      </Box>
                    </Group>
                    <Card.Section p="xs">
                      <Group grow>
                        <ActionIcon
                          component={Link}
                          to={`/teams/${team.id}/seasons/${dayjs(team.currently_on).diff(team.started_on, "year")}`}
                          variant="subtle"
                          color="white"
                        >
                          <div className="i-mdi:calendar" />
                        </ActionIcon>
                        <ActionIcon
                          component={Link}
                          to={`/teams/${team.id}/players`}
                          variant="subtle"
                          color="white"
                        >
                          <div className="i-mdi:run" />
                        </ActionIcon>
                        <ActionIcon
                          component={Link}
                          to={`/teams/${team.id}/matches`}
                          variant="subtle"
                          color="white"
                        >
                          <div className="i-mdi:soccer-field" />
                        </ActionIcon>
                        <ActionIcon
                          component={Link}
                          to={`/teams/${team.id}/squads`}
                          variant="subtle"
                          color="white"
                        >
                          <div className="i-mdi:clipboard-text" />
                        </ActionIcon>
                      </Group>
                    </Card.Section>
                  </Card>
                );
              })}
            </Group>
          </Box>
        );
      })}
    </Stack>
  );
}
