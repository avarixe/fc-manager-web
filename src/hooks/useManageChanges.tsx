import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useAtom, useAtomValue } from "jotai";
import { useCallback } from "react";

import { matchAtom, supabaseAtom } from "@/atoms";
import { useMatchCallbacks } from "@/hooks/useMatchCallbacks";
import { Change, Match } from "@/types";
import { assertType } from "@/utils/assert";

function useManageChanges() {
  const [match, setMatch] = useAtom(matchAtom);
  assertType<Match>(match);
  const supabase = useAtomValue(supabaseAtom);
  const { resolveFormationChanges } = useMatchCallbacks();

  const createChange = useCallback(
    async (change: Change) => {
      const changes = [...match.changes, change];
      await supabase.from("matches").update({ changes }).eq("id", match.id);
      setMatch((prev) => (prev ? { ...prev, changes } : prev));
      resolveFormationChanges({ ...match, changes });
    },
    [match, resolveFormationChanges, setMatch, supabase],
  );

  const updateChange = useCallback(
    async (index: number, change: Change) => {
      const changes = match.changes.slice();
      changes[index] = change;

      await supabase.from("matches").update({ changes }).eq("id", match.id);
      setMatch((prev) => (prev ? { ...prev, changes } : prev));
      resolveFormationChanges({ ...match, changes });
    },
    [match, resolveFormationChanges, setMatch, supabase],
  );

  const removeChange = useCallback(
    async (index: number) => {
      modals.openConfirmModal({
        title: "Delete Change",
        centered: true,
        children: (
          <Text size="sm">
            Are you sure you want to delete this change? This action cannot be
            undone.
          </Text>
        ),
        labels: {
          confirm: "Delete",
          cancel: "Cancel",
        },
        confirmProps: { color: "red" },
        onConfirm: async () => {
          const changes = match.changes.slice();
          changes.splice(index, 1);

          await supabase.from("matches").update({ changes }).eq("id", match.id);
          setMatch((prev) => (prev ? { ...prev, changes } : prev));
          resolveFormationChanges({ ...match, changes });
        },
      });
    },
    [match, resolveFormationChanges, setMatch, supabase],
  );

  return {
    createChange,
    updateChange,
    removeChange,
  };
}

export { useManageChanges };
