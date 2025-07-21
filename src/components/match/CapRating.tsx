import {
  ActionIcon,
  Badge,
  Group,
  GroupProps,
  Rating,
  Text,
  Transition,
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
> = ({ cap, readonly, ...rest }) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const onHover = useCallback((value: number) => {
    setHoverValue(value > 0 ? value : null);
  }, []);

  const color = useMemo(() => {
    const rating = hoverValue ?? cap.rating;
    return rating ? ratingColor(rating) : undefined;
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

  const handlePillClick = useCallback(() => {
    if (!readonly) {
      setIsExpanded(!isExpanded);
    }
  }, [readonly, isExpanded]);

  const handlePillHover = useCallback(() => {
    if (!readonly) {
      setIsExpanded(true);
    }
  }, [readonly]);

  const handlePillLeave = useCallback(() => {
    if (!readonly) {
      setIsExpanded(false);
    }
  }, [readonly]);

  const handleRatingChange = useCallback(
    (value: number | null) => {
      onChange(value);
      setIsExpanded(false);
    },
    [onChange],
  );

  return (
    <Group {...rest} pos="relative">
      {/* Pill with numeric value */}
      <Badge
        variant="filled"
        color={color || "gray"}
        size="sm"
        style={{ cursor: readonly ? "default" : "pointer" }}
        onClick={handlePillClick}
        onMouseEnter={handlePillHover}
        onMouseLeave={handlePillLeave}
      >
        {cap.rating ? cap.rating.toFixed(1) : "—"}
      </Badge>

      {/* Expandable stars */}
      <Transition
        mounted={isExpanded && !readonly}
        transition="fade"
        duration={200}
      >
        {(styles) => (
          <Group
            pos="absolute"
            top="100%"
            left="50%"
            style={{
              ...styles,
              transform: "translateX(-50%)",
              zIndex: 1000,
              backgroundColor: "var(--mantine-color-body)",
              borderRadius: "var(--mantine-radius-sm)",
              padding: "var(--mantine-spacing-xs)",
              boxShadow: "var(--mantine-shadow-md)",
              border: "1px solid var(--mantine-color-gray-3)",
              minWidth: "140px",
            }}
            gap="xs"
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => {
              if (!readonly) {
                setIsExpanded(false);
              }
            }}
          >
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
          </Group>
        )}
      </Transition>
    </Group>
  );
};
