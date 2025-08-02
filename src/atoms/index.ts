import { Session } from "@supabase/supabase-js";
import { atom } from "jotai";

import { BreadcrumbItem, Cap, Competition, Match, Team } from "@/types";

export const sessionAtom = atom<Session | null>(null);

export const appLoadingAtom = atom(false);

export const teamAtom = atom<Team | null>(null);

export const matchAtom = atom<Match | null>(null);

export const capsAtom = atom<Cap[]>([]);

export const competitionAtom = atom<Competition | null>(null);

export const breadcrumbsAtom = atom<BreadcrumbItem[]>([]);
