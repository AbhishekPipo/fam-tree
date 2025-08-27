const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const janusGraph = require('../config/database');
const router = express.Router();

// Helper function to generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Register endpoint
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Creates a new user account in the family tree system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ 
                error: 'Email, password, and name are required' 
            });
        }

        const g = janusGraph.getTraversal();

        // Check if user already exists
        const existingUser = await g.V()
            .has('User', 'email', email)
            .toList();

        if (existingUser.length > 0) {
            return res.status(400).json({ 
                error: 'User with this email already exists' 
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user vertex in JanusGraph
        const user = await g.addV('User')
            .property('email', email)
            .property('password', hashedPassword)
            .property('name', name)
            .property('phone', phone || '')
            .property('createdAt', new Date().toISOString())
            .next();

        const userId = user.value.id;

        // Generate JWT token
        const token = generateToken(userId);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: userId,
                email,
                name,
                phone: phone || ''
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Internal server error during registration' 
        });
    }
});

// Login endpoint
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     description: Authenticates a user and returns a JWT token. Optionally supports OTP verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid credentials or OTP
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
router.post('/login', async (req, res) => {
    try {
        const { email, password, otp } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        const g = janusGraph.getTraversal();

        // Find user by email
        const userVertex = await g.V()
            .has('User', 'email', email)
            .toList();

        if (userVertex.length === 0) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        const user = userVertex[0];
        const userId = user.id;
        
        // Get user properties
        const userProps = await g.V(userId).valueMap().next();
        const userData = userProps.value;

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, userData.password[0]);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Verify static OTP if provided
        if (otp) {
            const staticOTP = process.env.STATIC_OTP || '123456';
            if (otp !== staticOTP) {
                return res.status(401).json({ 
                    error: 'Invalid OTP' 
                });
            }
        }

        // Generate JWT token
        const token = generateToken(userId);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: userId,
                email: userData.email[0],
                name: userData.name[0],
                phone: userData.phone ? userData.phone[0] : ''
            }
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
            user: {
                id: userId,
                email: userData.email[0],
                name: userData.name[0],
                phone: userData.phone ? userData.phone[0] : '',
                createdAt: userData.createdAt[0]
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