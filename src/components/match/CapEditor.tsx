import { Box, Group, LoadingOverlay, Select, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAtom } from "jotai";
import { useMemo, useState } from "react";

import { capsAtom } from "@/atoms";
import { matchPositions } from "@/constants";
import { Cap, ComboboxItem, Player } from "@/types";
import { supabase } from "@/utils/supabase";

type PlayerOption = Pick<
  Player,
  "id" | "name" | "status" | "pos" | "ovr" | "kit_no"
>;
type PlayerIdOption = ComboboxItem<PlayerOption>;

export const CapEditor: React.FC<{
  cap: Cap;
  playerOptions: PlayerOption[];
}> = ({ cap, playerOptions }) => {
  const [caps, setCaps] = useAtom(capsAtom);
  const [loading, setLoading] = useState(false);

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
          const player = playerOptions.find(
            (option) => option.id === Number(playerId),
          );
          const ovr = player?.ovr ?? cap.ovr;
          const kitNo = player?.kit_no ?? cap.kit_no;
          const { data } = await supabase
            .from("caps")
            .update({ player_id: Number(playerId), pos, ovr, kit_no: kitNo })
            .eq("id", cap.id)
            .select("*, players(name)")
            .single();
          if (data) {
            newCaps.push(data);
          }
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
    <Box>
      <LoadingOverlay
        visible={loading}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <Select
        {...form.getInputProps("playerId")}
        label="Player"
        searchable
        required
        data={playerIdOptions}
        renderOption={({ option }: { option: PlayerIdOption }) => {
          return (
            <Group>
              <Text size="xs" fw="bold">
                {option.pos}
              </Text>
              <Text size="xs">{option.name}</Text>
            </Group>
          );
        }}
        mb="xs"
      />
      <Select
        {...form.getInputProps("pos")}
        label="Position"
        data={matchPositions}
        searchable
        required
        mb="xs"
      />
    </Box>
  );
};
