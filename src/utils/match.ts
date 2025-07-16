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

export function ratingColor(rating: number) {
  if (rating >= 4.5) {
    return "green.8";
  } else if (rating >= 4.25) {
    return "green.6";
  } else if (rating >= 4.0) {
    return "green";
  } else if (rating >= 3.5) {
    return "lime.2";
  } else if (rating >= 3) {
    return "yellow";
  } else if (rating >= 2.7) {
    return "orange.2";
  } else if (rating >= 2.3) {
    return "orange";
  } else if (rating >= 2) {
    return "orange.6";
  } else if (rating >= 1.5) {
    return "red";
  } else {
    return "red.6";
  }
}
