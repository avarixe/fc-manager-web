import { Goal, Match } from "@/types";
import { modals } from "@mantine/modals";

function useManageGoals() {
  const [match, setMatch] = useAtom(matchAtom);
  assertType<Match>(match);
  const supabase = useAtomValue(supabaseAtom);
  const { resolvePlayerStats, resolveMatchScores } = useMatchCallbacks();

  const createGoal = useCallback(
    async (goal: Goal) => {
      const goals = [...match.goals, goal];
      await supabase.from("matches").update({ goals }).eq("id", match.id);
      setMatch((prev) => (prev ? { ...prev, goals } : prev));
      await resolvePlayerStats({ ...match, goals });
      await resolveMatchScores({ ...match, goals });
    },
    [match, resolveMatchScores, resolvePlayerStats, setMatch, supabase],
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
    [match, resolveMatchScores, resolvePlayerStats, setMatch, supabase],
  );

  const removeGoal = useCallback(
    async (index: number) => {
      modals.openConfirmModal({
        title: "Delete Goal",
        centered: true,
        children: (
          <MText size="sm">
            Are you sure you want to delete this goal? This action cannot be
            undone.
          </MText>
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
    [match, resolveMatchScores, resolvePlayerStats, setMatch, supabase],
  );

  return {
    createGoal,
    updateGoal,
    removeGoal,
  };
}

export { useManageGoals };
