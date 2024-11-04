export function assertType<T>(_value: unknown): asserts _value is T {}

export function assertDefined<T>(value: T): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error("Value is not defined");
  }
}
