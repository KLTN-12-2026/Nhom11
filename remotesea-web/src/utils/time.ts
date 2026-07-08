const MS_PER_DAY = 86_400_000;
const MS_PER_HOUR = 3_600_000;

export interface RelativeTimeSuffix {
  day: string;
  hour: string;
  now: string;
}

export const formatRelativeTime = (
  dateString: string | null,
  suffix: RelativeTimeSuffix
): string => {
  if (!dateString) return suffix.now;
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / MS_PER_DAY);
  if (days >= 1) return `${days}${suffix.day}`;
  const hours = Math.floor(diff / MS_PER_HOUR);
  if (hours >= 1) return `${hours}${suffix.hour}`;
  return suffix.now;
};
