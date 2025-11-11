import { Autocomplete, AutocompleteProps, Loader } from "@mantine/core";
import { useCallback, useEffect, useRef, useState } from "react";

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

  const onChangeValue = useCallback(
    async (input: string) => {
      onChange?.(input);
      clearTimeout(timeoutRef.current);
      if (!input || input.length < 3) {
        setOptions(defaultOptions ?? []);
        return;
      }

      if (options.includes(input)) {
        return;
      }

      timeoutRef.current = setTimeout(async () => {
        setLoading(true);
        const { data } = await supabase
          .from("options")
          .select("value")
          .ilike("value", `%${input}%`)
          .eq("category", "Team");
        if (data) {
          setOptions(data.map((option) => option.value));
        } else {
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
      value={value}
      data={options}
      onChange={onChangeValue}
      leftSection={loading ? <Loader size="xs" type="dots" /> : leftSection}
      {...rest}
      autoCapitalize="words"
      autoComplete="off"
    />
  );
};
