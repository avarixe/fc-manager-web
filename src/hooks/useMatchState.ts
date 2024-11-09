export default (minute: number) => {
  const { sortedCaps } = useCapHelpers();

  const match = useAtomValue(matchAtom)!;
  const endOfMatch = useMemo(
    () => (match.extra_time ? 120 : 90),
    [match.extra_time],
  );

  const capsAtMinute = useMemo(
    () =>
      sortedCaps.filter(
        (cap) =>
          cap.start_minute <= minute &&
          (minute < cap.stop_minute || cap.stop_minute === endOfMatch),
      ),
    [minute, sortedCaps, endOfMatch],
  );

  const activeCaps = useMemo(
    () => capsAtMinute.filter((cap) => cap.stop_minute > minute),
    [capsAtMinute, minute],
  );

  return {
    minute,
    sortedCaps,
    activeCaps,
    capsAtMinute,
  };
};
