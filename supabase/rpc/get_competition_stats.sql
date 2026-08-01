CREATE OR REPLACE FUNCTION public.get_competition_stats(
  team_id integer,
  season integer,
  competition text
)
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
        c.id,
        c.name,
        c.champion,
        COUNT(*) FILTER (
          WHERE (m.home_team = t.name AND m.home_score > m.away_score)
             OR (m.away_team = t.name AND m.away_score > m.home_score)
        ) AS wins,
        COUNT(*) FILTER (
          WHERE m.home_score = m.away_score
        ) AS draws,
        COUNT(*) FILTER (
          WHERE (m.home_team = t.name AND m.home_score < m.away_score)
             OR (m.away_team = t.name AND m.away_score < m.home_score)
        ) AS losses,
        SUM(
          CASE
            WHEN m.home_team = t.name THEN m.home_score
            ELSE m.away_score
          END
        ) AS goals_for,
        SUM(
          CASE
            WHEN m.home_team = t.name THEN m.away_score
            ELSE m.home_score
          END
        ) AS goals_against
      FROM public.matches m
      JOIN public.teams t ON m.team_id = t.id
      JOIN public.competitions c
        ON c.name = m.competition
        AND c.season = get_competition_stats.season
        AND c.team_id = t.id
      WHERE m.season = get_competition_stats.season
        AND (
          get_competition_stats.competition IS NULL
          OR get_competition_stats.competition = ''
          OR m.competition = get_competition_stats.competition
        )
        AND m.competition IS NOT NULL
        AND m.team_id = get_competition_stats.team_id
      GROUP BY c.name, c.id
      ORDER BY c.id
    ) stats
  );

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_competition_stats(integer, integer, text)
  TO anon, authenticated, service_role;
