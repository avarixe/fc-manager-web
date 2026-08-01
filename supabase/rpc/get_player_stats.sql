CREATE OR REPLACE FUNCTION public.get_player_stats(player_ids jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  result JSONB;
BEGIN
  result := (
    SELECT jsonb_agg(stats)
    FROM (
      SELECT
        sub.player_id,
        m.competition,
        m.season,
        COUNT(DISTINCT a.match_id) AS num_matches,
        COUNT(DISTINCT a.match_id) FILTER (WHERE a.clean_sheet = TRUE) AS num_clean_sheets,
        SUM(a.num_goals) AS num_goals,
        SUM(a.num_assists) AS num_assists,
        SUM(a.stop_minute - a.start_minute) AS num_minutes,
        CASE
          WHEN SUM(a.stop_minute - a.start_minute) FILTER (WHERE a.rating IS NOT NULL) > 0
          THEN SUM(a.rating * (a.stop_minute - a.start_minute)) FILTER (WHERE a.rating IS NOT NULL)::NUMERIC
               / SUM(a.stop_minute - a.start_minute) FILTER (WHERE a.rating IS NOT NULL)
          ELSE NULL
        END AS avg_rating
      FROM jsonb_array_elements_text(player_ids) AS sub(player_id)
      LEFT JOIN public.caps AS a ON a.player_id = sub.player_id::INTEGER
      LEFT JOIN public.matches AS m ON m.id = a.match_id
      WHERE m.competition IS NOT NULL
        AND m.season IS NOT NULL
        AND a.rating IS NOT NULL
      GROUP BY
        sub.player_id,
        m.competition,
        m.season
      ORDER BY
        sub.player_id,
        m.season DESC,
        m.competition
    ) stats
  );

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_player_stats(jsonb)
  TO anon, authenticated, service_role;
