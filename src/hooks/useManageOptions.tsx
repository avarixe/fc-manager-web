import { useAtomValue } from "jotai";
import { useCallback } from "react";

import { sessionAtom } from "@/atoms";
import { supabase } from "@/utils/supabase";

export const useManageOptions = () => {
  const session = useAtomValue(sessionAtom)!;
  const saveTeamOptions = useCallback(
    async (values: string[]) => {
      const data = values.map((value) => ({
        user_id: session.user.id,
        category: "Team",
        value,
      }));

      await supabase.from("options").upsert(data, {
        onConflict: "user_id, category, value",
        ignoreDuplicates: true,
      });
    },
    [session.user.id],
  );

  return {
    saveTeamOptions,
  };
};
