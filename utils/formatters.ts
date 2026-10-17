/**
 * Format a number using Indian number system (lakhs, crores)
 * Example: 123456.78 -> "₹1,23,456.78"
 */
export const formatIndianCurrency = (
  value: number,
  options?: { showSymbol?: boolean; decimals?: number }
): string => {
  const { showSymbol = true, decimals = 2 } = options ?? {};

  const formatter = new Intl.NumberFormat('en-IN', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(value);
};

/**
 * Format a number using Indian number system without currency symbol
 * Example: 123456.78 -> "1,23,456.78"
 */
export const formatIndianNumber = (value: number, decimals: number = 2): string => {
  if (value === 0) return '0';

  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });

  return formatter.format(value);
};

/**
 * Format a percentage value
 * Example: 1.47 -> "+1.47%", -2.30 -> "-2.30%"
 */
export const formatPercentage = (
  value: number,
  options?: { showSign?: boolean; decimals?: number }
): string => {
  const { showSign = true, decimals = 2 } = options ?? {};
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};

/**
 * Format a large number in compact form
 * Example: 1500000 -> "15L", 25000000 -> "2.5Cr"
 */
export const formatCompactIndian = (value: number): string => {
  const absValue = Math.abs(value);

  if (absValue >= 10000000) {
    // Crores
    return `${(value / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
  } else if (absValue >= 100000) {
    // Lakhs
    return `${(value / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  } else if (absValue >= 1000) {
    // Thousands
    return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }

  return value.toString();
};

/**
 * Format relative time
 * Example: "2 hours ago", "3 days ago"
 */
export const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y`;
};

/**
 * Truncate text to a maximum length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

/**
 * Get initials from a name (max 2 characters)
 */
export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate a random color from the chart palette
 */
export const getChartColor = (index: number, palette: readonly string[]): string => {
  return palette[index % palette.length];
};
