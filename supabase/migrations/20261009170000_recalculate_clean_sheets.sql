-- A player keeps a clean sheet if no goal was conceded while he was on the
-- pitch. A goal in the same minute as his entry counts against him, and one in
-- the same minute as his exit does not. Only a player's first cap in a match
-- holds the flag.
WITH first_caps AS (
  SELECT DISTINCT ON (c.player_id, c.match_id)
    c.id,
    p.name AS player_name,
    m.goals,
    m.changes,
    m.bookings,
    m.home_team = t.name AS is_team_home
  FROM public.caps AS c
  JOIN public.players AS p ON p.id = c.player_id
  JOIN public.matches AS m ON m.id = c.match_id
  JOIN public.teams AS t ON t.id = m.team_id
  ORDER BY c.player_id, c.match_id, c.start_minute, c.id
),
windows AS (
  SELECT
    f.*,
    entry.minute AS entry_minute,
    entry.stoppage_time AS entry_stoppage_time,
    exit.minute AS exit_minute,
    exit.stoppage_time AS exit_stoppage_time
  FROM first_caps AS f
  LEFT JOIN LATERAL (
    SELECT
      (e->>'minute')::INTEGER AS minute,
      COALESCE((e->>'stoppage_time')::INTEGER, 0) AS stoppage_time
    FROM jsonb_array_elements(COALESCE(f.changes, '[]'::JSONB)) AS e
    WHERE e->'in'->>'name' = f.player_name
      AND e->'out'->>'name' IS DISTINCT FROM f.player_name
    ORDER BY 1, 2
    LIMIT 1
  ) AS entry ON TRUE
  LEFT JOIN LATERAL (
    SELECT minute, stoppage_time
    FROM (
      SELECT
        (e->>'minute')::INTEGER AS minute,
        COALESCE((e->>'stoppage_time')::INTEGER, 0) AS stoppage_time
      FROM jsonb_array_elements(COALESCE(f.changes, '[]'::JSONB)) AS e
      WHERE e->'out'->>'name' = f.player_name
        AND e->'in'->>'name' IS DISTINCT FROM f.player_name
      UNION ALL
      SELECT
        (b->>'minute')::INTEGER,
        COALESCE((b->>'stoppage_time')::INTEGER, 0)
      FROM jsonb_array_elements(COALESCE(f.bookings, '[]'::JSONB)) AS b
      WHERE b->>'player_name' = f.player_name
        AND (b->>'home')::BOOLEAN = f.is_team_home
        AND COALESCE((b->>'red_card')::BOOLEAN, FALSE)
    ) AS exits
    ORDER BY 1, 2
    LIMIT 1
  ) AS exit ON TRUE
),
recalculated AS (
  SELECT
    w.id,
    NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(w.goals, '[]'::JSONB)) AS g
      WHERE ((g->>'home')::BOOLEAN <> COALESCE((g->>'own_goal')::BOOLEAN, FALSE))
          <> w.is_team_home
        AND (
          w.entry_minute IS NULL
          OR ((g->>'minute')::INTEGER, COALESCE((g->>'stoppage_time')::INTEGER, 0))
            >= (w.entry_minute, w.entry_stoppage_time)
        )
        AND (
          w.exit_minute IS NULL
          OR ((g->>'minute')::INTEGER, COALESCE((g->>'stoppage_time')::INTEGER, 0))
            < (w.exit_minute, w.exit_stoppage_time)
        )
    ) AS clean_sheet
  FROM windows AS w
)
UPDATE public.caps AS c
SET clean_sheet = r.clean_sheet
FROM recalculated AS r
WHERE r.id = c.id
  AND c.clean_sheet IS DISTINCT FROM r.clean_sheet;
