const express = require('express');
const router = express.Router();
const { saveText, getText, verifyPassword, deleteText } = require('../utils/storage');
const { generateUniqueCode } = require('../utils/codeGenerator');
const { calculateExpiry } = require('../utils/expiry');

/**
 * Create a new text snippet
 * POST /api/text
 */
router.post('/text', async (req, res) => {
  try {
    const { text, password, expiration = 'never', syntax = 'plain' } = req.body;

    // Validate input
    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Text content is required'
      });
    }

    // Generate unique code
    const id = await generateUniqueCode();

    // Calculate expiration timestamp
    const expiresAt = calculateExpiry(expiration);

    // Prepare data to save
    const now = Date.now();
    const textData = {
      text,
      syntax,
      expiresAt,
      password: password || undefined,
      lastActivity: now,
      // If expiration is 10m, set expiresAt to 10 minutes from now
      expiresAt: expiration === '10m' ? now + 10 * 60 * 1000 : expiresAt
    };

    // Save text data
    const success = await saveText(id, textData);

    if (success) {
      res.status(201).json({
        success: true,
        id,
        expiresAt,
        isProtected: !!password
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to save text'
      });
    }
  } catch (error) {
    console.error('Error creating text:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong'
    });
  }
});

/**
 * Get a text snippet by ID
 * GET /api/text/:id
 */
router.get('/text/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.query;

    // Get text data
    const textData = await getText(id);

    if (!textData) {
      return res.status(404).json({
        success: false,
        message: 'Text not found or expired'
      });
    }

    // Check if text is password protected
    if (textData.isProtected) {
      // If no password provided
      if (!password) {
        return res.status(403).json({
          success: false,
          message: 'Password required',
          isProtected: true
        });
      }

      // Verify password
      const isValid = await verifyPassword(id, password);

      if (!isValid) {
        return res.status(403).json({
          success: false,
          message: 'Invalid password',
          isProtected: true
        });
      }
    }

    // Return text data without sensitive information
    const { text, syntax, expiresAt, createdAt, lastActivity } = textData;

    res.json({
      success: true,
      text,
      syntax,
      expiresAt,
      createdAt,
      lastActivity,
      isProtected: textData.isProtected || false
    });
  } catch (error) {
    console.error('Error getting text:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong'
    });
  }
});

/**
 * Delete a text snippet
 * DELETE /api/text/:id
 */
router.delete('/text/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Get text data
    const textData = await getText(id);

    if (!textData) {
      return res.status(404).json({
        success: false,
        message: 'Text not found or expired'
      });
    }

    // Check if text is password protected
    if (textData.isProtected) {
      // Verify password
      const isValid = await verifyPassword(id, password);

      if (!isValid) {
        return res.status(403).json({
          success: false,
          message: 'Invalid password'
        });
      }
    }

    // Delete text
    const success = await deleteText(id);

    if (success) {
      res.json({
        success: true,
        message: 'Text deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete text'
      });
    }
  } catch (error) {
    console.error('Error deleting text:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong'
    });
  }
});

module.exports = router;
