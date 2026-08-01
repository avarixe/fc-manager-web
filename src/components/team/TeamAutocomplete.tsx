import { Autocomplete, AutocompleteProps, Loader } from "@mantine/core";
import { useCallback, useEffect, useRef, useState } from "react";

import { accentInsensitiveOptionsFilter } from "@/utils/select";
import { supabase } from "@/utils/supabase";

export const TeamAutocomplete: React.FC<AutocompleteProps> = ({
  value,
  data: defaultOptions = [],
  leftSection,
  onChange,
  ...rest
}) => {
  const [options, setOptions] = useState(defaultOptions ?? []);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastQueryRef = useRef("");
  const searchIdRef = useRef(0);

  const onChangeValue = useCallback(
    (input: string) => {
      onChange?.(input);
      clearTimeout(timeoutRef.current);

      if (!input || input.length < 3) {
        searchIdRef.current += 1;
        lastQueryRef.current = "";
        setLoading(false);
        setOptions(defaultOptions ?? []);
        return;
      }

      if (options.includes(input)) {
        return;
      }

      // Appending (or keeping a longer prefix of the same query) can only
      // narrow results already fetched — skip the network and let the
      // Autocomplete filter handle it.
      const lastQuery = lastQueryRef.current;
      if (
        lastQuery.length >= 3 &&
        input.toLowerCase().startsWith(lastQuery.toLowerCase())
      ) {
        return;
      }

      const searchId = ++searchIdRef.current;
      timeoutRef.current = setTimeout(async () => {
        // Record before the request so additive keystrokes during flight
        // can skip instead of queueing another query.
        lastQueryRef.current = input;
        setLoading(true);
        const { data } = await supabase
          .from("options")
          .select("value")
          .ilike("value", `%${input}%`)
          .eq("category", "Team");

        if (searchId !== searchIdRef.current) {
          return;
        }

        if (data) {
          setOptions(data.map((option) => option.value));
        } else {
          lastQueryRef.current = "";
          setOptions(defaultOptions ?? []);
        }
        setLoading(false);
      }, 300);
    },
    [defaultOptions, onChange, options],
  );

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <Autocomplete
      {...rest}
      value={value}
      data={options}
      onChange={onChangeValue}
      filter={accentInsensitiveOptionsFilter}
      leftSection={loading ? <Loader size="xs" type="dots" /> : leftSection}
      autoCapitalize="words"
      autoComplete="off"
    />
  );
};
