/**
 * Format a timestamp into a readable date string.
 * E.g. "Apr 1, 2026"
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format a timestamp into a readable time string.
 * E.g. "2:30 PM"
 */
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Return a human-friendly relative time string.
 * E.g. "just now", "5 minutes ago", "2 hours ago", "yesterday", "3 days ago"
 */
export const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(timestamp);
};

/**
 * Return a time-of-day aware greeting.
 * Optionally include the user's name.
 */
export const getGreeting = (name?: string): string => {
  const hour = new Date().getHours();
  let greeting: string;

  if (hour < 5) {
    greeting = 'Good evening';
  } else if (hour < 12) {
    greeting = 'Good morning';
  } else if (hour < 17) {
    greeting = 'Good afternoon';
  } else {
    greeting = 'Good evening';
  }

  return name ? `${greeting}, ${name}` : greeting;
};

/**
 * Check if two timestamps fall on the same calendar day.
 */
export const isSameDay = (a: number, b: number): boolean => {
  const dateA = new Date(a);
  const dateB = new Date(b);
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
};

/**
 * Return the number of full calendar days between two timestamps.
 */
export const getDaysBetween = (a: number, b: number): number => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const dateA = new Date(a);
  const dateB = new Date(b);
  // Normalize to midnight
  const utcA = Date.UTC(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
  const utcB = Date.UTC(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
  return Math.abs(Math.floor((utcB - utcA) / msPerDay));
};

/**
 * Format a duration in milliseconds to a human-readable session duration.
 * E.g. "5 min", "1 hr 23 min"
 */
export const formatSessionDuration = (durationMs: number): string => {
  const totalMinutes = Math.floor(durationMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }
  if (minutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${minutes} min`;
};
