const axios = require('axios');
require('dotenv').config();

class OTPService {
  constructor() {
    this.apiKey = process.env.MSG91_API_KEY;
    this.authKey = process.env.MSG91_AUTH_KEY;
    this.templateId = process.env.MSG91_TEMPLATE_ID;
    this.baseURL = 'https://api.msg91.com/api/v5';
    this.otpExpiryMinutes = process.env.OTP_EXPIRY_MINUTES || 10;
    this.maxAttempts = process.env.MAX_OTP_ATTEMPTS || 3;
    
    // In-memory storage for OTP data (use Redis in production)
    this.otpStorage = new Map();
  }

  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(phone, otp = null) {
    try {
      const generatedOTP = otp || this.generateOTP();
      
      // Store OTP data
      this.otpStorage.set(phone, {
        otp: generatedOTP,
        attempts: 0,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000)
      });

      // MSG91 API call to send OTP
      const response = await axios.post(`${this.baseURL}/otp`, {
        template_id: this.templateId,
        mobile: phone,
        authkey: this.authKey,
        otp: generatedOTP,
        otp_expiry: this.otpExpiryMinutes
      }, {
        headers: {
          'Content-Type': 'application/json',
          'authkey': this.authKey
        }
      });

      if (response.data.type === 'success') {
        console.log(`OTP sent successfully to ${phone}`);
        return {
          success: true,
          message: 'OTP sent successfully',
          requestId: response.data.request_id
        };
      } else {
        throw new Error(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error.message);
      
      // For development/testing without actual MSG91 account
      if (process.env.NODE_ENV === 'development') {
        console.log(`Development mode: OTP for ${phone} is ${this.otpStorage.get(phone)?.otp}`);
        return {
          success: true,
          message: 'OTP sent successfully (development mode)',
          requestId: 'dev_request_id'
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP'
      };
    }
  }

  async verifyOTP(phone, userOTP) {
    try {
      const otpData = this.otpStorage.get(phone);
      
      if (!otpData) {
        return {
          success: false,
          message: 'OTP not found or expired'
        };
      }

      // Check if OTP has expired
      if (new Date() > otpData.expiresAt) {
        this.otpStorage.delete(phone);
        return {
          success: false,
          message: 'OTP has expired'
        };
      }

      // Check attempts limit
      if (otpData.attempts >= this.maxAttempts) {
        this.otpStorage.delete(phone);
        return {
          success: false,
          message: 'Maximum verification attempts exceeded'
        };
      }

      // Increment attempts
      otpData.attempts++;
      this.otpStorage.set(phone, otpData);

      // Verify OTP using MSG91 API
      const response = await axios.post(`${this.baseURL}/otp/verify`, {
        mobile: phone,
        otp: userOTP,
        authkey: this.authKey
      }, {
        headers: {
          'Content-Type': 'application/json',
          'authkey': this.authKey
        }
      });

      if (response.data.type === 'success') {
        // Remove OTP data after successful verification
        this.otpStorage.delete(phone);
        return {
          success: true,
          message: 'OTP verified successfully'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Invalid OTP'
        };
      }
    } catch (error) {
      console.error('Error verifying OTP:', error.message);
      
      // For development/testing without actual MSG91 account
      if (process.env.NODE_ENV === 'development') {
        const otpData = this.otpStorage.get(phone);
        if (otpData && otpData.otp === userOTP) {
          this.otpStorage.delete(phone);
          return {
            success: true,
            message: 'OTP verified successfully (development mode)'
          };
        }
        return {
          success: false,
          message: 'Invalid OTP (development mode)'
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'OTP verification failed'
      };
    }
  }

  async resendOTP(phone) {
    try {
      const otpData = this.otpStorage.get(phone);
      
      // Check if we can resend (not too frequent)
      if (otpData && (new Date() - otpData.createdAt) < 30000) { // 30 seconds
        return {
          success: false,
          message: 'Please wait 30 seconds before requesting new OTP'
        };
      }

      // Generate new OTP and send
      return await this.sendOTP(phone);
    } catch (error) {
      console.error('Error resending OTP:', error.message);
      return {
        success: false,
        message: 'Failed to resend OTP'
      };
    }
  }

  // Cleanup expired OTPs (should be called periodically)
  cleanupExpiredOTPs() {
    const now = new Date();
    for (const [phone, otpData] of this.otpStorage.entries()) {
      if (now > otpData.expiresAt) {
        this.otpStorage.delete(phone);
      }
    }
  }
}

module.exports = new OTPService();