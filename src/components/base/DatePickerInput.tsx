import {
  DatePickerInput as BaseDatePickerInput,
  DatePickerInputProps as BaseDatePickerInputProps,
} from "@mantine/dates";

export interface DatePickerInputProps
  extends Omit<BaseDatePickerInputProps, "value" | "onChange"> {
  value?: string | null;
  onChange?: (value: string | null) => void;
}

export const DatePickerInput = forwardRef<
  HTMLButtonElement,
  DatePickerInputProps
>(({ defaultValue, value, onChange, ...props }, ref) => {
  const [dateValue, setDateValue, dateValueRef] = useStateRef<Date | null>(
    null,
  );

  useEffect(() => {
    const newValue = value ?? defaultValue;
    setDateValue(newValue ? dayjs(newValue) : null);
  }, [defaultValue, setDateValue, value]);

  const onDateChange = useCallback(
    (date: Date | null) => {
      setDateValue(date);

      onChange?.(
        dateValueRef.current
          ? dayjs(dateValueRef.current).format("YYYY-MM-DD")
          : null,
      );
    },
    [dateValueRef, onChange, setDateValue],
  );

  return (
    <BaseDatePickerInput<"default">
      ref={ref}
      value={dateValue}
      onChange={onDateChange}
      firstDayOfWeek={0}
      {...props}
    />
  );
});
