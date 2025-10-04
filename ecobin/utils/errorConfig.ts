// Error configuration to control how errors are displayed
export const ERROR_CONFIG = {
  // Show technical error popups (set to false for production)
  SHOW_TECHNICAL_ERRORS: false,
  
  // Show error popups in development mode
  SHOW_ERRORS_IN_DEV: true,
  
  // Maximum error message length for user display
  MAX_ERROR_MESSAGE_LENGTH: 200,
  
  // Error types that should be shown as popups
  POPUP_ERROR_TYPES: [
    'NETWORK_ERROR',
    'SERVER_ERROR',
    'AUTHENTICATION_ERROR'
  ],
  
  // Error types that should only be logged
  LOG_ONLY_ERROR_TYPES: [
    'VALIDATION_ERROR',
    'CLIENT_ERROR'
  ]
};

// Helper function to determine if error should show popup
export const shouldShowErrorPopup = (error: any): boolean => {
  // Don't show popups in production unless it's a critical error
  if (process.env.NODE_ENV === 'production' && !ERROR_CONFIG.SHOW_TECHNICAL_ERRORS) {
    return false;
  }
  
  // Don't show popups if disabled
  if (!ERROR_CONFIG.SHOW_ERRORS_IN_DEV) {
    return false;
  }
  
  // Check if it's a critical error that needs user attention
  const status = error.response?.status;
  if (status >= 500) {
    return true; // Server errors
  }
  
  if (status === 401 || status === 403) {
    return false; // Auth errors should be handled by components
  }
  
  return false; // Default to not showing popups
};

// Helper function to sanitize error messages for user display
export const sanitizeErrorMessage = (error: any): string => {
  let message = error.message || 'An error occurred';
  
  // Limit message length
  if (message.length > ERROR_CONFIG.MAX_ERROR_MESSAGE_LENGTH) {
    message = message.substring(0, ERROR_CONFIG.MAX_ERROR_MESSAGE_LENGTH) + '...';
  }
  
  // Remove technical details
  message = message.replace(/Error: /g, '');
  message = message.replace(/Request failed with status code \d+/g, '');
  message = message.replace(/Network Error/g, 'Connection problem');
  
  return message.trim();
};
