import { TablesUpdate } from "@/database-generated.types";
import { Contract, Injury, Loan, Player, PlayerEvent, Transfer } from "@/types";
import { modals } from "@mantine/modals";

interface UsePlayerEventsReturnType<T extends PlayerEvent> {
  create: (event: T) => Promise<void>;
  update: (index: number, event: T) => Promise<void>;
  remove: (index: number) => Promise<void>;
}

interface PlayerEventCallbacks<T extends PlayerEvent> {
  beforeCreate?: (events: T[]) => TablesUpdate<"players">;
  beforeUpdate?: (events: T[]) => TablesUpdate<"players">;
}

const eventNamesByKey: Record<PlayerEventKey, PlayerEventType> = {
  [PlayerEventKey.Contract]: PlayerEventType.Contract,
  [PlayerEventKey.Injury]: PlayerEventType.Injury,
  [PlayerEventKey.Loan]: PlayerEventType.Loan,
  [PlayerEventKey.Transfer]: PlayerEventType.Transfer,
};

function usePlayerEvents(
  player: Player,
  setPlayer: StateSetter<Player>,
  key: PlayerEventKey.Contract,
  callbacks?: PlayerEventCallbacks<Contract>,
): UsePlayerEventsReturnType<Contract>;
function usePlayerEvents(
  player: Player,
  setPlayer: StateSetter<Player>,
  key: PlayerEventKey.Injury,
  callbacks?: PlayerEventCallbacks<Injury>,
): UsePlayerEventsReturnType<Injury>;
function usePlayerEvents(
  player: Player,
  setPlayer: StateSetter<Player>,
  key: PlayerEventKey.Loan,
  callbacks?: PlayerEventCallbacks<Loan>,
): UsePlayerEventsReturnType<Loan>;
function usePlayerEvents(
  player: Player,
  setPlayer: StateSetter<Player>,
  key: PlayerEventKey.Transfer,
  callbacks?: PlayerEventCallbacks<Transfer>,
): UsePlayerEventsReturnType<Transfer>;
function usePlayerEvents<T extends PlayerEvent>(
  player: Player,
  setPlayer: StateSetter<Player>,
  key: PlayerEventKey,
  callbacks: PlayerEventCallbacks<T> = {},
) {
  const team = useAtomValue(teamAtom)!;
  const { updatePlayerStatus } = useDbCallbacks();

  const supabase = useAtomValue(supabaseAtom);
  const create = useCallback(
    async (event: T) => {
      const events = player[key].slice() as T[];
      events.push(event);
      const updates = callbacks?.beforeCreate
        ? callbacks.beforeCreate(events)
        : { [key]: events };

      const { error } = await supabase
        .from("players")
        .update(updates)
        .eq("id", player.id);
      if (error) {
        console.error(error);
      } else {
        const statusUpdates = await updatePlayerStatus(
          { ...player, [key]: events },
          team.currently_on,
        );
        setPlayer((prev: Player) => ({
          ...prev,
          ...statusUpdates,
          [key]: events,
        }));
      }
    },
    [callbacks, key, player, setPlayer, supabase, team, updatePlayerStatus],
  );

  const update = useCallback(
    async (index: number, event: T) => {
      const events = player[key].slice() as T[];
      events[index] = event;
      const updates = callbacks?.beforeUpdate
        ? callbacks.beforeUpdate(events)
        : { [key]: events };

      const { error } = await supabase
        .from("players")
        .update(updates)
        .eq("id", player.id);
      if (error) {
        console.error(error);
      } else {
        const statusUpdates = await updatePlayerStatus(
          { ...player, [key]: events },
          team.currently_on,
        );
        setPlayer((prev: Player) => ({
          ...prev,
          ...statusUpdates,
          [key]: events,
        }));
      }
    },
    [
      callbacks,
      key,
      player,
      setPlayer,
      supabase,
      team.currently_on,
      updatePlayerStatus,
    ],
  );

  const remove = useCallback(
    async (index: number) => {
      modals.openConfirmModal({
        title: `Delete ${eventNamesByKey[key]}`,
        centered: true,
        children: (
          <MText size="sm">
            Are you sure you want to delete this{" "}
            {eventNamesByKey[key].toLowerCase()}? This action cannot be undone.
          </MText>
        ),
        labels: {
          confirm: "Delete",
          cancel: "Cancel",
        },
        confirmProps: { color: "red" },
        onConfirm: async () => {
          const events = player[key].slice();
          events.splice(index, 1);

          const { error } = await supabase
            .from("players")
            .update({ [key]: events })
            .eq("id", player.id);
          if (error) {
            console.error(error);
          } else {
            const updates = await updatePlayerStatus(
              { ...player, [key]: events },
              team.currently_on,
            );
            setPlayer((prev: Player) => ({
              ...prev,
              ...updates,
              [key]: events,
            }));
          }
        },
      });
    },
    [key, player, setPlayer, supabase, team, updatePlayerStatus],
  );

  return {
    create,
    update,
    remove,
  };
}

export { usePlayerEvents };
