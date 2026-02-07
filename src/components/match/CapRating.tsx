import { Badge, GroupProps, NumberInput, Popover } from "@mantine/core";
import { useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";

import { capsAtom } from "@/atoms";
import { Cap } from "@/types";
import { ratingColor } from "@/utils/match";
import { supabase } from "@/utils/supabase";

const RATING_MIN = 40;
const RATING_MAX = 100;

export const CapRating: React.FC<
  GroupProps & {
    cap: Cap;
    readonly: boolean;
  }
> = ({ cap, readonly }) => {
  const [opened, setOpened] = useState(false);
  const [inputValue, setInputValue] = useState<string | number>("");

  const shownRating = cap.rating;
  const color = useMemo(() => {
    return shownRating ? ratingColor(shownRating) : undefined;
  }, [shownRating]);

  const setCaps = useSetAtom(capsAtom);
  const persistRating = useCallback(
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

  const handlePopoverChange = useCallback(
    (newOpened: boolean) => {
      if (newOpened) {
        setInputValue(cap.rating ?? "");
      } else {
        const raw = inputValue;
        const value =
          raw === "" || raw === undefined
            ? null
            : Math.min(RATING_MAX, Math.max(RATING_MIN, Number(raw)));
        if (value !== cap.rating) {
          persistRating(value);
        }
      }
      setOpened(newOpened);
    },
    [cap.rating, inputValue, persistRating],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        const raw = inputValue;
        const value =
          raw === "" || raw === undefined
            ? null
            : Math.min(RATING_MAX, Math.max(RATING_MIN, Number(raw)));
        if (value !== cap.rating) {
          persistRating(value);
        }
        setOpened(false);
      }
    },
    [cap.rating, inputValue, persistRating],
  );

  return readonly ? (
    <Badge variant="filled" color={color || "gray"} size="sm" autoContrast>
      {shownRating ?? "—"}
    </Badge>
  ) : (
    <Popover opened={opened} onChange={handlePopoverChange} trapFocus withArrow>
      <Popover.Target>
        <Badge
          variant="filled"
          color={color || "gray"}
          size="sm"
          autoContrast
          style={{ cursor: "pointer" }}
          onClick={() => {
            if (!opened) setInputValue(cap.rating ?? "");
            setOpened((o) => !o);
          }}
        >
          {shownRating ?? "—"}
        </Badge>
      </Popover.Target>
      <Popover.Dropdown>
        <NumberInput
          label="Match Rating"
          value={inputValue}
          onChange={setInputValue}
          onKeyDown={handleKeyDown}
          min={RATING_MIN}
          max={RATING_MAX}
          style={{ flex: 1 }}
        />
      </Popover.Dropdown>
    </Popover>
  );
};
