import { orderBy } from "lodash-es";

export default (minute: number) => {
  const appearances = useAtomValue(appearancesAtom);

  const sortedAppearances = useMemo(
    () => orderBy(appearances, ["pos_order", "start"]),
    [appearances],
  );

  const appearancesAtMinute = useMemo(
    () =>
      sortedAppearances.filter(
        (appearance) =>
          appearance.start_minute <= minute && minute <= appearance.stop_minute,
      ),
    [minute, sortedAppearances],
  );

  const activeAppearances = useMemo(
    () =>
      appearancesAtMinute.filter(
        (appearance) => !appearance.next_id || appearance.stop_minute > minute,
      ),
    [appearancesAtMinute, minute],
  );

  return {
    minute,
    sortedAppearances,
    activeAppearances,
    appearancesAtMinute,
  };
};
