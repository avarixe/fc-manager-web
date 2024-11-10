import { Cap, Booking, Goal, Match, Player, Change } from "@/types";
import {
  Box,
  Button,
  Group,
  Stack,
  Switch,
  ThemeIcon,
  Timeline,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { groupBy, orderBy } from "lodash-es";

enum MatchEventType {
  Goal = "Goal",
  Booking = "Booking",
  Change = "Change",
}

type MatchEvent = {
  type: MatchEventType;
  minute: number;
  stoppage_time?: number;
  home: boolean;
  priority: number;
  index: number;
} & (Goal | Booking | { changes: (Change & { index: number })[] });

type PlayerOption = Pick<Player, "id" | "name" | "status" | "pos" | "ovr">;

export const MatchTimeline: React.FC<{
  readonly: boolean;
  playerOptions: PlayerOption[];
}> = ({ readonly, playerOptions }) => {
  const team = useAtomValue(teamAtom)!;
  const [match, setMatch] = useAtom(matchAtom);
  assertType<Match>(match);
  const items: MatchEvent[] = useMemo(() => {
    const indexedChanges = match.changes.map((change, index) => ({
      ...change,
      index,
    }));
    const changesByMinute = Object.entries(
      groupBy(
        indexedChanges,
        (change) => `${change.minute}+${change.stoppage_time ?? ""}`,
      ),
    ).map(([key, changes]) => {
      const [minute, stoppageTime] = key.split("+");
      return {
        type: MatchEventType.Change,
        minute: Number(minute),
        stoppageTime: Number(stoppageTime),
        home: team.name === match.home_team,
        priority: 1,
        index: 0,
        changes,
      };
    });

    return orderBy(
      [
        ...match.goals.map((goal, index) => ({
          type: MatchEventType.Goal,
          priority: 2,
          index,
          ...goal,
        })),
        ...match.bookings.map((booking, index) => ({
          type: MatchEventType.Booking,
          priority: 3,
          index,
          ...booking,
        })),
        ...changesByMinute,
      ],
      ["minute", "stoppage_time", "priority"],
      ["asc", "asc", "asc"],
    );
  }, [match.changes, match.goals, match.bookings, match.home_team, team.name]);

  const { createGoal, updateGoal, removeGoal } = useManageGoals();
  const { createBooking, updateBooking, removeBooking } = useManageBookings();
  const { createChange, updateChange, removeChange } = useManageChanges();

  const renderItem = useCallback(
    (item: MatchEvent) => {
      switch (item.type) {
        case MatchEventType.Goal:
          assertType<Goal>(item);
          return (
            <GoalEvent
              goal={item}
              readonly={readonly}
              onSubmit={(goal) => updateGoal(item.index, goal)}
              onRemove={() => removeGoal(item.index)}
            />
          );
        case MatchEventType.Booking:
          assertType<Booking>(item);
          return (
            <BookingEvent
              booking={item}
              readonly={readonly}
              onSubmit={(booking) => updateBooking(item.index, booking)}
              onRemove={() => removeBooking(item.index)}
            />
          );
        case MatchEventType.Change:
          assertType<{ changes: Change[] }>(item);
          return (
            <Stack>
              {item.changes.map((itemChange, i) => (
                <ChangeEvent
                  key={i}
                  change={itemChange}
                  playerOptions={playerOptions}
                  readonly={readonly}
                  onSubmit={(change) => updateChange(itemChange.index, change)}
                  onRemove={() => removeChange(itemChange.index)}
                />
              ))}
            </Stack>
          );
      }
    },
    [
      playerOptions,
      readonly,
      removeBooking,
      removeChange,
      removeGoal,
      updateBooking,
      updateChange,
      updateGoal,
    ],
  );

  const [newGoalOpened, { open: openNewGoal, close: closeNewGoal }] =
    useDisclosure();
  const [newBookingOpened, { open: openNewBooking, close: closeNewBooking }] =
    useDisclosure();
  const [newChangeOpened, { open: openNewChange, close: closeNewChange }] =
    useDisclosure();
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
        setMatch((prev) => (prev ? { ...prev, ...changes } : prev));
      }
    },
    [match, setMatch, supabase],
  );

  const [caps, setCaps] = useAtom(capsAtom);
  const { getUnsubbedCaps } = useCapHelpers();
  const onChangeExtraTime = useCallback(
    async (value: boolean) => {
      await updateMatch({ extra_time: value });

      const unsubbedCaps = getUnsubbedCaps();
      const newCaps: Cap[] = [];
      await Promise.all(
        caps.map(async (cap) => {
          if (unsubbedCaps.some((unsubbedCap) => unsubbedCap.id === cap.id)) {
            const changes = { stop_minute: value ? 120 : 90 };
            const { error } = await supabase
              .from("caps")
              .update(changes)
              .eq("id", cap.id);
            if (error) {
              console.error(error);
            } else {
              newCaps.push({ ...cap, ...changes });
            }
          } else {
            newCaps.push(cap);
          }
        }),
      );
      setCaps(newCaps);
    },
    [caps, getUnsubbedCaps, setCaps, supabase, updateMatch],
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
              opened={newGoalOpened}
              onClose={closeNewGoal}
              onSubmit={createGoal}
            />
            <Button
              onClick={openNewBooking}
              color="yellow"
              leftSection={<YellowCardIcon c="white" />}
            >
              Booking
            </Button>
            <BookingForm
              opened={newBookingOpened}
              onClose={closeNewBooking}
              onSubmit={createBooking}
            />
            <Button
              onClick={openNewChange}
              color="green"
              leftSection={<SubstitutionIcon c="white" />}
            >
              Change
            </Button>
            <ChangeForm
              opened={newChangeOpened}
              onClose={closeNewChange}
              onSubmit={createChange}
              playerOptions={playerOptions}
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
              <Box ta="center" fz={12} size="xs">
                {item.minute}'
                {item.stoppage_time ? <Box>+{item.stoppage_time}</Box> : null}
              </Box>
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
        <PenaltyShootoutEvent onSubmit={updateMatch} readonly={readonly} />
      )}
    </Timeline>
  );
};

const GoalEvent: React.FC<{
  goal: Goal;
  readonly: boolean;
  onSubmit: (goal: Goal) => Promise<void>;
  onRemove: () => Promise<void>;
}> = ({ goal, readonly, onSubmit, onRemove }) => {
  const [opened, { open, close }] = useDisclosure();

  return (
    <div>
      <div className="flex items-center flex-gap-1">
        <GoalIcon c={goal.own_goal ? "red.9" : "blue"} />
        {goal.player_name}
        {goal.set_piece ? ` (${goal.set_piece})` : null}
        {goal.assisted_by && (
          <>
            <AssistIcon />
            {goal.assisted_by}
          </>
        )}
      </div>
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
          <GoalForm
            record={goal}
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
      )}
    </div>
  );
};

const BookingEvent: React.FC<{
  booking: Booking;
  readonly: boolean;
  onSubmit: (booking: Booking) => Promise<void>;
  onRemove: () => Promise<void>;
}> = ({ booking, readonly, onSubmit, onRemove }) => {
  const [opened, { open, close }] = useDisclosure();

  return (
    <div>
      <div className="flex items-center flex-gap-1">
        {booking.red_card ? <RedCardIcon /> : <YellowCardIcon />}
        {booking.player_name}
      </div>
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
          <BookingForm
            record={booking}
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
      )}
    </div>
  );
};

const ChangeEvent: React.FC<{
  change: Change;
  playerOptions: PlayerOption[];
  readonly: boolean;
  onSubmit: (change: Change) => Promise<void>;
  onRemove: () => Promise<void>;
}> = ({ change, playerOptions, readonly, onSubmit, onRemove }) => {
  const [opened, { open, close }] = useDisclosure();

  return (
    <div>
      <div className="flex items-center flex-gap-1">
        <Box
          className={
            change.injured ? "i-mdi:ambulance" : "i-mdi:arrow-left-bottom"
          }
          c={change.injured ? "pink" : "red"}
        />
        {change.out.name}
        <MText component="span" fw="bold">
          {change.out.pos}
        </MText>
        <Box className="i-mdi:arrow-right-bottom" c="green" />
        {change.in.name}
        <MText component="span" fw="bold">
          {change.in.pos}
        </MText>
      </div>
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
          <ChangeForm
            record={change}
            playerOptions={playerOptions}
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
      )}
    </div>
  );
};

const PenaltyShootoutEvent: React.FC<{
  onSubmit: (match: Partial<Match>) => Promise<void>;
  readonly: boolean;
}> = ({ onSubmit, readonly }) => {
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

  const match = useAtomValue(matchAtom)!;
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
