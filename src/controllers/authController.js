const jwt = require('jsonwebtoken');
const User = require('../models/User');
const otpService = require('../services/otpService');
require('dotenv').config();

class AuthController {
  // Send OTP for phone verification
  async sendOTP(req, res) {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      // Validate phone number format (basic validation)
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }

      const result = await otpService.sendOTP(phone);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'OTP sent successfully',
          requestId: result.requestId
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Error in sendOTP:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Verify OTP and login/register user
  async verifyOTP(req, res) {
    try {
      const { phone, otp, userData = {} } = req.body;
      
      if (!phone || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and OTP are required'
        });
      }

      // Verify OTP
      const otpResult = await otpService.verifyOTP(phone, otp);
      
      if (!otpResult.success) {
        return res.status(400).json({
          success: false,
          message: otpResult.message
        });
      }

      // Check if user exists
      let user = await User.findByPhone(phone);
      
      if (!user) {
        // Create new user
        user = new User({
          phone,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          dateOfBirth: userData.dateOfBirth,
          gender: userData.gender,
          profilePicture: userData.profilePicture
        });
        
        await user.save();
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          phone: user.phone,
          userId: user.phone // Using phone as userId for simplicity
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        token,
        user: user.toJSON(),
        isNewUser: !user.createdAt || (new Date() - user.createdAt) < 60000 // Less than 1 minute old
      });
    } catch (error) {
      console.error('Error in verifyOTP:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Resend OTP
  async resendOTP(req, res) {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      const result = await otpService.resendOTP(phone);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'OTP resent successfully',
          requestId: result.requestId
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Error in resendOTP:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const user = await User.findByPhone(req.user.phone);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        user: user.toJSON()
      });
    } catch (error) {
      console.error('Error in getProfile:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { firstName, lastName, email, dateOfBirth, gender, profilePicture } = req.body;
      
      const user = await User.findByPhone(req.user.phone);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user data
      await user.update({
        firstName,
        lastName,
        email,
        dateOfBirth,
        gender,
        profilePicture
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: user.toJSON()
      });
    } catch (error) {
      console.error('Error in updateProfile:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Logout (client-side token removal, but we can track logout server-side if needed)
  async logout(req, res) {
    try {
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Error in logout:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new AuthController();