const { nanoid } = require('nanoid');
const fs = require('fs').promises;
const path = require('path');

// Path to the data directory
const dataDir = path.join(__dirname, '..', 'data');

/**
 * Generate a unique code for text sharing
 * @param {number} length - Length of the code (default: 4)
 * @returns {Promise<string>} - Unique code
 */
async function generateUniqueCode(length = 4) {
  // Generate a code using nanoid
  const code = nanoid(length);
  
  try {
    // Check if code already exists
    const filePath = path.join(dataDir, `${code}.json`);
    await fs.access(filePath);
    
    // If file exists, generate a new code recursively
    return generateUniqueCode(length);
  } catch (error) {
    // File doesn't exist, code is unique
    return code;
  }
}

module.exports = {
  generateUniqueCode
};
