import { Cap, Player } from "@/types";
import {
  ComboboxItem,
  Group,
  LoadingOverlay,
  Popover,
  Select,
} from "@mantine/core";
import { useForm } from "@mantine/form";

type PlayerOption = Pick<Player, "id" | "name" | "status" | "pos" | "ovr">;
type PlayerIdOption = ComboboxItem & PlayerOption;

export const CapEditor: React.FC<{
  cap: Cap;
  readonly: boolean;
  playerOptions: PlayerOption[];
  target: React.ReactNode;
}> = ({ cap, readonly, playerOptions, target }) => {
  const [caps, setCaps] = useAtom(capsAtom);
  const [loading, setLoading] = useState(false);
  const supabase = useAtomValue(supabaseAtom);
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      playerId: String(cap.player_id),
      pos: cap.pos,
    },
    onValuesChange: async ({ playerId, pos }) => {
      setLoading(true);
      const newCaps = [];
      for (const oldCap of caps) {
        if (oldCap.id === cap.id) {
          const { data } = await supabase
            .from("caps")
            .update({ player_id: Number(playerId), pos })
            .eq("id", cap.id)
            .select("*, players(name)")
            .single();
          assertType<Cap>(data);
          newCaps.push(data);
        } else {
          newCaps.push(oldCap);
        }
      }
      setCaps(newCaps);
      setLoading(false);
    },
  });

  const playerIdOptions = useMemo(
    () =>
      playerOptions
        .filter((player) => player.status === "Active")
        .map((player) => ({
          ...player,
          value: String(player.id),
          label: `${player.pos} · ${player.name}`,
        })),
    [playerOptions],
  );

  return (
    <Popover
      width={300}
      trapFocus
      withArrow
      position="bottom-start"
      arrowPosition="side"
      disabled={readonly}
    >
      <Popover.Target>{target}</Popover.Target>
      <Popover.Dropdown p="xs">
        <LoadingOverlay
          visible={loading}
          overlayProps={{ radius: "sm", blur: 2 }}
        />
        <Select
          {...form.getInputProps("playerId")}
          label="Player"
          required
          data={playerIdOptions}
          renderOption={({ option }) => {
            assertType<PlayerIdOption>(option);
            return (
              <Group>
                <MText size="xs" fw="bold">
                  {option.pos}
                </MText>
                <MText size="xs">{option.name}</MText>
              </Group>
            );
          }}
          mb="xs"
        />
        <Select
          {...form.getInputProps("pos")}
          label="Position"
          data={matchPositions}
          required
          mb="xs"
        />
      </Popover.Dropdown>
    </Popover>
  );
};
