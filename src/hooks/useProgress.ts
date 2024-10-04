export const useProgress = (initialTotal = 0, initialCount = 0) => {
  const [total, setTotal] = useState(initialTotal);
  const [count, setCount] = useState(initialCount);

  const progress = useMemo(() => {
    return total > 0 ? (count / total) * 100 : 0;
  }, [count, total]);

  const increment = useCallback((amount = 1) => {
    setCount((prev) => prev + amount);
  }, []);

  return {
    total,
    setTotal,
    count,
    setCount,
    progress,
    increment,
  };
};
