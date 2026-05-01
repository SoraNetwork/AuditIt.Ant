import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const BUSINESS_TIMEZONE = 'Asia/Shanghai';

/**
 * Formats a UTC date string into the business timezone (UTC+8).
 * @param date The date string or Date object (assumed to be in UTC).
 * @param format The desired output format.
 * @returns The formatted date string in UTC+8, or an empty string if the date is invalid.
 */
export const formatDateTime = (date: string | Date | null | undefined, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!date) {
    return '';
  }

  const businessTime = dayjs.utc(date).tz(BUSINESS_TIMEZONE);
  return businessTime.isValid() ? businessTime.format(format) : '';
};
