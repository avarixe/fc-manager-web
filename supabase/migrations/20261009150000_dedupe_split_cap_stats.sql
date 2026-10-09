-- Match stats belong only on a player's first cap in a match. The team importer
-- previously copied them onto every cap, double counting goals and assists.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY player_id, match_id
      ORDER BY start_minute, id
    ) AS rn
  FROM public.caps
)
UPDATE public.caps AS c
SET
  num_goals = 0,
  num_assists = 0,
  num_own_goals = 0,
  num_yellow_cards = 0,
  num_red_cards = 0,
  clean_sheet = FALSE
FROM ranked
WHERE ranked.id = c.id
  AND ranked.rn > 1
  AND (
    c.num_goals > 0
    OR c.num_assists > 0
    OR c.num_own_goals > 0
    OR c.num_yellow_cards > 0
    OR c.num_red_cards > 0
    OR c.clean_sheet
  );
