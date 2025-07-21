import {
  ActionIcon,
  Badge,
  Group,
  GroupProps,
  HoverCard,
  Rating,
  Text,
} from "@mantine/core";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";

import { capsAtom, supabaseAtom } from "@/atoms";
import { BaseIcon } from "@/components/base/CommonIcons";
import { Cap } from "@/types";
import { ratingColor } from "@/utils/match";

export const CapRating: React.FC<
  GroupProps & {
    cap: Cap;
    readonly: boolean;
  }
> = ({ cap, readonly }) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const onHover = useCallback((value: number) => {
    setHoverValue(value > 0 ? value : null);
  }, []);

  const shownRating = useMemo(() => {
    return hoverValue ?? cap.rating;
  }, [cap.rating, hoverValue]);

  const color = useMemo(() => {
    return shownRating ? ratingColor(shownRating) : undefined;
  }, [shownRating]);

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

  const handleRatingChange = useCallback(
    (value: number | null) => {
      onChange(value);
    },
    [onChange],
  );

  return readonly ? (
    <Badge variant="filled" color={color || "gray"} size="sm">
      {shownRating ? shownRating.toFixed(1) : "—"}
    </Badge>
  ) : (
    <HoverCard>
      <HoverCard.Target>
        <Badge
          variant="filled"
          color={color || "gray"}
          size="sm"
          style={{ cursor: "pointer" }}
        >
          {shownRating ? shownRating.toFixed(1) : "—"}
        </Badge>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <Text size="xs" fw={500} c="dimmed" ta="center" w="100%">
          Change Rating
        </Text>
        <Group gap="xs" justify="center" w="100%" align="center">
          {cap.rating && (
            <ActionIcon
              onClick={clearRating}
              variant="subtle"
              c="gray"
              size="sm"
            >
              <BaseIcon name="i-mdi:star-off" />
            </ActionIcon>
          )}
          <Rating
            value={cap.rating ?? undefined}
            onChange={handleRatingChange}
            onHover={onHover}
            onClick={stopPropagation}
            readOnly={readonly}
            emptySymbol={<BaseIcon name="i-mdi:star" />}
            fullSymbol={<BaseIcon name="i-mdi:star" c={color} />}
            size="sm"
          />
        </Group>
      </HoverCard.Dropdown>
    </HoverCard>
  );
};
