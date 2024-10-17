import { Tables } from "@/database-generated.types";
import { Appearance } from "@/types";
import { Atom } from "jotai";

type AppearanceAtom = Atom<Appearance>;
export class AppearanceMap extends Map<number, AppearanceAtom> {
  constructor(entries?: readonly (readonly [number, AppearanceAtom])[]) {
    super(entries);
  }
}

export function matchScore(
  match: Pick<
    Tables<"matches">,
    "home_score" | "away_score" | "home_penalty_score" | "away_penalty_score"
  >,
) {
  let score = String(match.home_score);
  if (match.home_penalty_score) {
    score += ` (${match.home_penalty_score})`;
  }
  score += ` - ${match.away_score}`;
  if (match.away_penalty_score) {
    score += ` (${match.away_penalty_score})`;
  }
  return score;
}
