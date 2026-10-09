import { orderBy } from "lodash-es";

import { statGradientColors } from "@/constants";
import { Match } from "@/types";

interface TimedEvent {
  minute: number;
  stoppage_time?: number;
}

function compareEventTime(a: TimedEvent, b: TimedEvent) {
  return a.minute - b.minute || (a.stoppage_time ?? 0) - (b.stoppage_time ?? 0);
}

function earliestEvent<T extends TimedEvent>(events: T[]) {
  return orderBy(events, ["minute", (event) => event.stoppage_time ?? 0])[0];
}

// A player keeps a clean sheet if no goal was conceded while he was on the
// pitch. A goal in the same minute as his entry counts against him, and one in
// the same minute as his exit does not.
export function keptCleanSheet(
  match: Pick<Match, "goals" | "changes" | "bookings">,
  playerName: string,
  isTeamHome: boolean,
) {
  const entry = earliestEvent(
    match.changes.filter(
      (change) =>
        change.in.name === playerName && change.out.name !== playerName,
    ),
  );
  const exit = earliestEvent<TimedEvent>([
    ...match.changes.filter(
      (change) =>
        change.out.name === playerName && change.in.name !== playerName,
    ),
    ...match.bookings.filter(
      (booking) =>
        booking.player_name === playerName &&
        booking.home === isTeamHome &&
        booking.red_card,
    ),
  ]);

  return !match.goals.some((goal) => {
    const isHomeGoal = goal.home !== goal.own_goal;
    return (
      isHomeGoal !== isTeamHome &&
      (!entry || compareEventTime(goal, entry) >= 0) &&
      (!exit || compareEventTime(goal, exit) < 0)
    );
  });
}

export function playerMatchStats(
  match: Pick<Match, "goals" | "changes" | "bookings">,
  playerName: string,
  isTeamHome: boolean,
) {
  const stats = {
    num_goals: 0,
    num_own_goals: 0,
    num_assists: 0,
    num_yellow_cards: 0,
    num_red_cards: 0,
    clean_sheet: keptCleanSheet(match, playerName, isTeamHome),
  };

  for (const goal of match.goals) {
    if (goal.home !== isTeamHome) {
      continue;
    }
    if (goal.player_name === playerName) {
      stats[goal.own_goal ? "num_own_goals" : "num_goals"]++;
    } else if (goal.assisted_by === playerName) {
      stats.num_assists++;
    }
  }

  for (const booking of match.bookings) {
    if (booking.player_name === playerName && booking.home === isTeamHome) {
      stats[booking.red_card ? "num_red_cards" : "num_yellow_cards"]++;
    }
  }

  return stats;
}

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
