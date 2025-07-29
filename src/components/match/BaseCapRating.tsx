import { ActionIcon, Group, GroupProps, Rating } from "@mantine/core";
import { useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";

import { capsAtom } from "@/atoms";
import { BaseIcon } from "@/components/base/CommonIcons";
import { Cap } from "@/types";
import { ratingColor } from "@/utils/match";
import { supabase } from "@/utils/supabase";

export const BaseCapRating: React.FC<
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
    const rating = hoverValue ?? cap.rating;
    return rating ? ratingColor(rating) : undefined;
  }, [cap.rating, hoverValue]);

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
    [cap.id, cap.player_id, setCaps],
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
