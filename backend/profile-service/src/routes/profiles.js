const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/profiles');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.user.userId}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.query(
      `SELECT p.*, u.email, u.name as user_name, u.is_verified, u.created_at as user_created_at
       FROM user_profiles p
       RIGHT JOIN users u ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const profile = result.rows[0];

    res.json({
      success: true,
      data: {
        profile: {
          userId: profile.user_id || req.user.userId,
          email: profile.email,
          userName: profile.user_name,
          isVerified: profile.is_verified,
          userCreatedAt: profile.user_created_at,
          firstName: profile.first_name,
          lastName: profile.last_name,
          phone: profile.phone,
          organization: profile.organization,
          jobTitle: profile.job_title,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          avatarUrl: profile.avatar_url,
          timezone: profile.timezone,
          language: profile.language,
          notifications: profile.notification_preferences,
          privacy: profile.privacy_settings,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/me', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('organization').optional().trim().isLength({ max: 100 }).withMessage('Organization must be max 100 characters'),
  body('jobTitle').optional().trim().isLength({ max: 100 }).withMessage('Job title must be max 100 characters'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio must be max 500 characters'),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Location must be max 100 characters'),
  body('website').optional().isURL().withMessage('Invalid website URL'),
  body('timezone').optional().isString().withMessage('Invalid timezone'),
  body('language').optional().isString().withMessage('Invalid language'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      firstName, lastName, phone, organization, jobTitle,
      bio, location, website, timezone, language,
      notifications, privacy
    } = req.body;

    const db = getDB();

    // Check if profile exists
    const existingProfile = await db.query(
      'SELECT id FROM user_profiles WHERE user_id = $1',
      [req.user.userId]
    );

    let query, values;

    if (existingProfile.rows.length === 0) {
      // Create new profile
      query = `
        INSERT INTO user_profiles (
          id, user_id, first_name, last_name, phone, organization, job_title,
          bio, location, website, timezone, language, notification_preferences,
          privacy_settings, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `;
      values = [
        uuidv4(), req.user.userId, firstName, lastName, phone, organization, jobTitle,
        bio, location, website, timezone, language, JSON.stringify(notifications),
        JSON.stringify(privacy), new Date(), new Date()
      ];
    } else {
      // Update existing profile
      query = `
        UPDATE user_profiles SET
          first_name = COALESCE($2, first_name),
          last_name = COALESCE($3, last_name),
          phone = COALESCE($4, phone),
          organization = COALESCE($5, organization),
          job_title = COALESCE($6, job_title),
          bio = COALESCE($7, bio),
          location = COALESCE($8, location),
          website = COALESCE($9, website),
          timezone = COALESCE($10, timezone),
          language = COALESCE($11, language),
          notification_preferences = COALESCE($12, notification_preferences),
          privacy_settings = COALESCE($13, privacy_settings),
          updated_at = $14
        WHERE user_id = $1
        RETURNING *
      `;
      values = [
        req.user.userId, firstName, lastName, phone, organization, jobTitle,
        bio, location, website, timezone, language, JSON.stringify(notifications),
        JSON.stringify(privacy), new Date()
      ];
    }

    const result = await db.query(query, values);
    const profile = result.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: {
          userId: profile.user_id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          phone: profile.phone,
          organization: profile.organization,
          jobTitle: profile.job_title,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          avatarUrl: profile.avatar_url,
          timezone: profile.timezone,
          language: profile.language,
          notifications: profile.notification_preferences,
          privacy: profile.privacy_settings,
          updatedAt: profile.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
