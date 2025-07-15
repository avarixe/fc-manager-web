import { Tables } from "@/database-generated.types";
import { NavLink, Popover } from "@mantine/core";
import { Calendar } from "@mantine/dates";

export const TeamDatePicker: React.FC<{ team: Tables<"teams"> }> = ({
  team,
}) => {
  const [opened, setOpened] = useState(false);

  const supabase = useAtomValue(supabaseAtom);
  const setAppLoading = useSetAtom(appLoadingAtom);
  const setTeam = useSetAtom(teamAtom);
  const { updatePlayerStatus } = usePlayerCallbacks();
  const onClick = useCallback(
    async (date: string) => {
      setAppLoading(true);
      const { error: teamUpdateError } = await supabase
        .from("teams")
        .update({ currently_on: date })
        .eq("id", team.id);
      if (teamUpdateError) {
        console.error(teamUpdateError);
        return;
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
            updatePlayerStatus(player, date);
          }),
        );
      } else {
        console.error(playerFetchError);
      }

      // update team after to trigger re-render after all players are updated
      setTeam({ ...team, currently_on: date });

      setAppLoading(false);
      setOpened(false);
    },
    [setAppLoading, setTeam, supabase, team, updatePlayerStatus],
  );

  return (
    <Popover opened={opened} onChange={setOpened} trapFocus withArrow>
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
          firstDayOfWeek={0}
        />
      </Popover.Dropdown>
    </Popover>
  );
};
