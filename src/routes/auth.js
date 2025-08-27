const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const janusGraph = require('../../config/database');
const router = express.Router();

// Helper function to generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Helper function to validate phone number (basic validation)
const validatePhoneNumber = (phone) => {
    // Basic phone number validation (can be enhanced later)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Send OTP endpoint (Static OTP for now)
/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: Send OTP to phone number
 *     description: Sends a static OTP for phone verification (development mode)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number in international format
 *                 example: "+1234567890"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP sent successfully"
 *                 otp:
 *                   type: string
 *                   description: "Static OTP for development (remove in production)"
 *                   example: "123456"
 *       400:
 *         description: Invalid phone number
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/send-otp', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ 
                error: 'Phone number is required' 
            });
        }

        if (!validatePhoneNumber(phoneNumber)) {
            return res.status(400).json({ 
                error: 'Invalid phone number format' 
            });
        }

        // For now, return static OTP
        const staticOTP = process.env.STATIC_OTP || '123456';

        res.json({
            success: true,
            message: 'OTP sent successfully',
            // TODO: Remove this in production - only for development
            otp: staticOTP,
            expiresIn: 300 // 5 minutes
        });

    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ 
            error: 'Failed to send OTP' 
        });
    }
});

// Verify OTP and login/register endpoint
/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: Verify OTP and authenticate user
 *     description: Verifies OTP and either logs in existing user or initiates registration for new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - otp
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number used to send OTP
 *                 example: "+1234567890"
 *               otp:
 *                 type: string
 *                 description: 6-digit OTP code
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 action:
 *                   type: string
 *                   enum: [login, register]
 *                   description: Whether user should login or register
 *                 token:
 *                   type: string
 *                   description: JWT token (for existing users)
 *                 tempToken:
 *                   type: string
 *                   description: Temporary token for registration (new users)
 *                 user:
 *                   type: object
 *                   description: User details (for existing users)
 *       400:
 *         description: Invalid OTP or phone number
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/verify-otp', async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({ 
                error: 'Phone number and OTP are required' 
            });
        }

        if (!validatePhoneNumber(phoneNumber)) {
            return res.status(400).json({ 
                error: 'Invalid phone number format' 
            });
        }

        // Verify static OTP
        const staticOTP = process.env.STATIC_OTP || '123456';
        if (otp !== staticOTP) {
            return res.status(400).json({ 
                error: 'Invalid OTP' 
            });
        }

        const g = janusGraph.getTraversal();

        // Check if user exists
        const existingUser = await g.V()
            .has('User', 'phoneNumber', phoneNumber)
            .toList();

        if (existingUser.length > 0) {
            // Existing user - login
            const user = existingUser[0];
            const userId = user.id;
            
            // Get user properties
            const userProps = await g.V(userId).valueMap().next();
            const userData = userProps.value;

            const token = generateToken(userId);

            res.json({
                success: true,
                action: 'login',
                message: 'Login successful',
                token,
                user: {
                    id: userId,
                    phoneNumber: userData.phoneNumber[0],
                    firstName: userData.firstName ? userData.firstName[0] : '',
                    lastName: userData.lastName ? userData.lastName[0] : '',
                    email: userData.email ? userData.email[0] : ''
                }
            });
        } else {
            // New user - needs registration
            const tempToken = jwt.sign(
                { phoneNumber, verified: true },
                process.env.JWT_SECRET,
                { expiresIn: '10m' }
            );

            res.json({
                success: true,
                action: 'register',
                message: 'Phone verified. Please complete registration.',
                tempToken
            });
        }

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ 
            error: 'Failed to verify OTP' 
        });
    }
});

// Register endpoint (Updated for phone + OTP)
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Complete user registration
 *     description: Completes user registration after phone verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tempToken
 *               - firstName
 *               - lastName
 *             properties:
 *               tempToken:
 *                 type: string
 *                 description: Temporary token from OTP verification
 *               firstName:
 *                 type: string
 *                 description: User's first name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Optional email address
 *                 example: "john.doe@example.com"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request - missing required fields or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid or expired temp token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', async (req, res) => {
    try {
        const { tempToken, firstName, lastName, email } = req.body;

        if (!tempToken || !firstName || !lastName) {
            return res.status(400).json({ 
                error: 'Temporary token, first name, and last name are required' 
            });
        }

        // Verify temp token
        let decoded;
        try {
            decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ 
                error: 'Invalid or expired verification token' 
            });
        }

        if (!decoded.verified) {
            return res.status(401).json({ 
                error: 'Phone not verified' 
            });
        }

        const phoneNumber = decoded.phoneNumber;
        const g = janusGraph.getTraversal();

        // Check if user already exists
        const existingUser = await g.V()
            .has('User', 'phoneNumber', phoneNumber)
            .toList();

        if (existingUser.length > 0) {
            return res.status(400).json({ 
                error: 'User with this phone number already exists' 
            });
        }

        // Create user vertex in JanusGraph
        const user = await g.addV('User')
            .property('phoneNumber', phoneNumber)
            .property('firstName', firstName)
            .property('lastName', lastName)
            .property('email', email || '')
            .property('isVerified', true)
            .property('isActive', true)
            .property('createdAt', new Date().toISOString())
            .property('updatedAt', new Date().toISOString())
            .next();

        const userId = user.value.id;

        // Generate JWT token
        const token = generateToken(userId);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: userId,
                phoneNumber,
                firstName,
                lastName,
                email: email || ''
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Internal server error during registration' 
        });
    }
});

// Simple login endpoint (triggers OTP)
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Initiate login process
 *     description: Initiates login by sending OTP to registered phone number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Registered phone number
 *                 example: "+1234567890"
 *     responses:
 *       200:
 *         description: OTP sent for login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP sent for login verification"
 *                 otp:
 *                   type: string
 *                   description: "Static OTP for development"
 *                   example: "123456"
 *       404:
 *         description: Phone number not registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ 
                error: 'Phone number is required' 
            });
        }

        if (!validatePhoneNumber(phoneNumber)) {
            return res.status(400).json({ 
                error: 'Invalid phone number format' 
            });
        }

        const g = janusGraph.getTraversal();

        // Check if user exists
        const existingUser = await g.V()
            .has('User', 'phoneNumber', phoneNumber)
            .toList();

        if (existingUser.length === 0) {
            return res.status(404).json({ 
                error: 'No account found with this phone number. Please register first.' 
            });
        }

        // For now, return static OTP
        const staticOTP = process.env.STATIC_OTP || '123456';

        res.json({
            success: true,
            message: 'OTP sent for login verification',
            // TODO: Remove this in production - only for development
            otp: staticOTP,
            expiresIn: 300 // 5 minutes
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Internal server error during login' 
        });
    }
});

// Get user profile endpoint (protected)
/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     tags: [Authentication]
 *     summary: Get user profile
 *     description: Retrieves the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const g = janusGraph.getTraversal();
        
        // Get user data
        const userProps = await g.V(userId).valueMap().next();
        
        if (!userProps.value) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userProps.value;

        res.json({
            success: true,
            user: {
                id: userId,
                phoneNumber: userData.phoneNumber ? userData.phoneNumber[0] : '',
                firstName: userData.firstName ? userData.firstName[0] : '',
                lastName: userData.lastName ? userData.lastName[0] : '',
                email: userData.email ? userData.email[0] : '',
                isVerified: userData.isVerified ? userData.isVerified[0] : false,
                isActive: userData.isActive ? userData.isActive[0] : false,
                createdAt: userData.createdAt ? userData.createdAt[0] : ''
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;