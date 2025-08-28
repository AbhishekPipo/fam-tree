const jwt = require('jsonwebtoken');
const { hasPermission, PERMISSIONS } = require('../config/permissions');

/**
 * RBAC Middleware - Role-Based Access Control
 * Checks if user has permission to access specific module/sub-module/action
 */

/**
 * Create RBAC middleware for specific module, sub-module, and permission
 * @param {string} module - Module name (e.g., 'family', 'events')
 * @param {string} subModule - Sub-module name (e.g., 'tree', 'members')
 * @param {string} permission - Required permission (e.g., 'create', 'read')
 * @returns {Function} - Express middleware function
 */
const requirePermission = (module, subModule, permission) => {
    return (req, res, next) => {
        try {
            // Get token from Authorization header
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

            if (!token) {
                return res.status(401).json({
                    error: 'Access token required',
                    message: 'Please provide a valid JWT token in the Authorization header'
                });
            }

            // Verify and decode token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check if token is access token (not refresh token)
            if (decoded.type && decoded.type !== 'access') {
                return res.status(401).json({
                    error: 'Invalid token type',
                    message: 'Please use access token for API requests'
                });
            }

            const userRole = decoded.role || 'user'; // Default to 'user' if no role specified
            const userId = decoded.userId;

            // Check if user has required permission
            if (!hasPermission(userRole, module, subModule, permission)) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    message: `Access denied. Required permission: ${permission} on ${module}/${subModule}`,
                    userRole: userRole,
                    requiredPermission: {
                        module,
                        subModule,
                        permission
                    }
                });
            }

            // Add user info to request object
            req.user = {
                id: userId,
                role: userRole,
                permissions: {
                    module,
                    subModule,
                    permission
                }
            };

            next();
        } catch (error) {
            console.error('RBAC middleware error:', error);
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token expired',
                    message: 'Your session has expired. Please log in again.'
                });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    error: 'Invalid token',
                    message: 'The provided token is invalid'
                });
            } else {
                return res.status(500).json({
                    error: 'Authorization error',
                    message: 'Unable to verify permissions'
                });
            }
        }
    };
};

/**
 * Middleware to check multiple permissions (OR logic)
 * User needs at least one of the specified permissions
 * @param {Array} permissionSets - Array of {module, subModule, permission} objects
 * @returns {Function} - Express middleware function
 */
const requireAnyPermission = (permissionSets) => {
    return (req, res, next) => {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (!token) {
                return res.status(401).json({
                    error: 'Access token required',
                    message: 'Please provide a valid JWT token in the Authorization header'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (decoded.type && decoded.type !== 'access') {
                return res.status(401).json({
                    error: 'Invalid token type',
                    message: 'Please use access token for API requests'
                });
            }

            const userRole = decoded.role || 'user';
            const userId = decoded.userId;

            // Check if user has any of the required permissions
            const hasAnyPermission = permissionSets.some(({ module, subModule, permission }) => 
                hasPermission(userRole, module, subModule, permission)
            );

            if (!hasAnyPermission) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    message: 'Access denied. You need at least one of the required permissions.',
                    userRole: userRole,
                    requiredPermissions: permissionSets
                });
            }

            req.user = {
                id: userId,
                role: userRole,
                permissions: permissionSets
            };

            next();
        } catch (error) {
            console.error('RBAC middleware error:', error);
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token expired',
                    message: 'Your session has expired. Please log in again.'
                });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    error: 'Invalid token',
                    message: 'The provided token is invalid'
                });
            } else {
                return res.status(500).json({
                    error: 'Authorization error',
                    message: 'Unable to verify permissions'
                });
            }
        }
    };
};

/**
 * Middleware to check if user has specific role
 * @param {string|Array} roles - Role name or array of role names
 * @returns {Function} - Express middleware function
 */
const requireRole = (roles) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    return (req, res, next) => {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (!token) {
                return res.status(401).json({
                    error: 'Access token required',
                    message: 'Please provide a valid JWT token in the Authorization header'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (decoded.type && decoded.type !== 'access') {
                return res.status(401).json({
                    error: 'Invalid token type',
                    message: 'Please use access token for API requests'
                });
            }

            const userRole = decoded.role || 'user';
            const userId = decoded.userId;

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    error: 'Insufficient role',
                    message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
                    userRole: userRole,
                    requiredRoles: allowedRoles
                });
            }

            req.user = {
                id: userId,
                role: userRole
            };

            next();
        } catch (error) {
            console.error('Role middleware error:', error);
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token expired',
                    message: 'Your session has expired. Please log in again.'
                });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    error: 'Invalid token',
                    message: 'The provided token is invalid'
                });
            } else {
                return res.status(500).json({
                    error: 'Authorization error',
                    message: 'Unable to verify role'
                });
            }
        }
    };
};

// Helper functions to create common permission middlewares
const canCreate = (module, subModule) => requirePermission(module, subModule, PERMISSIONS.CREATE);
const canRead = (module, subModule) => requirePermission(module, subModule, PERMISSIONS.READ);
const canUpdate = (module, subModule) => requirePermission(module, subModule, PERMISSIONS.UPDATE);
const canDelete = (module, subModule) => requirePermission(module, subModule, PERMISSIONS.DELETE);
const canManage = (module, subModule) => requirePermission(module, subModule, PERMISSIONS.MANAGE);

module.exports = {
    requirePermission,
    requireAnyPermission,
    requireRole,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canManage
};