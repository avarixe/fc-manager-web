import { createClient, Session, SupabaseClient } from "@supabase/supabase-js";
import { atom } from "jotai";
import { Database, Tables } from "@/database-generated.types";
import { Appearance, Match } from "@/types";

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

export const appLoadingAtom = atom(false);

export const teamAtom = atom<Tables<"teams"> | null>(null);

export const matchAtom = atom<Match | null>(null);

export const appearancesAtom = atom<Appearance[]>([]);
