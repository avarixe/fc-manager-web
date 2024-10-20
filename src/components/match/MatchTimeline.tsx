import { Appearance, Match } from "@/types";
import { Box, Button, Group, Switch, ThemeIcon, Timeline } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
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

export const MatchTimeline: React.FC<{
  match: Match;
  setMatch: StateSetter<Match>;
  readonly: boolean;
}> = ({ match, setMatch, readonly }) => {
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

  const [newGoalOpened, { open: openNewGoal, close: closeNewGoal }] =
    useDisclosure();
  const [newBookingOpened, { open: openNewBooking, close: closeNewBooking }] =
    useDisclosure();
  const [
    newSubstitutionOpened,
    { open: openNewSubstitution, close: closeNewSubstitution },
  ] = useDisclosure();
  const [
    penaltyShootoutOpened,
    { open: openPenaltyShootout, close: closePenaltyShootout },
  ] = useDisclosure();

  const supabase = useAtomValue(supabaseAtom);
  const updateMatch = useCallback(
    async (changes: Partial<Match>) => {
      const { error } = await supabase
        .from("matches")
        .update(changes)
        .eq("id", match.id);
      if (error) {
        console.error(error);
      } else {
        setMatch((prev: Match) => ({ ...prev, ...changes }));
      }
    },
    [match, setMatch, supabase],
  );

  const setAppearanceMap = useSetAtom(appearanceMapAtom);
  const onChangeExtraTime = useCallback(
    async (value: boolean) => {
      await updateMatch({ extra_time: value });

      const newAppearanceMap = new AppearanceMap();
      await Promise.all(
        appearancesArray.map(async (appearance) => {
          if (appearance.next_id) {
            newAppearanceMap.set(appearance.id, atom(appearance));
          } else {
            const changes = { stop_minute: value ? 120 : 90 };
            const { error } = await supabase
              .from("appearances")
              .update(changes)
              .eq("id", appearance.id);
            if (error) {
              console.error(error);
            } else {
              newAppearanceMap.set(
                appearance.id,
                atom({ ...appearance, ...changes }),
              );
            }
          }
        }),
      );
      setAppearanceMap(newAppearanceMap);
    },
    [appearancesArray, setAppearanceMap, supabase, updateMatch],
  );

  return (
    <Timeline bulletSize={36}>
      {!readonly && (
        <Timeline.Item
          bullet={
            <ThemeIcon size="md" radius="xl" color="lime">
              <div className="i-mdi:plus" />
            </ThemeIcon>
          }
        >
          <Group>
            <Button
              onClick={openNewGoal}
              color="blue"
              leftSection={<GoalIcon c="white" />}
            >
              Goal
            </Button>
            <GoalForm
              match={match}
              opened={newGoalOpened}
              onClose={closeNewGoal}
              // onSubmit={createGoal}
            />
            <Button
              onClick={openNewBooking}
              color="yellow"
              leftSection={<YellowCardIcon c="white" />}
            >
              Booking
            </Button>
            <BookingForm
              match={match}
              opened={newBookingOpened}
              onClose={closeNewBooking}
              // onSubmit={createBooking}
            />
            <Button
              onClick={openNewSubstitution}
              color="green"
              leftSection={<SubstitutionIcon c="white" />}
            >
              Substitution
            </Button>
            <SubstitutionForm
              match={match}
              opened={newSubstitutionOpened}
              onClose={closeNewSubstitution}
              // onSubmit={createSubstitution}
            />
          </Group>
        </Timeline.Item>
      )}

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
      <Timeline.Item
        bullet={
          <ThemeIcon size="md" radius="xl" color="transparent">
            <Box className="i-mdi:timer-outline h-6 w-6" />
          </ThemeIcon>
        }
      >
        End of Match
        {!readonly && (
          <>
            <Switch
              label="After Extra Time"
              checked={match.extra_time}
              onChange={(event) =>
                onChangeExtraTime(event.currentTarget.checked)
              }
              my="xs"
            />
            {!(match.home_penalty_score || match.away_penalty_score) && (
              <>
                <Button onClick={openPenaltyShootout} color="grape">
                  Penalty Shootout
                </Button>
                <PenaltyShootoutForm
                  match={match}
                  opened={penaltyShootoutOpened}
                  onClose={closePenaltyShootout}
                  onSubmit={updateMatch}
                />
              </>
            )}
          </>
        )}
      </Timeline.Item>
      {Boolean(match.home_penalty_score || match.away_penalty_score) && (
        <PenaltyShootoutEvent
          match={match}
          onSubmit={updateMatch}
          readonly={readonly}
        />
      )}
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

const PenaltyShootoutEvent: React.FC<{
  match: Match;
  onSubmit: (match: Partial<Match>) => Promise<void>;
  readonly: boolean;
}> = ({ match, onSubmit, readonly }) => {
  const [opened, { open, close }] = useDisclosure();

  const removePenaltyShootout = useCallback(async () => {
    modals.openConfirmModal({
      title: `Delete Penalty Shootout`,
      centered: true,
      children: (
        <MText size="sm">
          Are you sure you want to delete the penalty shootout? This action
          cannot be undone.
        </MText>
      ),
      labels: {
        confirm: "Delete",
        cancel: "Cancel",
      },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        await onSubmit({ home_penalty_score: null, away_penalty_score: null });
      },
    });
  }, [onSubmit]);

  return (
    <Timeline.Item
      bullet={
        <ThemeIcon size="md" radius="xl" color="grape">
          <MText size="xs">PS</MText>
        </ThemeIcon>
      }
    >
      <MText
        fw={
          Number(match.home_penalty_score) > Number(match.away_penalty_score)
            ? "bold"
            : undefined
        }
      >
        {match.home_penalty_score} - {match.home_team}
      </MText>
      <MText
        fw={
          Number(match.home_penalty_score) < Number(match.away_penalty_score)
            ? "bold"
            : undefined
        }
      >
        {match.away_penalty_score} - {match.away_team}
      </MText>

      {!readonly && (
        <Group mt="sm">
          <Button
            onClick={open}
            variant="subtle"
            size="compact-sm"
            color="orange"
          >
            Edit
          </Button>
          <PenaltyShootoutForm
            match={match}
            opened={opened}
            onClose={close}
            onSubmit={onSubmit}
          />
          <Button
            onClick={removePenaltyShootout}
            variant="subtle"
            size="compact-sm"
            color="gray"
          >
            Delete
          </Button>
        </Group>
      )}
    </Timeline.Item>
  );
};
