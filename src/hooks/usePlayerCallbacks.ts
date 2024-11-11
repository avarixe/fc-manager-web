import { TablesUpdate } from "@/database-generated.types";
import { Player } from "@/types";

export const usePlayerCallbacks = () => {
  const supabase = useAtomValue(supabaseAtom);
  const savePlayerStatus = useCallback(
    async (
      player: Pick<Player, "id" | "status">,
      updates: TablesUpdate<"players">,
    ) => {
      if (player.status === updates.status) return;

      const { error } = await supabase
        .from("players")
        .update(updates)
        .eq("id", player.id);
      if (error) {
        console.error(error);
      } else {
        return updates;
      }
    },
    [supabase],
  );

  const team = useAtomValue(teamAtom)!;
  const updatePlayerStatus = useCallback(
    async (
      player: Pick<
        Player,
        "id" | "status" | "contracts" | "injuries" | "loans"
      >,
      currentDate: string,
    ) => {
      const signedContracts =
        player.contracts?.filter((contract) => contract.signed_on) ?? [];
      const lastContract = signedContracts[signedContracts.length - 1];
      const lastInjury = player.injuries
        ? player.injuries[player.injuries.length - 1]
        : null;
      const signedLoans = player.loans?.filter((loan) => loan.signed_on) ?? [];
      const lastLoan = signedLoans[signedLoans.length - 1];

      if (lastContract) {
        if (currentDate < lastContract.started_on) {
          return await savePlayerStatus(player, { status: "Pending" });
        } else if (
          lastContract.started_on <= currentDate &&
          currentDate < lastContract.ended_on
        ) {
          if (
            lastInjury &&
            lastInjury.started_on <= currentDate &&
            currentDate < lastInjury.ended_on
          ) {
            return await savePlayerStatus(player, { status: "Injured" });
          } else if (
            lastLoan &&
            lastLoan.origin === team.name &&
            lastLoan.started_on <= currentDate &&
            currentDate < lastLoan.ended_on
          ) {
            return await savePlayerStatus(player, {
              status: "Loaned",
              kit_no: null,
            });
          } else {
            return await savePlayerStatus(player, { status: "Active" });
          }
        } else {
          return await savePlayerStatus(player, {
            status: null,
            kit_no: null,
          });
        }
      } else {
        return await savePlayerStatus(player, {
          status: null,
          kit_no: null,
        });
      }
    },
    [savePlayerStatus, team.name],
  );

  return {
    updatePlayerStatus,
  };
};
