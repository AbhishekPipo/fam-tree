# RBAC Implementation Guide

## Overview

This document explains the Role-Based Access Control (RBAC) system implemented in the Family Tree application. The system follows a simple **Module > Sub-Module > Permissions** structure.

## Architecture

### 1. **Permissions Structure**
```
Module (e.g., 'family')
  └── Sub-Module (e.g., 'tree', 'members')
      └── Permissions (e.g., 'create', 'read', 'update', 'delete')
```

### 2. **Available Roles**
- **super_admin**: Full system access
- **admin**: Administrative access (limited super admin features)
- **moderator**: Content moderation access
- **user**: Standard user access (default)
- **guest**: Limited read-only access

### 3. **Available Modules**
- **family**: Family tree and relationship management
- **events**: Event management
- **posts**: Social feed and posts
- **media**: Photo and document management
- **admin**: System administration

## Implementation

### 1. **JWT Token Structure**
```json
{
  "userId": "user-id",
  "role": "user",
  "type": "access",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### 2. **Using RBAC Middleware**

#### Basic Permission Check
```javascript
const { canRead, canCreate, canUpdate, canDelete } = require('../middleware/rbac');

// Check if user can read family tree
router.get('/tree', canRead('family', 'tree'), FamilyController.getFamilyTree);

// Check if user can create family members
router.post('/member', canCreate('family', 'members'), FamilyController.addFamilyMember);

// Check if user can update family members
router.put('/member/:id', canUpdate('family', 'members'), FamilyController.updateFamilyMember);

// Check if user can delete family members
router.delete('/member/:id', canDelete('family', 'members'), FamilyController.removeFamilyMember);
```

#### Role-Based Access
```javascript
const { requireRole } = require('../middleware/rbac');

// Only admins and super_admins can access
router.post('/bulk-add', requireRole(['admin', 'super_admin']), FamilyController.bulkAddMembers);

// Only super_admin can access
router.delete('/system/reset', requireRole('super_admin'), SystemController.resetSystem);
```

#### Multiple Permission Check (OR Logic)
```javascript
const { requireAnyPermission } = require('../middleware/rbac');

// User needs either 'read' on family/tree OR 'read' on family/members
router.get('/dashboard', requireAnyPermission([
  { module: 'family', subModule: 'tree', permission: 'read' },
  { module: 'family', subModule: 'members', permission: 'read' }
]), DashboardController.getDashboard);
```

### 3. **Custom Permission Check**
```javascript
const { requirePermission } = require('../middleware/rbac');

// Custom permission check
router.get('/special-endpoint', 
  requirePermission('family', 'tree', 'read'), 
  SpecialController.getSpecialData
);
```

## Permission Matrix

### User Role Permissions
| Module | Sub-Module | User | Moderator | Admin | Super Admin |
|--------|------------|------|-----------|-------|-------------|
| family | tree | CRU | RU | CRUD | MANAGE |
| family | members | CRU | RU | CRUD | MANAGE |
| family | relationships | CRU | RU | CRUD | MANAGE |
| events | personal | CRUD | R | RU | MANAGE |
| events | family | CRU | RU | CRUD | MANAGE |
| events | public | R | RUD | CRUD | MANAGE |
| posts | feed | CRU | RUD | CRUD | MANAGE |
| posts | comments | CRU | RUD | CRUD | MANAGE |
| media | photos | CRU | RUD | CRUD | MANAGE |
| media | documents | CRU | RU | CRUD | MANAGE |
| admin | users | - | - | RU | MANAGE |
| admin | system | - | - | R | MANAGE |

**Legend:**
- C = Create
- R = Read  
- U = Update
- D = Delete
- MANAGE = Full access (includes all CRUD operations)

## Authentication Flow

### 1. **Login Process**
```
1. User sends phone number → GET OTP
2. User verifies OTP → GET access + refresh tokens
3. Tokens include user role information
4. Use access token for API requests
```

### 2. **Token Types**
- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to get new access tokens

### 3. **Token Refresh**
```javascript
POST /api/auth/refresh-token
{
  "refreshToken": "your-refresh-token"
}

// Response
{
  "success": true,
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token"
}
```

## Error Responses

### 1. **Authentication Errors**
```json
{
  "error": "Access token required",
  "message": "Please provide a valid JWT token in the Authorization header"
}
```

### 2. **Authorization Errors**
```json
{
  "error": "Insufficient permissions",
  "message": "Access denied. Required permission: create on family/members",
  "userRole": "guest",
  "requiredPermission": {
    "module": "family",
    "subModule": "members", 
    "permission": "create"
  }
}
```

### 3. **Role Errors**
```json
{
  "error": "Insufficient role",
  "message": "Access denied. Required role: admin or super_admin",
  "userRole": "user",
  "requiredRoles": ["admin", "super_admin"]
}
```

## Environment Configuration

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OTP Configuration (Development)
STATIC_OTP=123456
NODE_ENV=development
```

## Usage Examples

### 1. **Frontend Implementation**
```javascript
// Store tokens after login
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);

// Use access token for API calls
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json'
};

// Handle 401 errors by refreshing token
if (response.status === 401) {
  const refreshResponse = await fetch('/api/auth/refresh-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      refreshToken: localStorage.getItem('refreshToken') 
    })
  });
  
  if (refreshResponse.ok) {
    const tokens = await refreshResponse.json();
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    // Retry original request
  }
}
```

### 2. **Role Management (Admin)**
```javascript
// Get available roles
GET /api/auth/roles
Authorization: Bearer <admin-access-token>

// Update user role
PUT /api/auth/update-role
Authorization: Bearer <admin-access-token>
{
  "userId": "user-id-to-update",
  "newRole": "moderator"
}
```

## Security Features

1. **Token Expiry**: Short-lived access tokens (15 minutes)
2. **Refresh Token Rotation**: New refresh token issued on each refresh
3. **Role Validation**: Server-side role verification on each request
4. **Permission Granularity**: Fine-grained permission control
5. **Account Status Check**: Validates user is active before token refresh
6. **Self-Protection**: Super admins cannot demote themselves

## Future Enhancements

1. **MSG91 SMS Integration**: Replace static OTP with real SMS service
2. **Permission Caching**: Cache user permissions for better performance
3. **Audit Logging**: Track all permission-based actions
4. **Dynamic Permissions**: Allow runtime permission modifications
5. **Resource-Level Permissions**: Permissions based on specific resources (e.g., own family tree vs others)

## Testing

### 1. **Test Different Roles**
```bash
# Register as user (default role)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"tempToken":"...","firstName":"John","lastName":"Doe"}'

# Try accessing admin endpoint (should fail)
curl -X GET http://localhost:3000/api/auth/roles \
  -H "Authorization: Bearer <user-access-token>"

# Update user to admin role (requires super_admin)
curl -X PUT http://localhost:3000/api/auth/update-role \
  -H "Authorization: Bearer <super-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-id","newRole":"admin"}'
```

### 2. **Test Permission Endpoints**
```bash
# Test family tree access (requires 'read' on family/tree)
curl -X GET http://localhost:3000/api/family/tree \
  -H "Authorization: Bearer <access-token>"

# Test family member creation (requires 'create' on family/members)
curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Doe","gender":"female"}'
```

This RBAC system provides a flexible, scalable approach to managing user permissions in your family tree application while maintaining security and ease of use.