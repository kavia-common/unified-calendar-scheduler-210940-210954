// PUBLIC_INTERFACE
export function toISODate(d) {
  /** Convert Date -> YYYY-MM-DD in local time. */
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// PUBLIC_INTERFACE
export function startOfMonth(d) {
  /** First day of month. */
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// PUBLIC_INTERFACE
export function addDays(d, n) {
  /** Add days to a date (returns new Date). */
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// PUBLIC_INTERFACE
export function startOfWeekMonday(d) {
  /** Start of week (Monday) in local time. */
  const x = new Date(d);
  const day = x.getDay(); // 0 Sun ... 6 Sat
  const diff = (day + 6) % 7; // days since Monday
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - diff);
  return x;
}

// PUBLIC_INTERFACE
export function monthGridStart(d) {
  /** Start date for a 6-week month grid (Monday-based). */
  return startOfWeekMonday(startOfMonth(d));
}
