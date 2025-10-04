/**
 * Text Error Handler
 * Prevents "Text strings must be rendered within a <Text> component" errors
 * by providing safe text rendering utilities
 */

/**
 * Safely renders text content, ensuring it's always a string
 * @param value - The value to render as text
 * @param fallback - Fallback text if value is null/undefined
 * @returns Safe string for text rendering
 */
export const safeText = (value: any, fallback: string = ''): string => {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  // For objects, arrays, etc., return fallback
  return fallback;
};

/**
 * Safely renders text with a prefix
 * @param prefix - The prefix text
 * @param value - The value to render
 * @param fallback - Fallback text if value is null/undefined
 * @returns Safe string with prefix
 */
export const safeTextWithPrefix = (prefix: string, value: any, fallback: string = 'Unknown'): string => {
  const safeValue = safeText(value, fallback);
  return `${prefix}${safeValue}`;
};

/**
 * Safely renders text with a suffix
 * @param value - The value to render
 * @param suffix - The suffix text
 * @param fallback - Fallback text if value is null/undefined
 * @returns Safe string with suffix
 */
export const safeTextWithSuffix = (value: any, suffix: string, fallback: string = 'Unknown'): string => {
  const safeValue = safeText(value, fallback);
  return `${safeValue}${suffix}`;
};

/**
 * Safely renders text with both prefix and suffix
 * @param prefix - The prefix text
 * @param value - The value to render
 * @param suffix - The suffix text
 * @param fallback - Fallback text if value is null/undefined
 * @returns Safe string with prefix and suffix
 */
export const safeTextWithPrefixAndSuffix = (
  prefix: string, 
  value: any, 
  suffix: string, 
  fallback: string = 'Unknown'
): string => {
  const safeValue = safeText(value, fallback);
  return `${prefix}${safeValue}${suffix}`;
};

/**
 * Safely renders text with conditional formatting
 * @param value - The value to render
 * @param formatter - Function to format the value
 * @param fallback - Fallback text if value is null/undefined
 * @returns Safe formatted string
 */
export const safeTextWithFormatter = (
  value: any, 
  formatter: (val: string) => string, 
  fallback: string = 'Unknown'
): string => {
  const safeValue = safeText(value, fallback);
  return formatter(safeValue);
};

/**
 * Common text formatters
 */
export const textFormatters = {
  uppercase: (val: string) => val.toUpperCase(),
  lowercase: (val: string) => val.toLowerCase(),
  capitalize: (val: string) => val.charAt(0).toUpperCase() + val.slice(1).toLowerCase(),
  truncate: (val: string, maxLength: number = 50) => 
    val.length > maxLength ? val.substring(0, maxLength) + '...' : val,
};

/**
 * Safe text rendering for common use cases
 */
export const safeTextRenderers = {
  binTitle: (binId: any) => safeTextWithPrefix('Bin ', binId, 'Unknown'),
  statusText: (status: any) => safeTextWithFormatter(status, textFormatters.uppercase, 'pending'),
  typeText: (type: any) => safeText(type, 'task'),
  messageText: (message: any) => safeText(message, 'No message available'),
  locationText: (location: any) => safeText(location, 'Unknown Location'),
  timeText: (date: any, time: any) => {
    const safeDate = safeText(date, 'Unknown');
    const safeTime = safeText(time, '');
    return safeTime ? `${safeDate} ${safeTime}` : safeDate;
  },
};
