import { ActionIcon, Group, GroupProps, Rating } from "@mantine/core";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";

import { capsAtom, supabaseAtom } from "@/atoms";
import { BaseIcon } from "@/components/base/CommonIcons";
import { Cap } from "@/types";

export const CapRating: React.FC<
  GroupProps & {
    cap: Cap;
    readonly: boolean;
  }
> = ({ cap, readonly, ...rest }) => {
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
    <Group {...rest}>
      {!readonly && cap.rating && (
        <ActionIcon onClick={clearRating} variant="subtle" c="gray">
          <BaseIcon name="i-mdi:star-off" />
        </ActionIcon>
      )}
      <Rating
        value={cap.rating ?? undefined}
        onChange={onChange}
        onHover={onHover}
        onClick={stopPropagation}
        readOnly={readonly}
        emptySymbol={<BaseIcon name="i-mdi:star" />}
        fullSymbol={<BaseIcon name="i-mdi:star" c={color} />}
      />
    </Group>
  );
};
