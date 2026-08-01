CREATE OR REPLACE FUNCTION public.search_options(
  search text,
  option_category text DEFAULT 'Team'::text,
  result_limit integer DEFAULT 50
)
RETURNS TABLE(value text)
LANGUAGE sql
STABLE
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
  SELECT o.value
  FROM public.options AS o
  WHERE btrim(search) <> ''
    AND o.category = search_options.option_category
    AND strpos(
      lower(unaccent(o.value)),
      lower(unaccent(btrim(search)))
    ) > 0
  ORDER BY o.value
  LIMIT GREATEST(COALESCE(result_limit, 50), 0);
$$;

GRANT EXECUTE ON FUNCTION public.search_options(text, text, integer)
  TO anon, authenticated, service_role;
