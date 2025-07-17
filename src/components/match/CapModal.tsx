import { Modal, Tabs, Text } from "@mantine/core";
import { useAtomValue } from "jotai";
import { useCallback, useMemo } from "react";

import { matchAtom, teamAtom } from "@/atoms";
import {
  BaseIcon,
  GoalIcon,
  SubstitutionIcon,
  YellowCardIcon,
} from "@/components/base/CommonIcons";
import { BaseBookingForm } from "@/components/match/BookingForm";
import { CapEditor } from "@/components/match/CapEditor";
import { BaseChangeForm } from "@/components/match/ChangeForm";
import { BaseGoalForm } from "@/components/match/GoalForm";
import { useManageBookings } from "@/hooks/useManageBookings";
import { useManageChanges } from "@/hooks/useManageChanges";
import { useManageGoals } from "@/hooks/useManageGoals";
import { Booking, Cap, Change, Goal, Player } from "@/types";

type PlayerOption = Pick<
  Player,
  "id" | "name" | "status" | "pos" | "ovr" | "kit_no"
>;

export const CapModal: React.FC<{
  cap: Cap;
  opened: boolean;
  onClose: () => void;
  playerOptions: PlayerOption[];
}> = ({ cap, opened, onClose, playerOptions }) => {
  const team = useAtomValue(teamAtom)!;
  const match = useAtomValue(matchAtom)!;
  const isTeamHome = useMemo(
    () => match.home_team === team.name,
    [match.home_team, team.name],
  );

  const { createGoal } = useManageGoals();
  const onSubmitGoal = useCallback(
    async (goal: Goal) => {
      await createGoal(goal);
      onClose();
    },
    [createGoal, onClose],
  );

  const { createChange } = useManageChanges();
  const onSubmitChange = useCallback(
    async (change: Change) => {
      await createChange(change);
      onClose();
    },
    [createChange, onClose],
  );

  const { createBooking } = useManageBookings();
  const onSubmitBooking = useCallback(
    async (booking: Booking) => {
      await createBooking(booking);
      onClose();
    },
    [createBooking, onClose],
  );

  return (
    <Modal
      title={`${cap.pos} · ${cap.players.name}`}
      opened={opened}
      onClose={onClose}
      closeOnClickOutside={false}
      trapFocus
    >
      <Tabs defaultValue="cap" activateTabWithKeyboard={false}>
        <Tabs.List grow>
          <Tabs.Tab value="cap" color="default">
            <BaseIcon name="i-mdi:account" w="100%" />
          </Tabs.Tab>
          <Tabs.Tab value="goal" color="blue">
            <GoalIcon w="100%" />
          </Tabs.Tab>
          <Tabs.Tab value="change" color="green">
            <SubstitutionIcon w="100%" />
          </Tabs.Tab>
          <Tabs.Tab value="booking" color="yellow">
            <YellowCardIcon w="100%" />
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="cap" pt="xs">
          <Text size="sm" mb="xs" fw="bold">
            Edit Position and Player
          </Text>
          <CapEditor cap={cap} playerOptions={playerOptions} />
        </Tabs.Panel>
        <Tabs.Panel value="goal" pt="xs">
          <Text size="sm" mb="xs" fw="bold">
            Add Goal
          </Text>
          <BaseGoalForm
            prefill={{ player_name: cap.players.name, home: isTeamHome }}
            opened={opened}
            onSubmit={onSubmitGoal}
          />
        </Tabs.Panel>
        <Tabs.Panel value="change" pt="xs">
          <Text size="sm" mb="xs" fw="bold">
            Add Formation Change
          </Text>
          <BaseChangeForm
            prefill={{ out: { name: cap.players.name, pos: cap.pos } }}
            opened={opened}
            playerOptions={playerOptions}
            onSubmit={onSubmitChange}
          />
        </Tabs.Panel>
        <Tabs.Panel value="booking" pt="xs">
          <Text size="sm" mb="xs" fw="bold">
            Add Booking
          </Text>
          <BaseBookingForm
            prefill={{ player_name: cap.players.name, home: isTeamHome }}
            opened={opened}
            onSubmit={onSubmitBooking}
          />
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
};
