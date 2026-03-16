import { format, parseISO } from 'date-fns';

/**
 * Format a date string or Date object into the standard DD/MM/YYYY format used in India.
 */
export function formatDateStrict(dateStr) {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return format(date, 'dd/MM/yyyy');
}

/**
 * Format a date string into Indian Standard Time (12-hour format)
 */
export function formatTimeStrict(dateStr) {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return format(date, 'hh:mm a');
}

/**
 * Format date and time together (e.g. 24/10/2023 02:30 PM)
 */
export function formatDateTimeStrict(dateStr) {
  if (!dateStr) return '';
  return `${formatDateStrict(dateStr)} ${formatTimeStrict(dateStr)}`;
}
