import { Match } from "@/types";
import { Box, Group, Indicator, NavLink, Rating } from "@mantine/core";
import { orderBy } from "lodash-es";

export const MatchLineup: React.FC<{ match: Match }> = ({ match }) => {
  const appearances = useAtomValue(appearancesAtom);
  const sortedAppearances = useMemo(() => {
    return orderBy(
      appearances.filter(
        (app) => !app.next_id || app.next?.players?.name !== app.players.name,
      ),
      ["pos_order", "start_minute"],
      ["asc", "asc"],
    );
  }, [appearances]);

  const team = useAtomValue(teamAtom)!;
  return (
    <>
      <MText pl="xs" size="sm" className="opacity-60">
        Players
      </MText>
      {sortedAppearances.map((appearance) => (
        <NavLink
          key={appearance.id}
          label={
            <MatchLineupStats match={match} playerId={appearance.player_id!} />
          }
          leftSection={
            <Box w={40} fw={700}>
              {appearance.pos}
            </Box>
          }
          rightSection={
            <Rating value={appearance.rating ?? undefined} readOnly />
          }
          classNames={{
            body: "overflow-visible",
          }}
        />
      ))}
      <MText pl="xs" size="sm" mt="xs" className="opacity-60">
        Teams
      </MText>
      {match.home_team !== team.name && (
        <NavLink
          label={match.home_team}
          leftSection={
            <Box w={50} fw={700}>
              Home
            </Box>
          }
        />
      )}
      {match.away_team !== team.name && (
        <NavLink
          label={match.away_team}
          leftSection={
            <Box w={50} fw={700}>
              Away
            </Box>
          }
        />
      )}
      {/* TODO: remove temporary data check UI */}
      {sortedAppearances.map((appearance) => (
        <div key={appearance.id}>
          Appearance#{appearance.id} Player#{appearance.player_id} Start:
          {appearance.start_minute} Stop:{appearance.stop_minute} #YellowCards:
          {appearance.num_yellow_cards} #RedCards:{appearance.num_red_cards}{" "}
          #Goals:{appearance.num_goals} #Assists:{appearance.num_assists}{" "}
          #OwnGoals:{appearance.num_own_goals}
        </div>
      ))}
    </>
  );
};

const MatchLineupStats: React.FC<{ match: Match; playerId: number }> = ({
  match,
  playerId,
}) => {
  const {
    playerName,
    startMinute,
    stopMinute,
    numGoals,
    numOwnGoals,
    numAssists,
    numYellowCards,
    numRedCards,
    subbedOut,
    injured,
  } = useAppearanceStats(match, playerId);

  console.log(
    `${playerName} #redCards: ${numRedCards} #yellowCards: ${numYellowCards} #goals: ${numGoals} #assists: ${numAssists} #ownGoals: ${numOwnGoals} startMinute: ${startMinute} stopMinute: ${stopMinute} subbedOut: ${subbedOut} injured: ${injured}`,
  );

  return (
    <Group gap="xs">
      <MText component="span">
        {playerName} #{playerId}
      </MText>
      {startMinute > 0 && (
        <Indicator
          label={startMinute}
          color="transparent"
          inline
          position="bottom-end"
        >
          <SubInIcon />
        </Indicator>
      )}
      {numGoals > 0 && (
        <Indicator
          label={numGoals}
          color="transparent"
          inline
          position="bottom-end"
        >
          <GoalIcon />
        </Indicator>
      )}
      {numOwnGoals > 0 && (
        <Indicator
          label={numOwnGoals}
          color="transparent"
          inline
          position="bottom-end"
        >
          <GoalIcon c="red.9" />
        </Indicator>
      )}
      {numAssists > 0 && (
        <Indicator
          label={numAssists}
          color="transparent"
          inline
          position="bottom-end"
        >
          <AssistIcon />
        </Indicator>
      )}
      {numYellowCards > 0 && <YellowCardIcon />}
      {(numRedCards > 0 || numYellowCards > 1) && <RedCardIcon />}
      {subbedOut && (
        <Indicator
          label={stopMinute}
          color="transparent"
          inline
          position="bottom-end"
        >
          {injured ? <InjuryIcon /> : <SubOutIcon />}
        </Indicator>
      )}
    </Group>
  );
};
