import dayjs, { type Dayjs } from 'dayjs';

export const readQueryString = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' && value[0] ? value[0] : undefined;
  }
  return typeof value === 'string' && value ? value : undefined;
};

export const readQueryNumber = (value: unknown): number | undefined => {
  const text = readQueryString(value);
  if (!text) return undefined;

  const parsed = Number(text);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

export const readQueryDay = (value: unknown, fallback: Dayjs): Dayjs => {
  const text = readQueryString(value);
  if (!text) return fallback;

  const parsed = dayjs(text);
  return parsed.isValid() && parsed.format('YYYY-MM-DD') === text ? parsed : fallback;
};

export const readQueryMonth = (value: unknown, fallback: Dayjs): Dayjs => {
  const text = readQueryString(value);
  if (!text || !/^\d{4}-(0[1-9]|1[0-2])$/.test(text)) {
    return fallback.startOf('month');
  }

  const parsed = dayjs(`${text}-01`);
  return parsed.isValid() ? parsed.startOf('month') : fallback.startOf('month');
};
