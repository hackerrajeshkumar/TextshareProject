/**
 * Calculate expiration timestamp based on expiration option
 * @param {string} expiration - Expiration option (24h, 7d, 30d, never)
 * @returns {number|null} - Expiration timestamp or null if never expires
 */
function calculateExpiry(expiration) {
  const now = Date.now();
  
  switch (expiration) {
    case '10m':
      return now + 10 * 60 * 1000; // 10 minutes
    case '24h':
      return now + 24 * 60 * 60 * 1000; // 24 hours
    case '7d':
      return now + 7 * 24 * 60 * 60 * 1000; // 7 days
    case '30d':
      return now + 30 * 24 * 60 * 60 * 1000; // 30 days
    case 'never':
    default:
      return null; // Never expires
  }
}

module.exports = {
  calculateExpiry
};
