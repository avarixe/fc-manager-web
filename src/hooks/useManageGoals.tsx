import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useAtom } from "jotai";
import { useCallback } from "react";

import { matchAtom } from "@/atoms";
import { useMatchCallbacks } from "@/hooks/useMatchCallbacks";
import { Goal } from "@/types";
import { assertDefined } from "@/utils/assert";
import { supabase } from "@/utils/supabase";

function useManageGoals() {
  const [match, setMatch] = useAtom(matchAtom);
  assertDefined(match);

  const { resolvePlayerStats, resolveMatchScores } = useMatchCallbacks();

  const createGoal = useCallback(
    async (goal: Goal) => {
      const goals = [...match.goals, goal];
      await supabase.from("matches").update({ goals }).eq("id", match.id);
      setMatch((prev) => (prev ? { ...prev, goals } : prev));
      await resolvePlayerStats({ ...match, goals });
      await resolveMatchScores({ ...match, goals });
    },
    [match, resolveMatchScores, resolvePlayerStats, setMatch],
  );

  const updateGoal = useCallback(
    async (index: number, goal: Goal) => {
      const goals = match.goals.slice();
      goals[index] = goal;

      await supabase.from("matches").update({ goals }).eq("id", match.id);
      setMatch((prev) => (prev ? { ...prev, goals } : prev));
      await resolvePlayerStats({ ...match, goals });
      await resolveMatchScores({ ...match, goals });
    },
    [match, resolveMatchScores, resolvePlayerStats, setMatch],
  );

  const removeGoal = useCallback(
    async (index: number) => {
      modals.openConfirmModal({
        title: "Delete Goal",
        centered: true,
        children: (
          <Text size="sm">
            Are you sure you want to delete this goal? This action cannot be
            undone.
          </Text>
        ),
        labels: {
          confirm: "Delete",
          cancel: "Cancel",
        },
        confirmProps: { color: "red" },
        onConfirm: async () => {
          const goals = match.goals.slice();
          goals.splice(index, 1);

          await supabase.from("matches").update({ goals }).eq("id", match.id);
          setMatch((prev) => (prev ? { ...prev, goals } : prev));
          await resolvePlayerStats({ ...match, goals });
          await resolveMatchScores({ ...match, goals });
        },
      });
    },
    [match, resolveMatchScores, resolvePlayerStats, setMatch],
  );

  return {
    createGoal,
    updateGoal,
    removeGoal,
  };
}

export { useManageGoals };
