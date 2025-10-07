/**
 * Time utility functions for dynamic timestamp formatting
 */

export interface TimeAgoResult {
  text: string;
  value: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
}

/**
 * Calculate time difference and return human-readable format
 * @param timestamp - The timestamp to compare against current time
 * @param currentTime - Current time (defaults to now)
 * @returns Object with formatted text and time details
 */
export function getTimeAgo(timestamp: string | number | Date, currentTime?: Date): TimeAgoResult {
  const now = currentTime || new Date();
  let targetTime: Date;

  // Parse different timestamp formats
  if (typeof timestamp === 'string') {
    targetTime = new Date(timestamp);
  } else if (typeof timestamp === 'number') {
    // Handle both seconds and milliseconds
    if (timestamp < 10000000000) {
      // Assume seconds if timestamp is less than 10 billion
      targetTime = new Date(timestamp * 1000);
    } else {
      // Assume milliseconds
      targetTime = new Date(timestamp);
    }
  } else {
    targetTime = timestamp;
  }

  // Check if timestamp is valid
  if (isNaN(targetTime.getTime())) {
    return {
      text: 'Unknown',
      value: 0,
      unit: 'seconds'
    };
  }

  const diffMs = now.getTime() - targetTime.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  // Handle future timestamps
  if (diffMs < 0) {
    return {
      text: 'Just now',
      value: 0,
      unit: 'seconds'
    };
  }

  // Return appropriate time unit
  if (diffSeconds < 60) {
    return {
      text: diffSeconds <= 1 ? 'Just now' : `Active ${diffSeconds}s ago`,
      value: diffSeconds,
      unit: 'seconds'
    };
  } else if (diffMinutes < 60) {
    return {
      text: `Active ${diffMinutes}m ago`,
      value: diffMinutes,
      unit: 'minutes'
    };
  } else if (diffHours < 24) {
    return {
      text: `Active ${diffHours}h ago`,
      value: diffHours,
      unit: 'hours'
    };
  } else if (diffDays < 7) {
    return {
      text: `Active ${diffDays}d ago`,
      value: diffDays,
      unit: 'days'
    };
  } else if (diffWeeks < 4) {
    return {
      text: `Active ${diffWeeks}w ago`,
      value: diffWeeks,
      unit: 'weeks'
    };
  } else if (diffMonths < 12) {
    return {
      text: `Active ${diffMonths}mo ago`,
      value: diffMonths,
      unit: 'months'
    };
  } else {
    return {
      text: `Active ${diffYears}y ago`,
      value: diffYears,
      unit: 'years'
    };
  }
}

/**
 * Get the most recent timestamp from bin data
 * @param binData - Bin data object
 * @returns The most recent timestamp or null
 */
export function getMostRecentTimestamp(binData: any): string | number | Date | null {
  if (!binData) return null;

  // Priority order for timestamps (most recent first)
  const timestampFields = [
    'last_active',
    'gps_timestamp', 
    'backup_timestamp', // Add backup coordinates timestamp
    'timestamp',
    'updated_at',
    'created_at'
  ];

  // Find the most recent valid timestamp
  let mostRecentTimestamp = null;
  let mostRecentTime = 0;

  for (const field of timestampFields) {
    if (binData[field]) {
      const timestamp = binData[field];
      let timestampTime: number;

      // Parse different timestamp formats
      if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        timestampTime = date.getTime();
      } else if (typeof timestamp === 'number') {
        // Handle both seconds and milliseconds
        if (timestamp < 10000000000) {
          // Assume seconds if timestamp is less than 10 billion
          timestampTime = timestamp * 1000;
        } else {
          // Assume milliseconds
          timestampTime = timestamp;
        }
      } else {
        timestampTime = timestamp.getTime();
      }

      // Check if timestamp is valid and not in the future
      if (!isNaN(timestampTime) && timestampTime <= Date.now() && timestampTime > mostRecentTime) {
        mostRecentTimestamp = timestamp;
        mostRecentTime = timestampTime;
      }
    }
  }

  return mostRecentTimestamp;
}

/**
 * Get dynamic "Active X ago" text for bin data
 * @param binData - Bin data object
 * @param currentTime - Current time (defaults to now)
 * @returns Formatted "Active X ago" string
 */
export function getActiveTimeAgo(binData: any, currentTime?: Date): string {
  const timestamp = getMostRecentTimestamp(binData);
  
  if (!timestamp) {
    return 'No data';
  }

  const timeAgo = getTimeAgo(timestamp, currentTime);
  return timeAgo.text;
}

/**
 * Check if bin data is considered "fresh" (recently updated)
 * @param binData - Bin data object
 * @param thresholdMinutes - Threshold in minutes (default: 5)
 * @returns True if data is fresh
 */
export function isDataFresh(binData: any, thresholdMinutes: number = 5): boolean {
  const timestamp = getMostRecentTimestamp(binData);
  
  if (!timestamp) return false;

  const timeAgo = getTimeAgo(timestamp);
  
  // Check if data is within threshold
  switch (timeAgo.unit) {
    case 'seconds':
    case 'minutes':
      return timeAgo.value < thresholdMinutes;
    case 'hours':
    case 'days':
    case 'weeks':
    case 'months':
    case 'years':
      return false;
    default:
      return false;
  }
}

/**
 * Get status color based on data freshness
 * @param binData - Bin data object
 * @param thresholdMinutes - Threshold in minutes (default: 5)
 * @returns Color code for status
 */
export function getFreshnessColor(binData: any, thresholdMinutes: number = 5): string {
  if (isDataFresh(binData, thresholdMinutes)) {
    return '#10b981'; // Green for fresh data
  } else {
    return '#6b7280'; // Grey for stale data
  }
}

/**
 * Format timestamp for display in different formats
 * @param timestamp - The timestamp to format
 * @param format - Display format ('short', 'long', 'relative')
 * @returns Formatted timestamp string
 */
export function formatTimestamp(timestamp: string | number | Date, format: 'short' | 'long' | 'relative' = 'relative'): string {
  if (!timestamp) return 'Unknown';

  const date = typeof timestamp === 'string' || typeof timestamp === 'number' 
    ? new Date(timestamp) 
    : timestamp;

  if (isNaN(date.getTime())) return 'Invalid date';

  switch (format) {
    case 'short':
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case 'long':
      return date.toLocaleString();
    case 'relative':
    default:
      return getTimeAgo(timestamp).text;
  }
}
