-- Recount each player's first cap in a match from the match's goals and
-- bookings. Saving a substitution previously copied stats from the player's
-- old cap, so a substitute without one ended up with zeros.
WITH first_caps AS (
  SELECT DISTINCT ON (c.player_id, c.match_id)
    c.id,
    p.name AS player_name,
    COALESCE(m.goals, '[]'::JSONB) AS goals,
    COALESCE(m.bookings, '[]'::JSONB) AS bookings,
    m.home_team = t.name AS is_team_home
  FROM public.caps AS c
  JOIN public.players AS p ON p.id = c.player_id
  JOIN public.matches AS m ON m.id = c.match_id
  JOIN public.teams AS t ON t.id = m.team_id
  ORDER BY c.player_id, c.match_id, c.start_minute, c.id
),
recounted AS (
  SELECT
    f.id,
    (
      SELECT COUNT(*)
      FROM jsonb_array_elements(f.goals) AS g
      WHERE (g->>'home')::BOOLEAN = f.is_team_home
        AND g->>'player_name' = f.player_name
        AND NOT COALESCE((g->>'own_goal')::BOOLEAN, FALSE)
    ) AS num_goals,
    (
      SELECT COUNT(*)
      FROM jsonb_array_elements(f.goals) AS g
      WHERE (g->>'home')::BOOLEAN = f.is_team_home
        AND g->>'player_name' = f.player_name
        AND COALESCE((g->>'own_goal')::BOOLEAN, FALSE)
    ) AS num_own_goals,
    (
      SELECT COUNT(*)
      FROM jsonb_array_elements(f.goals) AS g
      WHERE (g->>'home')::BOOLEAN = f.is_team_home
        AND g->>'player_name' IS DISTINCT FROM f.player_name
        AND g->>'assisted_by' = f.player_name
    ) AS num_assists,
    (
      SELECT COUNT(*)
      FROM jsonb_array_elements(f.bookings) AS b
      WHERE (b->>'home')::BOOLEAN = f.is_team_home
        AND b->>'player_name' = f.player_name
        AND NOT COALESCE((b->>'red_card')::BOOLEAN, FALSE)
    ) AS num_yellow_cards,
    (
      SELECT COUNT(*)
      FROM jsonb_array_elements(f.bookings) AS b
      WHERE (b->>'home')::BOOLEAN = f.is_team_home
        AND b->>'player_name' = f.player_name
        AND COALESCE((b->>'red_card')::BOOLEAN, FALSE)
    ) AS num_red_cards
  FROM first_caps AS f
)
UPDATE public.caps AS c
SET
  num_goals = r.num_goals,
  num_own_goals = r.num_own_goals,
  num_assists = r.num_assists,
  num_yellow_cards = r.num_yellow_cards,
  num_red_cards = r.num_red_cards
FROM recounted AS r
WHERE r.id = c.id
  AND (c.num_goals, c.num_own_goals, c.num_assists, c.num_yellow_cards, c.num_red_cards)
    IS DISTINCT FROM
    (r.num_goals, r.num_own_goals, r.num_assists, r.num_yellow_cards, r.num_red_cards);
