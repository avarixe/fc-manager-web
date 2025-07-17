import { useAtomValue } from "jotai";
import { useMemo } from "react";

import { matchAtom } from "@/atoms";
import { useCapHelpers } from "@/hooks/useCapHelpers";

export const useMatchState = (minute: number) => {
  const { sortedCaps } = useCapHelpers();

  const match = useAtomValue(matchAtom)!;
  const endOfMatch = useMemo(
    () => (match.extra_time ? 120 : 90),
    [match.extra_time],
  );

  const capsAtMinute = useMemo(
    () =>
      sortedCaps.filter(
        (cap) =>
          cap.start_minute <= minute &&
          (minute < cap.stop_minute || cap.stop_minute === endOfMatch),
      ),
    [minute, sortedCaps, endOfMatch],
  );

  const activeCaps = useMemo(
    () => capsAtMinute.filter((cap) => cap.stop_minute > minute),
    [capsAtMinute, minute],
  );

  const inStoppageTime = useMemo(
    () => [45, 90, 105, 120].includes(minute),
    [minute],
  );

  return {
    minute,
    sortedCaps,
    activeCaps,
    capsAtMinute,
    inStoppageTime,
  };
};
