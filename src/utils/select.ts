import {
  ComboboxItem,
  ComboboxParsedItem,
  isOptionsGroup,
  OptionsFilter,
} from "@mantine/core";

export function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

export const accentInsensitiveOptionsFilter: OptionsFilter = ({
  options,
  search,
  limit,
}) => {
  const parsedSearch = stripDiacritics(search.trim().toLowerCase());
  const result: ComboboxParsedItem[] = [];

  for (const item of options) {
    if (result.length === limit) {
      return result;
    }

    if (isOptionsGroup(item)) {
      result.push({
        group: item.group,
        items: accentInsensitiveOptionsFilter({
          options: item.items,
          search,
          limit: limit - result.length,
        }) as ComboboxItem[],
      });
    } else if (
      stripDiacritics(item.label.toLowerCase()).includes(parsedSearch)
    ) {
      result.push(item);
    }
  }

  return result;
};
