import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useAtomValue } from "jotai";
import { useCallback } from "react";

import { supabaseAtom, teamAtom } from "@/atoms";
import { PlayerEventKey, PlayerEventType } from "@/constants";
import { usePlayerCallbacks } from "@/hooks/usePlayerCallbacks";
import {
  Contract,
  Injury,
  Loan,
  Player,
  PlayerEvent,
  StateSetter,
  Transfer,
} from "@/types";

interface UsePlayerEventsReturnType<T extends PlayerEvent> {
  create: (event: T) => Promise<void>;
  update: (index: number, event: T) => Promise<void>;
  remove: (index: number) => Promise<void>;
}

interface PlayerEventCallbacks<T extends PlayerEvent> {
  beforeCreate?: (events: T[]) => Partial<Player>;
  beforeUpdate?: (events: T[]) => Partial<Player>;
}

const eventNamesByKey: Record<PlayerEventKey, PlayerEventType> = {
  [PlayerEventKey.Contract]: PlayerEventType.Contract,
  [PlayerEventKey.Injury]: PlayerEventType.Injury,
  [PlayerEventKey.Loan]: PlayerEventType.Loan,
  [PlayerEventKey.Transfer]: PlayerEventType.Transfer,
};

function useManagePlayerEvents(
  player: Player,
  setPlayer: StateSetter<Player | null>,
  key: PlayerEventKey.Contract,
  callbacks?: PlayerEventCallbacks<Contract>,
): UsePlayerEventsReturnType<Contract>;
function useManagePlayerEvents(
  player: Player,
  setPlayer: StateSetter<Player | null>,
  key: PlayerEventKey.Injury,
  callbacks?: PlayerEventCallbacks<Injury>,
): UsePlayerEventsReturnType<Injury>;
function useManagePlayerEvents(
  player: Player,
  setPlayer: StateSetter<Player | null>,
  key: PlayerEventKey.Loan,
  callbacks?: PlayerEventCallbacks<Loan>,
): UsePlayerEventsReturnType<Loan>;
function useManagePlayerEvents(
  player: Player,
  setPlayer: StateSetter<Player | null>,
  key: PlayerEventKey.Transfer,
  callbacks?: PlayerEventCallbacks<Transfer>,
): UsePlayerEventsReturnType<Transfer>;
function useManagePlayerEvents<T extends PlayerEvent>(
  player: Player,
  setPlayer: StateSetter<Player | null>,
  key: PlayerEventKey,
  callbacks: PlayerEventCallbacks<T> = {},
) {
  const team = useAtomValue(teamAtom)!;
  const { updatePlayerStatus } = usePlayerCallbacks();

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
        setPlayer((prev) =>
          prev
            ? {
                ...prev,
                ...statusUpdates,
                [key]: events,
              }
            : null,
        );
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
        setPlayer((prev) =>
          prev
            ? {
                ...prev,
                ...statusUpdates,
                [key]: events,
              }
            : null,
        );
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
          <Text size="sm">
            Are you sure you want to delete this{" "}
            {eventNamesByKey[key].toLowerCase()}? This action cannot be undone.
          </Text>
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
            setPlayer((prev) =>
              prev
                ? {
                    ...prev,
                    ...updates,
                    [key]: events,
                  }
                : null,
            );
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

export { useManagePlayerEvents };
