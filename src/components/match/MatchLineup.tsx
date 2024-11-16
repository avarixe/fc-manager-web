import { Cap, Player } from "@/types";
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Indicator,
  NavLink,
  Rating,
} from "@mantine/core";
import { orderBy } from "lodash-es";

type PlayerOption = Pick<Player, "id" | "name" | "status" | "pos" | "ovr">;

export const MatchLineup: React.FC<{
  readonly: boolean;
  playerOptions: PlayerOption[];
}> = ({ readonly, playerOptions }) => {
  const { getFirstCaps } = useCapHelpers();
  const sortedCaps = useMemo(() => {
    return orderBy(
      getFirstCaps(),
      ["pos_order", "start_minute"],
      ["asc", "asc"],
    );
  }, [getFirstCaps]);

  const team = useAtomValue(teamAtom)!;
  const match = useAtomValue(matchAtom)!;
  return (
    <>
      <MText pl="xs" size="sm" className="opacity-60">
        Players
      </MText>
      {sortedCaps.map((cap) => (
        <NavLink
          key={cap.id}
          label={
            <Group>
              <CapEditor
                cap={cap}
                readonly={readonly}
                playerOptions={playerOptions}
                target={
                  <Button size="compact-sm" variant="transparent" color="gray">
                    {cap.players.name}
                  </Button>
                }
              />
              <MatchLineupStats cap={cap} />
            </Group>
          }
          leftSection={
            <Box w={40} fw={700}>
              {cap.pos}
            </Box>
          }
          rightSection={<CapRating cap={cap} readonly={readonly} />}
          classNames={{
            body: "overflow-visible",
          }}
        />
      ))}
      <MText pl="xs" size="sm" mt="xs" className="opacity-60">
        Teams
      </MText>
      {match.home_team !== team.name && (
        <NavLink
          label={match.home_team}
          leftSection={
            <Box w={50} fw={700}>
              Home
            </Box>
          }
        />
      )}
      {match.away_team !== team.name && (
        <NavLink
          label={match.away_team}
          leftSection={
            <Box w={50} fw={700}>
              Away
            </Box>
          }
        />
      )}
    </>
  );
};

const CapRating: React.FC<{
  cap: Cap;
  readonly: boolean;
}> = ({ cap, readonly }) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const onHover = useCallback((value: number) => {
    setHoverValue(value > 0 ? value : null);
  }, []);

  const color = useMemo(() => {
    switch (hoverValue || cap.rating) {
      case 1:
        return "red";
      case 2:
        return "orange";
      case 3:
        return "yellow";
      case 4:
        return "lime";
      case 5:
        return "green";
    }
  }, [cap.rating, hoverValue]);

  const supabase = useAtomValue(supabaseAtom);
  const setCaps = useSetAtom(capsAtom);
  const onChange = useCallback(
    async (value: number | null) => {
      await supabase.from("caps").update({ rating: value }).eq("id", cap.id);
      setCaps((prev) => {
        return prev.map((prevCap) => {
          if (prevCap.player_id === cap.player_id) {
            return { ...prevCap, rating: value };
          }
          return prevCap;
        });
      });
    },
    [supabase, cap.id, cap.player_id, setCaps],
  );

  const stopPropagation = useCallback((event: React.MouseEvent<unknown>) => {
    event.stopPropagation();
  }, []);

  const clearRating = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      stopPropagation(event);
      onChange(null);
    },
    [onChange, stopPropagation],
  );

  return (
    <Group>
      {!readonly && cap.rating && (
        <ActionIcon onClick={clearRating} variant="subtle" c="gray">
          <BaseIcon name="i-mdi:delete" />
        </ActionIcon>
      )}
      <Rating
        value={cap.rating ?? undefined}
        onChange={onChange}
        onHover={onHover}
        onClick={stopPropagation}
        readOnly={readonly}
        emptySymbol={<BaseIcon name="i-mdi:star-four-points" />}
        fullSymbol={<BaseIcon name="i-mdi:star-four-points" c={color} />}
      />
    </Group>
  );
};

const MatchLineupStats: React.FC<{ cap: Cap }> = ({ cap }) => {
  const {
    startMinute,
    stopMinute,
    numGoals,
    numOwnGoals,
    numAssists,
    numYellowCards,
    numRedCards,
    subbedOut,
    injured,
  } = useCapStats(cap.player_id);

  return (
    <Group gap="xs">
      {startMinute > 0 && (
        <Indicator
          label={startMinute}
          color="transparent"
          inline
          position="bottom-end"
          zIndex={1}
        >
          <SubInIcon />
        </Indicator>
      )}
      {numGoals > 0 && (
        <Indicator
          label={numGoals}
          color="transparent"
          inline
          position="bottom-end"
          zIndex={1}
        >
          <GoalIcon />
        </Indicator>
      )}
      {numOwnGoals > 0 && (
        <Indicator
          label={numOwnGoals}
          color="transparent"
          inline
          position="bottom-end"
          zIndex={1}
        >
          <GoalIcon c="red.9" />
        </Indicator>
      )}
      {numAssists > 0 && (
        <Indicator
          label={numAssists}
          color="transparent"
          inline
          position="bottom-end"
          zIndex={1}
        >
          <AssistIcon />
        </Indicator>
      )}
      {numYellowCards > 0 && <YellowCardIcon />}
      {(numRedCards > 0 || numYellowCards > 1) && <RedCardIcon />}
      {subbedOut && (
        <Indicator
          label={stopMinute}
          color="transparent"
          inline
          position="bottom-end"
          zIndex={1}
        >
          {injured ? <InjuryIcon /> : <SubOutIcon />}
        </Indicator>
      )}
    </Group>
  );
};
