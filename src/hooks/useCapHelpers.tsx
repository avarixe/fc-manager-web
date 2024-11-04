import { Cap } from "@/types";
import { orderBy } from "lodash-es";

export const useCapHelpers = () => {
  const caps = useAtomValue(capsAtom);

  const sortedCaps = useMemo(
    () => orderBy(caps, ["pos_order", "start_minute"]),
    [caps],
  );

  const getFirstCaps = useCallback(() => {
    const firstCaps: Cap[] = [];
    for (const cap of orderBy(caps, ["start_minute"])) {
      if (firstCaps.some((firstCap) => firstCap.player_id === cap.player_id)) {
        continue;
      } else {
        firstCaps.push(cap);
      }
    }
    return firstCaps;
  }, [caps]);

  const getUnsubbedCaps = useCallback(() => {
    const unsubbed: Cap[] = [];
    const subbedOut: number[] = [];
    for (const cap of orderBy(caps, ["start_minute"])) {
      if (subbedOut.includes(cap.player_id)) {
        continue;
      }

      const index = unsubbed.findIndex(
        (firstCap) => firstCap.player_id === cap.player_id,
      );
      if (index < 0) {
        unsubbed.push(cap);
      } else {
        subbedOut.push(cap.player_id);
        unsubbed.splice(index, 1);
      }
    }
    return unsubbed;
  }, [caps]);

  return {
    sortedCaps,
    getFirstCaps,
    getUnsubbedCaps,
  };
};
