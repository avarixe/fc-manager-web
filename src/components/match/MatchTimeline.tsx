import { Appearance, Match } from "@/types";
import { Box, ThemeIcon, Timeline } from "@mantine/core";
import { groupBy, orderBy } from "lodash-es";

enum MatchEventType {
  Goal = "Goal",
  Booking = "Booking",
  Substitution = "Substitution",
}

type MatchEvent = {
  type: MatchEventType;
  minute: number;
  home: boolean;
  priority: number;
} & (
  | Match["goals"][number]
  | Match["bookings"][number]
  | { substitutions: Appearance[] }
);

export const MatchTimeline: React.FC<{ match: Match }> = ({ match }) => {
  const appearancesArray = useAtomValue(appearancesArrayAtom);
  const substitutions = useMemo(
    () => appearancesArray.filter((app) => app.start_minute > 0),
    [appearancesArray],
  );

  const team = useAtomValue(teamAtom)!;
  const items: MatchEvent[] = useMemo(() => {
    const subsByMinute = Object.entries(
      groupBy(substitutions, "start_minute"),
    ).map(([minute, subs]) => ({
      type: MatchEventType.Substitution,
      minute: Number(minute),
      home: team.name === match.home_team,
      priority: 1,
      substitutions: subs,
    }));

    return orderBy(
      [
        ...match.goals.map((goal) => ({
          type: MatchEventType.Goal,
          priority: 2,
          ...goal,
        })),
        ...match.bookings.map((booking) => ({
          type: MatchEventType.Booking,
          priority: 3,
          ...booking,
        })),
        ...subsByMinute,
      ],
      ["minute", "priority"],
      ["asc", "asc"],
    );
  }, [substitutions, match.goals, match.bookings, match.home_team, team.name]);

  const renderItem = useCallback((item: MatchEvent) => {
    switch (item.type) {
      case MatchEventType.Goal:
        assertType<Match["goals"][number]>(item);
        return <GoalEvent goal={item} />;
      case MatchEventType.Booking:
        assertType<Match["bookings"][number]>(item);
        return <BookingEvent booking={item} />;
      case MatchEventType.Substitution:
        assertType<{ substitutions: Appearance[] }>(item);
        return <SubstitutionEvent substitutions={item.substitutions} />;
    }
  }, []);

  return (
    <Timeline bulletSize={36}>
      <Timeline.Item></Timeline.Item>
      {items.map((item, index) => (
        <Timeline.Item
          key={index}
          bullet={
            <ThemeIcon
              size="md"
              radius="xl"
              color={item.home ? "cyan" : "teal"}
            >
              <MText size="xs">{item.minute}'</MText>
            </ThemeIcon>
          }
        >
          <MText size="xs" c={item.home ? "cyan" : "teal"}>
            {item.home ? match.home_team : match.away_team}
          </MText>
          {renderItem(item)}
        </Timeline.Item>
      ))}
      {Boolean(match.home_penalty_score || match.away_penalty_score) && (
        <Timeline.Item
          bullet={
            <ThemeIcon size="md" radius="xl" color="grape">
              <MText size="xs">{match.extra_time ? 120 : 90}'</MText>
            </ThemeIcon>
          }
        >
          <MText
            fw={
              Number(match.home_penalty_score) >
              Number(match.away_penalty_score)
                ? "bold"
                : undefined
            }
          >
            {match.home_penalty_score} - {match.home_team}
          </MText>
          <MText
            fw={
              Number(match.home_penalty_score) <
              Number(match.away_penalty_score)
                ? "bold"
                : undefined
            }
          >
            {match.away_penalty_score} - {match.away_team}
          </MText>
        </Timeline.Item>
      )}
      <Timeline.Item
        bullet={
          <ThemeIcon size="md" radius="xl" color="transparent">
            <Box className="i-mdi:timer-outline h-6 w-6" />
          </ThemeIcon>
        }
      >
        End of Match
      </Timeline.Item>
    </Timeline>
  );
};

const GoalEvent: React.FC<{ goal: Match["goals"][number] }> = ({ goal }) => (
  <div className="flex items-center flex-gap-1">
    <GoalIcon />
    {goal.player_name}
    {goal.set_piece ? ` (${goal.set_piece})` : null}
    {goal.assisted_by && (
      <>
        <AssistIcon />
        {goal.assisted_by}
      </>
    )}
  </div>
);

const BookingEvent: React.FC<{ booking: Match["bookings"][number] }> = ({
  booking,
}) => (
  <div className="flex items-center flex-gap-1">
    {booking.red_card ? <RedCardIcon /> : <YellowCardIcon />}
    {booking.player_name}
  </div>
);

const SubstitutionEvent: React.FC<{
  substitutions: Appearance[];
}> = ({ substitutions }) => {
  return (
    <div>
      {substitutions.map((sub) => {
        const previous = sub.previous[0];
        return (
          <div key={sub.id} className="flex items-center flex-gap-1">
            <Box
              className={
                previous.injured ? "i-mdi:ambulance" : "i-mdi:arrow-left-bottom"
              }
              c={previous.injured ? "pink" : "red"}
            />
            {previous.players.name}
            <MText component="span" fw="bold">
              {previous.pos}
            </MText>
            <Box className="i-mdi:arrow-right-bottom" c="green" />
            {sub.players.name}
            <MText component="span" fw="bold">
              {sub.pos}
            </MText>
          </div>
        );
      })}
    </div>
  );
};
