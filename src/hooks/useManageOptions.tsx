import { useAtomValue } from "jotai";
import { useCallback } from "react";

import { sessionAtom, supabaseAtom } from "@/atoms";

export const useManageOptions = () => {
  const supabase = useAtomValue(supabaseAtom);
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
    [session.user.id, supabase],
  );

  return {
    saveTeamOptions,
  };
};
