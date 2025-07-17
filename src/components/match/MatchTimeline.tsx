import {
  Box,
  Button,
  Divider,
  Group,
  RingProgress,
  Stack,
  Switch,
  Text,
  ThemeIcon,
  Timeline,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { useAtom, useAtomValue } from "jotai";
import { groupBy, orderBy } from "lodash-es";
import { useCallback, useMemo } from "react";

import { capsAtom, matchAtom, supabaseAtom, teamAtom } from "@/atoms";
import {
  AssistIcon,
  BaseIcon,
  GoalIcon,
  MatchInjuryIcon,
  RedCardIcon,
  SubInIcon,
  SubOutIcon,
  SubstitutionIcon,
  YellowCardIcon,
} from "@/components/base/CommonIcons";
import { BookingForm } from "@/components/match/BookingForm";
import { ChangeForm } from "@/components/match/ChangeForm";
import { GoalForm } from "@/components/match/GoalForm";
import { PenaltyShootoutForm } from "@/components/match/PenaltyShootoutForm";
import { useCapHelpers } from "@/hooks/useCapHelpers";
import { useManageBookings } from "@/hooks/useManageBookings";
import { useManageChanges } from "@/hooks/useManageChanges";
import { useManageGoals } from "@/hooks/useManageGoals";
import { Booking, Cap, Change, Goal, Match, Player } from "@/types";
import { assertType } from "@/utils/assert";

enum MatchEventType {
  Goal = "Goal",
  Booking = "Booking",
  Change = "Change",
}

type MatchEvent = {
  type: MatchEventType;
  timestamp?: number;
  minute: number;
  stoppage_time?: number;
  home: boolean;
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
        (change) =>
          `${change.minute}+${change.timestamp}+${change.stoppage_time ?? ""}`,
      ),
    ).map(([key, changes]) => {
      const [minute, timestamp, stoppageTime] = key.split("+");
      return {
        type: MatchEventType.Change,
        timestamp: Number(timestamp),
        minute: Number(minute),
        stoppageTime: Number(stoppageTime),
        home: team.name === match.home_team,
        index: 0,
        changes,
      };
    });

    return orderBy(
      [
        ...changesByMinute,
        ...match.goals.map((goal, index) => ({
          type: MatchEventType.Goal,
          index,
          ...goal,
        })),
        ...match.bookings.map((booking, index) => ({
          type: MatchEventType.Booking,
          index,
          ...booking,
        })),
      ],
      ["minute", "stoppage_time", "timestamp"],
      ["asc", "asc", "asc"],
    );
  }, [match.changes, match.goals, match.bookings, match.home_team, team.name]);

  const firstHalfItems = useMemo(() => {
    return items.filter((item) => item.minute <= 45);
  }, [items]);
  const secondHalfItems = useMemo(() => {
    return items.filter((item) => 45 < item.minute && item.minute <= 90);
  }, [items]);
  const extraTimeItems = useMemo(() => {
    return items.filter((item) => 90 < item.minute && item.minute <= 120);
  }, [items]);

  const { createGoal, updateGoal, removeGoal } = useManageGoals();
  const { createBooking, updateBooking, removeBooking } = useManageBookings();
  const { createChange, updateChange, removeChange } = useManageChanges();

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

  const scoreAtMinute = useCallback(
    (minute: number) => {
      const goals = match.goals.filter((goal) => goal.minute <= minute);
      const home = goals.filter((goal) => goal.home !== goal.own_goal).length;
      return `${home} - ${goals.length - home}`;
    },
    [match.goals],
  );

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

  const renderMatchEvent = useCallback(
    (item: MatchEvent) => {
      switch (item.type) {
        case MatchEventType.Goal:
          assertType<Goal>(item);
          return (
            <GoalEvent
              goal={item}
              goalIndex={item.index}
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

  const renderItem = useCallback(
    (item: MatchEvent, index: number) => {
      return (
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
          mt="sm"
        >
          <Text size="xs" c={item.home ? "cyan" : "teal"}>
            {item.home ? match.home_team : match.away_team}
          </Text>
          {renderMatchEvent(item)}
        </Timeline.Item>
      );
    },
    [match.away_team, match.home_team, renderMatchEvent],
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
          </Group>
        </Timeline.Item>
      )}

      {firstHalfItems.map((item, index) => renderItem(item, index))}
      <Timeline.Item
        bullet={
          <ThemeIcon size="md" radius="xl" color="transparent">
            <RingProgress
              label={
                <Text size="xs" ta="center">
                  HT
                </Text>
              }
              size={32}
              thickness={3}
              sections={[
                { value: 50, color: "white" },
                { value: 50, color: "gray.6" },
              ]}
            />
          </ThemeIcon>
        }
        mt="sm"
      >
        <Group>
          <Divider style={{ flexGrow: 1 }} />
          <Box ta="center">
            <Box fz="xs" h="sm">
              Half-Time
            </Box>
            <Box fw="bold">{scoreAtMinute(45)}</Box>
          </Box>
          <Divider style={{ flexGrow: 1 }} />
        </Group>
      </Timeline.Item>
      {secondHalfItems.map((item, index) => renderItem(item, index))}
      <Timeline.Item
        bullet={
          <ThemeIcon size="md" radius="xl" color="transparent">
            <RingProgress
              label={
                <Text size="xs" ta="center">
                  FT
                </Text>
              }
              size={32}
              thickness={3}
              sections={[{ value: 100, color: "white" }]}
            />
          </ThemeIcon>
        }
        mt="sm"
      >
        <Stack gap={1} align="center">
          <Group w="100%">
            <Divider style={{ flexGrow: 1 }} />
            <Box ta="center">
              <Box fz="xs" h="sm">
                Full-Time
              </Box>
              <Box fw="bold">{scoreAtMinute(90)}</Box>
            </Box>
            <Divider style={{ flexGrow: 1 }} />
          </Group>
          {!readonly && (
            <>
              <Switch
                label="Extra Time"
                checked={match.extra_time}
                onChange={(event) =>
                  onChangeExtraTime(event.currentTarget.checked)
                }
                my="xs"
              />
              {!(match.home_penalty_score || match.away_penalty_score) &&
                !match.extra_time && (
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
        </Stack>
      </Timeline.Item>
      {extraTimeItems.map((item, index) => renderItem(item, index))}
      {match.extra_time && (
        <Timeline.Item
          bullet={
            <ThemeIcon size="md" radius="xl" color="transparent">
              <RingProgress
                label={
                  <Text size="xs" ta="center">
                    AET
                  </Text>
                }
                size={32}
                thickness={3}
                sections={[{ value: 100, color: "white" }]}
              />
            </ThemeIcon>
          }
          mt="sm"
        >
          <Stack gap={1} align="center">
            <Group w="100%">
              <Divider style={{ flexGrow: 1 }} />
              <Box ta="center">
                <Box fz="xs" h="sm">
                  After Extra-Time
                </Box>
                <Box fw="bold">
                  {match.home_score} - {match.away_score}
                </Box>
              </Box>
              <Divider style={{ flexGrow: 1 }} />
            </Group>
            {!readonly &&
              !(match.home_penalty_score || match.away_penalty_score) && (
                <>
                  <Button onClick={openPenaltyShootout} color="grape" mt="xs">
                    Penalty Shootout
                  </Button>
                  <PenaltyShootoutForm
                    opened={penaltyShootoutOpened}
                    onClose={closePenaltyShootout}
                    onSubmit={updateMatch}
                  />
                </>
              )}
          </Stack>
        </Timeline.Item>
      )}
      {Boolean(match.home_penalty_score || match.away_penalty_score) && (
        <PenaltyShootoutEvent onSubmit={updateMatch} readonly={readonly} />
      )}
    </Timeline>
  );
};

const GoalEvent: React.FC<{
  goal: Goal;
  goalIndex: number;
  readonly: boolean;
  onSubmit: (goal: Goal) => Promise<void>;
  onRemove: () => Promise<void>;
}> = ({ goal, goalIndex, readonly, onSubmit, onRemove }) => {
  const [opened, { open, close }] = useDisclosure();

  const setPiece = useMemo(() => {
    switch (goal.set_piece) {
      case "DFK":
        return "Direct Free Kick";
      case "IFK":
        return "Indirect Free Kick";
      case "PK":
        return "Penalty";
      case "CK":
        return "Corner";
      default:
        return null;
    }
  }, [goal.set_piece]);

  const match = useAtomValue(matchAtom)!;
  const scores = useMemo(() => {
    return match.goals.slice(0, goalIndex + 1).reduce(
      (goals, matchGoal) => {
        goals[matchGoal.home !== matchGoal.own_goal ? 0 : 1] += 1;
        return goals;
      },
      [0, 0],
    );
  }, [goalIndex, match.goals]);

  return (
    <Group>
      <div>
        <Group gap="xs" fz="sm">
          <GoalIcon c={goal.own_goal ? "red.9" : "blue"} />
          {goal.player_name}
          <Box fw="bold">
            (
            <Box
              component="span"
              c={goal.home !== goal.own_goal ? "green" : undefined}
            >
              {scores[0]}
            </Box>
            &nbsp;-&nbsp;
            <Box
              component="span"
              c={goal.home !== goal.own_goal ? undefined : "green"}
            >
              {scores[1]}
            </Box>
            )
          </Box>
        </Group>
        {goal.assisted_by && (
          <Group gap="xs" fz="xs">
            <AssistIcon />
            {goal.assisted_by}
          </Group>
        )}
        {goal.own_goal && (
          <Box fz="xs" c="grey">
            Own Goal
          </Box>
        )}
        {setPiece && (
          <Box fz="xs" c="grey">
            {setPiece}
          </Box>
        )}
      </div>
      {!readonly && (
        <Group ml="sm">
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
    </Group>
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
    <Group>
      <Group fz="sm">
        {booking.red_card ? <RedCardIcon /> : <YellowCardIcon />}
        {booking.player_name}
      </Group>
      {!readonly && (
        <Group ml="sm">
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
    </Group>
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

  const isSamePlayer = change.out.name === change.in.name;

  return (
    <Group>
      <Box fz="sm">
        <Group h="lg">
          {isSamePlayer ? (
            <BaseIcon name="i-mdi:vector-polyline" c="orange" />
          ) : (
            <SubOutIcon />
          )}
          {change.injured && <MatchInjuryIcon />}
          {change.out.name}
          <Text component="span" fw="bold">
            {change.out.pos}
          </Text>
          {isSamePlayer && (
            <>
              <BaseIcon name="i-mdi:arrow-right" />
              <Text component="span" fw="bold">
                {change.in.pos}
              </Text>
            </>
          )}
        </Group>
        {!isSamePlayer && (
          <Group h="lg">
            <SubInIcon />
            {change.in.name}
            <Text component="span" fw="bold">
              {change.in.pos}
            </Text>
          </Group>
        )}
      </Box>
      {!readonly && (
        <Group ml="sm">
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
    </Group>
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
        <Text size="sm">
          Are you sure you want to delete the penalty shootout? This action
          cannot be undone.
        </Text>
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
        <ThemeIcon size="md" radius="xl" color="transparent">
          <RingProgress
            label={
              <Text size="xs" ta="center">
                PS
              </Text>
            }
            size={32}
            thickness={3}
            sections={[{ value: 100, color: "white" }]}
          />
        </ThemeIcon>
      }
      mt="sm"
    >
      <Stack gap={1} align="center">
        <Group w="100%">
          <Divider style={{ flexGrow: 1 }} />
          <Box ta="center">
            <Box fz="xs" h="sm">
              Penalty Shootout
            </Box>
            <Box fw="bold">
              {match.home_penalty_score} - {match.away_penalty_score}
            </Box>
          </Box>
          <Divider style={{ flexGrow: 1 }} />
        </Group>

        {!readonly && (
          <Group>
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
      </Stack>
    </Timeline.Item>
  );
};
