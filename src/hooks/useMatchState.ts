export default (minute: number) => {
  const { sortedCaps } = useCapHelpers();

  const capsAtMinute = useMemo(
    () =>
      sortedCaps.filter(
        (cap) => cap.start_minute <= minute && minute <= cap.stop_minute,
      ),
    [minute, sortedCaps],
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
