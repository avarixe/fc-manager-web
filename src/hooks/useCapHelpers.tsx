import { useAtomValue } from "jotai";
import { orderBy } from "lodash-es";
import { useCallback, useMemo } from "react";

import { capsAtom, matchAtom } from "@/atoms";
import { Cap } from "@/types";

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

  const match = useAtomValue(matchAtom)!;
  const getUnsubbedCaps = useCallback(() => {
    const subbedOutPlayerNames = match.changes
      .filter((change) => change.out.name !== change.in.name)
      .map((change) => change.out.name);
    const unsubbed: Cap[] = [];

    for (const cap of orderBy(caps, ["start_minute"])) {
      const index = unsubbed.findIndex(
        (firstCap) => firstCap.player_id === cap.player_id,
      );
      if (subbedOutPlayerNames.includes(cap.players.name)) {
        // Player has been subbed out
      } else {
        if (index >= 0) {
          unsubbed.splice(index, 1);
        }
        unsubbed.push(cap);
      }
    }
    return unsubbed;
  }, [caps, match.changes]);

  return {
    sortedCaps,
    getFirstCaps,
    getUnsubbedCaps,
  };
};
