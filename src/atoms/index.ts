import { Session } from "@supabase/supabase-js";
import { atom } from "jotai";

import { Tables } from "@/database.types";
import { BreadcrumbItem, Cap, Competition, Match } from "@/types";

export const sessionAtom = atom<Session | null>(null);

export const appLoadingAtom = atom(false);

export const teamAtom = atom<Tables<"teams"> | null>(null);

export const matchAtom = atom<Match | null>(null);

export const capsAtom = atom<Cap[]>([]);

export const competitionAtom = atom<Competition | null>(null);

export const breadcrumbsAtom = atom<BreadcrumbItem[]>([]);
