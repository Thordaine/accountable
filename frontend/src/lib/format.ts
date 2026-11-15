import { differenceInCalendarDays, format, parseISO } from "date-fns";

/** Whole US dollars with separators: US$48,200. */
export function formatMoney(n: number) {
  return "US$" + Math.round(n).toLocaleString("en-US");
}

/** Short money for tight spaces: US$950, US$48k, US$1.2M. */
export function formatMoneyShort(n: number) {
  if (n < 1000) return formatMoney(n);
  const thousands = Math.round(n / 1000);
  if (thousands < 1000) return `US$${thousands}k`;
  return `US$${(n / 1e6).toFixed(1)}M`;
}

/** A YYYY-MM-DD date as 15 Nov 2026. */
export function formatDate(iso: string) {
  return format(parseISO(iso), "d MMM yyyy");
}

/** A local date-time as 15 Nov 2026, 10:40. */
export function formatDateTime(iso: string) {
  return format(parseISO(iso), "d MMM yyyy, HH:mm");
}

/** When a follow-up is due: 4 days overdue, 1 day overdue, Today, Tue 17 Nov. */
export function formatDue(iso: string, today: Date) {
  const days = differenceInCalendarDays(parseISO(iso), today);
  if (days < -1) return `${-days} days overdue`;
  if (days === -1) return "1 day overdue";
  if (days === 0) return "Today";
  return format(parseISO(iso), "EEE d MMM");
}

/** A date as YYYY-MM-DD. */
export function isoDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}
