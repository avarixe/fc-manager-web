import { Booking, Cap, Change, Goal, Player } from "@/types";
import { Modal, Tabs } from "@mantine/core";

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
            <BaseIcon name="i-mdi:account" />
          </Tabs.Tab>
          <Tabs.Tab value="goal" color="blue">
            <GoalIcon />
          </Tabs.Tab>
          <Tabs.Tab value="change" color="green">
            <SubstitutionIcon />
          </Tabs.Tab>
          <Tabs.Tab value="booking" color="yellow">
            <YellowCardIcon />
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="cap" pt="xs">
          <MText size="sm" mb="xs" fw="bold">
            Edit Position and Player
          </MText>
          <CapEditor cap={cap} playerOptions={playerOptions} />
        </Tabs.Panel>
        <Tabs.Panel value="goal" pt="xs">
          <MText size="sm" mb="xs" fw="bold">
            Add Goal
          </MText>
          <BaseGoalForm
            prefill={{ player_name: cap.players.name, home: isTeamHome }}
            opened={opened}
            onSubmit={onSubmitGoal}
          />
        </Tabs.Panel>
        <Tabs.Panel value="change" pt="xs">
          <MText size="sm" mb="xs" fw="bold">
            Add Formation Change
          </MText>
          <BaseChangeForm
            prefill={{ out: { name: cap.players.name, pos: cap.pos } }}
            opened={opened}
            playerOptions={playerOptions}
            onSubmit={onSubmitChange}
          />
        </Tabs.Panel>
        <Tabs.Panel value="booking" pt="xs">
          <MText size="sm" mb="xs" fw="bold">
            Add Booking
          </MText>
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
