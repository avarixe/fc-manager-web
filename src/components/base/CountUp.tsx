import { CountUp as CountUpEngine, type CountUpOptions } from "countup.js";
import {
  type CSSProperties,
  type FC,
  type HTMLAttributes,
  useEffect,
  useMemo,
  useRef,
} from "react";

export type CountUpProps = {
  end: number;
  start?: number;
  duration?: number;
  useEasing?: boolean;
  preserveValue?: boolean;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  style?: CSSProperties;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

export const CountUp: FC<CountUpProps> = ({
  end,
  start = 0,
  duration = 2,
  useEasing = true,
  preserveValue = true,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
  style,
  ...spanProps
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const instanceRef = useRef<CountUpEngine | null>(null);
  const prevEndRef = useRef<number | null>(null);
  const endRef = useRef(end);

  useEffect(() => {
    endRef.current = end;
  }, [end]);

  const options = useMemo<CountUpOptions>(
    () => ({
      startVal: start,
      duration,
      useEasing,
      prefix,
      suffix,
      decimalPlaces: decimals,
    }),
    [start, duration, useEasing, prefix, suffix, decimals],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    instanceRef.current?.reset();
    const currentEnd = endRef.current;
    const instance = new CountUpEngine(el, currentEnd, options);
    instanceRef.current = instance;
    prevEndRef.current = currentEnd;
    instance.start();

    return () => {
      instance.reset();
      instanceRef.current = null;
    };
  }, [options]);

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;
    if (prevEndRef.current === end) return;

    if (!preserveValue) instance.reset();
    instance.update(end);
    prevEndRef.current = end;
  }, [end, preserveValue]);

  return <span ref={ref} className={className} style={style} {...spanProps} />;
};
