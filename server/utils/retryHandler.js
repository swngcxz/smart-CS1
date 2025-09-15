// Function to handle retries with exponential backoff
const withRetry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    if (error.code === 8 || error.message.includes('Quota exceeded')) {
      console.warn(`Quota exceeded or similar error. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    } else {
      throw error;
    }
  }
};

module.exports = withRetry;
