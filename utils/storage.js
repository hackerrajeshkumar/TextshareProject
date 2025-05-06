const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Path to the data directory
const dataDir = path.join(__dirname, '..', 'data');

/**
 * Save text data to a JSON file
 * @param {string} id - Unique identifier for the text
 * @param {object} data - Text data to save
 * @returns {Promise<boolean>} - Success status
 */
async function saveText(id, data) {
  try {
    // Ensure data directory exists
    await fs.mkdir(dataDir, { recursive: true });
    
    // Add creation timestamp and prepare data
    const textData = {
      ...data,
      createdAt: Date.now(),
    };
    
    // Encrypt content if password is provided
    if (data.password) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(data.password, salt, 1000, 64, 'sha512').toString('hex');
      
      // Store hash and salt instead of plain password
      textData.password = undefined;
      textData.passwordHash = hash;
      textData.passwordSalt = salt;
      textData.isProtected = true;
    }
    
    // Write data to file
    const filePath = path.join(dataDir, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(textData), 'utf8');
    
    return true;
  } catch (error) {
    console.error('Error saving text:', error);
    return false;
  }
}

/**
 * Get text data from a JSON file
 * @param {string} id - Unique identifier for the text
 * @returns {Promise<object|null>} - Text data or null if not found
 */
async function getText(id) {
  try {
    const filePath = path.join(dataDir, `${id}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    const textData = JSON.parse(data);
    
    // Check if text has expired
    if (textData.expiresAt && Date.now() > textData.expiresAt) {
      // Delete expired text
      await deleteText(id);
      return null;
    }
    
    return textData;
  } catch (error) {
    // File not found or other error
    return null;
  }
}

/**
 * Verify password for protected text
 * @param {string} id - Unique identifier for the text
 * @param {string} password - Password to verify
 * @returns {Promise<boolean>} - Success status
 */
async function verifyPassword(id, password) {
  try {
    const textData = await getText(id);
    
    if (!textData || !textData.isProtected) {
      return false;
    }
    
    const hash = crypto.pbkdf2Sync(
      password, 
      textData.passwordSalt, 
      1000, 
      64, 
      'sha512'
    ).toString('hex');
    
    return hash === textData.passwordHash;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Delete text data
 * @param {string} id - Unique identifier for the text
 * @returns {Promise<boolean>} - Success status
 */
async function deleteText(id) {
  try {
    const filePath = path.join(dataDir, `${id}.json`);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting text:', error);
    return false;
  }
}

module.exports = {
  saveText,
  getText,
  verifyPassword,
  deleteText
};
