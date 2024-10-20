import { createClient, Session, SupabaseClient } from "@supabase/supabase-js";
import { atom } from "jotai";
import { Database, Tables } from "@/database-generated.types";

export const supabaseAtom = atom<SupabaseClient<Database>>(
  createClient<Database>(
    import.meta.env.VITE_APP_SUPABASE_URL,
    import.meta.env.VITE_APP_SUPABASE_KEY,
    {
      db: {
        schema: "public",
      },
      auth: {
        autoRefreshToken: true,
      },
    },
  ),
);

export const sessionAtom = atom<Session | null>(null);

export const teamAtom = atom<Tables<"teams"> | null>(null);

export const appLoadingAtom = atom(false);

export const appearanceMapAtom = atom(new AppearanceMap());

export const appearancesArrayAtom = atom((get) =>
  [...get(appearanceMapAtom).values()].map((appearanceAtom) =>
    get(appearanceAtom),
  ),
);
