export function formatDate(date: string | null, dateFormat = "MMM DD, YYYY") {
  return date ? dayjs(date).format(dateFormat) : null;
}
