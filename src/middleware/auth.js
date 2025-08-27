const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next function
 * @returns {void}
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            error: 'Access token required',
            message: 'Please provide a valid JWT token in the Authorization header'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    error: 'Token expired',
                    message: 'Your session has expired. Please log in again.'
                });
            } else if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({ 
                    error: 'Invalid token',
                    message: 'The provided token is invalid'
                });
            } else {
                return res.status(401).json({ 
                    error: 'Token verification failed',
                    message: 'Unable to verify the provided token'
                });
            }
        }

        req.user = user;
        next();
    });
};

module.exports = {
    authenticateToken
};
