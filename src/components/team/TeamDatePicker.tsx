import { Tables, TablesUpdate } from "@/database-generated.types";
import { Player } from "@/types";
import { NavLink, Popover } from "@mantine/core";
import { Calendar } from "@mantine/dates";

export const TeamDatePicker: React.FC<{ team: Tables<"teams"> }> = ({
  team,
}) => {
  const [opened, setOpened] = useState(false);

  const supabase = useAtomValue(supabaseAtom);
  const updatePlayerStatus = useCallback(
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
      }
    },
    [supabase],
  );

  const setAppLoading = useSetAtom(appLoadingAtom);
  const setTeam = useSetAtom(teamAtom);
  const onClick = useCallback(
    async (date: Date) => {
      setAppLoading(true);
      const currentDate = dayjs(date).format("YYYY-MM-DD");

      const { error: teamUpdateError } = await supabase
        .from("teams")
        .update({ currently_on: currentDate })
        .eq("id", team.id);
      if (teamUpdateError) {
        console.error(teamUpdateError);
        return;
      } else {
        setTeam({ ...team, currently_on: currentDate });
      }

      // load players to check and update statuses
      const { data: players, error: playerFetchError } = await supabase
        .from("players")
        .select("id, status, contracts, injuries, loans")
        .eq("team_id", team.id);

      if (players) {
        await Promise.all(
          players.map(async (player) => {
            assertType<
              Pick<Player, "id" | "status" | "contracts" | "injuries" | "loans">
            >(player);
            const lastContract = player.contracts
              ? player.contracts[player.contracts.length - 1]
              : null;
            const lastInjury = player.injuries
              ? player.injuries[player.injuries.length - 1]
              : null;
            const lastLoan = player.loans
              ? player.loans[player.loans.length - 1]
              : null;

            if (lastContract) {
              if (currentDate < lastContract.started_on) {
                await updatePlayerStatus(player, { status: "Pending" });
              } else if (
                lastContract.started_on <= currentDate &&
                currentDate < lastContract.ended_on
              ) {
                if (
                  lastInjury &&
                  lastInjury.started_on <= currentDate &&
                  currentDate < lastInjury.ended_on
                ) {
                  await updatePlayerStatus(player, { status: "Injured" });
                } else if (
                  lastLoan &&
                  lastLoan.started_on <= currentDate &&
                  currentDate < lastLoan.ended_on
                ) {
                  await updatePlayerStatus(player, {
                    status: "Loaned",
                    kit_no: null,
                  });
                } else {
                  await updatePlayerStatus(player, { status: "Active" });
                }
              } else {
                await updatePlayerStatus(player, {
                  status: null,
                  kit_no: null,
                });
              }
            }
          }),
        );
      } else {
        console.error(playerFetchError);
      }

      setAppLoading(false);
      setOpened(false);
    },
    [setAppLoading, setTeam, supabase, team, updatePlayerStatus],
  );

  return (
    <Popover opened={opened} onChange={setOpened}>
      <Popover.Target>
        <NavLink
          onClick={() => setOpened(!opened)}
          label={formatDate(team.currently_on)}
          description="Current Date"
          leftSection={<div className="i-mdi:calendar-today" />}
        />
      </Popover.Target>
      <Popover.Dropdown>
        <Calendar
          defaultDate={dayjs(team.currently_on)}
          getDayProps={(date) => ({
            selected: dayjs(date).isSame(team.currently_on, "string"),
            onClick: () => onClick(date),
          })}
        />
      </Popover.Dropdown>
    </Popover>
  );
};
