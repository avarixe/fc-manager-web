export function formatDate(date: string | null, dateFormat = 'MMM DD, YYYY') {
  return date ? dayjs(date).format(dateFormat) : null
}

export function formatMoney(
  amount: number | string | null,
  currency = '$',
  emptyString = ''
) {
  return amount
    ? `${currency}${Number(amount).toLocaleString()}`
    : emptyString
}
