import { statGradientColors } from "@/constants";
import { Match } from "@/types";

export function matchScore(
  match: Pick<
    Match,
    "home_score" | "away_score" | "home_penalty_score" | "away_penalty_score"
  >,
) {
  let score = String(match.home_score);
  if (match.home_penalty_score !== null) {
    score += ` (${match.home_penalty_score})`;
  }
  score += ` - ${match.away_score}`;
  if (match.away_penalty_score !== null) {
    score += ` (${match.away_penalty_score})`;
  }
  return score;
}

export function matchScoreColor(
  match: Pick<
    Match,
    | "home_team"
    | "away_team"
    | "home_score"
    | "away_score"
    | "home_penalty_score"
    | "away_penalty_score"
  >,
  teamName?: string,
) {
  if (match.home_score === match.away_score) {
    return "yellow";
  } else if (teamName === match.home_team) {
    if (match.home_score > match.away_score) {
      return "green";
    } else if (match.home_score < match.away_score) {
      return "red";
    } else {
      return "yellow";
    }
  } else if (teamName === match.away_team) {
    if (match.home_score < match.away_score) {
      return "green";
    } else if (match.home_score > match.away_score) {
      return "red";
    } else {
      return "yellow";
    }
  }
}

const ratingThresholds = [90, 85, 80, 75, 70, 65, 60, 55, 50, 40];

export function ratingColor(rating: number | null) {
  if (rating === null) {
    return undefined;
  }
  const index = ratingThresholds.findIndex((threshold) => rating >= threshold);
  return statGradientColors[index ?? 9];
}
