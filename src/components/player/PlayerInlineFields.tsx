import { Player } from "@/types";
import {
  Box,
  Indicator,
  NumberFormatter,
  NumberInput,
  Popover,
} from "@mantine/core";
import { isNotEmpty, useField } from "@mantine/form";

export const PlayerInlineField = <T,>({
  target,
  input,
  field,
  onChange,
}: {
  target: React.ReactNode;
  input: React.ReactNode;
  field: ReturnType<typeof useField<T>>;
  onChange: () => void;
}) => {
  const onChangePopover = useCallback(
    async (opened: boolean) => {
      if (opened) {
        field.reset();
      } else if (!(await field.validate())) {
        onChange();
      }
    },
    [field, onChange],
  );

  return (
    <Popover onChange={onChangePopover} trapFocus withArrow>
      <Popover.Target>
        <Indicator
          label={<Box className="i-mdi:circle-edit-outline" />}
          color="transparent"
          inline
          position="top-end"
          className="cursor-pointer"
        >
          <Box display="inline-block" px="xs">
            {target}
          </Box>
        </Indicator>
      </Popover.Target>
      <Popover.Dropdown p="xs">{input}</Popover.Dropdown>
    </Popover>
  );
};

export const PlayerKitNo: React.FC<{
  player: Pick<Player, "id" | "kit_no">;
  setPlayer: (changes: Pick<Player, "kit_no">) => void;
}> = ({ player, setPlayer }) => {
  const field = useField({
    initialValue: player.kit_no ?? undefined,
  });

  const supabase = useAtomValue(supabaseAtom);
  const onChange = useCallback(async () => {
    const changes = { kit_no: field.getValue() || null };
    const { error } = await supabase
      .from("players")
      .update(changes)
      .eq("id", player.id);
    if (error) {
      console.error(error);
    } else {
      setPlayer(changes);
    }
  }, [field, player.id, setPlayer, supabase]);

  return (
    <PlayerInlineField
      target={player.kit_no ?? "-"}
      input={
        <NumberInput
          {...field.getInputProps()}
          label="Kit Number"
          autoFocus
          min={1}
          max={99}
          mb="xs"
        />
      }
      field={field}
      onChange={onChange}
    />
  );
};

export const PlayerOvr: React.FC<{
  player: Pick<Player, "id" | "ovr" | "value" | "history">;
  setPlayer: (changes: Pick<Player, "ovr" | "history">) => void;
}> = ({ player, setPlayer }) => {
  const field = useField({
    initialValue: player.ovr,
    validateOnChange: true,
    validate: isNotEmpty(),
  });

  const supabase = useAtomValue(supabaseAtom);
  const team = useAtomValue(teamAtom)!;
  const onChange = useCallback(async () => {
    const changes = { ovr: field.getValue(), history: player.history };
    changes.history[team.currently_on] = {
      ovr: changes.ovr,
      value: player.value,
    };

    const { error } = await supabase
      .from("players")
      .update(changes)
      .eq("id", player.id);
    if (error) {
      console.error(error);
    } else {
      setPlayer(changes);
    }
  }, [
    field,
    player.history,
    player.id,
    player.value,
    setPlayer,
    supabase,
    team.currently_on,
  ]);

  return (
    <PlayerInlineField
      target={player.ovr}
      input={
        <NumberInput
          {...field.getInputProps()}
          label="OVR Rating"
          required
          autoFocus
          size="xs"
          min={0}
          max={100}
        />
      }
      field={field}
      onChange={onChange}
    />
  );
};

export const PlayerValue: React.FC<{
  player: Pick<Player, "id" | "ovr" | "value" | "history">;
  setPlayer: (changes: Pick<Player, "value" | "history">) => void;
}> = ({ player, setPlayer }) => {
  const field = useField({
    initialValue: player.value,
    validateOnChange: true,
    validate: isNotEmpty(),
  });

  const supabase = useAtomValue(supabaseAtom);
  const team = useAtomValue(teamAtom)!;
  const onChange = useCallback(async () => {
    const changes = { value: field.getValue(), history: player.history };
    changes.history[team.currently_on] = {
      ovr: player.ovr,
      value: changes.value,
    };

    const { error } = await supabase
      .from("players")
      .update(changes)
      .eq("id", player.id);
    if (error) {
      console.error(error);
    } else {
      setPlayer(changes);
    }
  }, [
    field,
    player.history,
    player.id,
    player.ovr,
    setPlayer,
    supabase,
    team.currently_on,
  ]);

  return (
    <PlayerInlineField
      target={
        <NumberFormatter
          value={player.value}
          prefix={team.currency}
          thousandSeparator
        />
      }
      input={
        <NumberInput
          {...field.getInputProps()}
          label="Value"
          leftSection={team.currency}
          thousandSeparator
          required
          autoFocus
          min={0}
          mb="xs"
        />
      }
      field={field}
      onChange={onChange}
    />
  );
};
