CREATE OR REPLACE FUNCTION public.list_matches(
  p_team_id bigint,
  p_user_team_name text,
  p_season integer DEFAULT NULL,
  p_competition text DEFAULT NULL,
  p_opponent text DEFAULT NULL,
  p_results text[] DEFAULT NULL,
  p_sort_desc boolean DEFAULT true,
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
  WITH filtered AS (
    SELECT
      m.id,
      m.home_team,
      m.away_team,
      m.home_score,
      m.away_score,
      m.played_on,
      m.competition,
      m.season,
      m.stage,
      m.home_penalty_score,
      m.away_penalty_score
    FROM public.matches AS m
    WHERE m.team_id = p_team_id
      AND (p_season IS NULL OR m.season = p_season)
      AND (
        p_competition IS NULL
        OR btrim(p_competition) = ''
        OR m.competition = p_competition
      )
      AND (
        p_opponent IS NULL
        OR btrim(p_opponent) = ''
        OR strpos(
          lower(unaccent(m.home_team)),
          lower(unaccent(btrim(p_opponent)))
        ) > 0
        OR strpos(
          lower(unaccent(m.away_team)),
          lower(unaccent(btrim(p_opponent)))
        ) > 0
      )
      AND (
        p_results IS NULL
        OR cardinality(p_results) >= 3
        OR EXISTS (
          SELECT 1
          FROM unnest(p_results) AS r(result)
          WHERE CASE r.result
            WHEN 'W' THEN
              (m.home_team = p_user_team_name AND m.home_result = 'W')
              OR (m.away_team = p_user_team_name AND m.home_result = 'L')
            WHEN 'D' THEN
              (m.home_team = p_user_team_name AND m.home_result = 'D')
              OR (m.away_team = p_user_team_name AND m.home_result = 'D')
            WHEN 'L' THEN
              (m.home_team = p_user_team_name AND m.home_result = 'L')
              OR (m.away_team = p_user_team_name AND m.home_result = 'W')
            ELSE FALSE
          END
        )
      )
  ),
  page AS (
    SELECT
      f.*,
      row_number() OVER (
        ORDER BY
          CASE WHEN COALESCE(p_sort_desc, true) THEN f.played_on END DESC,
          CASE WHEN NOT COALESCE(p_sort_desc, true) THEN f.played_on END ASC,
          CASE WHEN COALESCE(p_sort_desc, true) THEN f.id END DESC,
          CASE WHEN NOT COALESCE(p_sort_desc, true) THEN f.id END ASC
      ) AS rn
    FROM filtered AS f
  )
  SELECT jsonb_build_object(
    'count',
    (SELECT COUNT(*)::integer FROM filtered),
    'items',
    COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(p) - 'rn' ORDER BY p.rn)
        FROM page AS p
        WHERE p.rn > GREATEST(COALESCE(p_offset, 0), 0)
          AND p.rn <= GREATEST(COALESCE(p_offset, 0), 0)
            + GREATEST(COALESCE(p_limit, 10), 0)
      ),
      '[]'::jsonb
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.list_matches(
  bigint,
  text,
  integer,
  text,
  text,
  text[],
  boolean,
  integer,
  integer
) TO anon, authenticated, service_role;
