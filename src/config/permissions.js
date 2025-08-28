/**
 * RBAC Configuration - Module > Sub-Module > Permissions
 * Simple role-based access control system
 */

// Define available permissions
const PERMISSIONS = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    MANAGE: 'manage', // Full access
    VIEW: 'view',
    EDIT: 'edit'
};

// Define modules and sub-modules with their permissions
const MODULES = {
    FAMILY: {
        name: 'family',
        subModules: {
            TREE: {
                name: 'tree',
                permissions: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE]
            },
            MEMBERS: {
                name: 'members',
                permissions: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE]
            },
            RELATIONSHIPS: {
                name: 'relationships',
                permissions: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE]
            }
        }
    },
    EVENTS: {
        name: 'events',
        subModules: {
            PERSONAL: {
                name: 'personal',
                permissions: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE]
            },
            FAMILY: {
                name: 'family',
                permissions: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE]
            },
            PUBLIC: {
                name: 'public',
                permissions: [PERMISSIONS.READ, PERMISSIONS.VIEW]
            }
        }
    },
    POSTS: {
        name: 'posts',
        subModules: {
            FEED: {
                name: 'feed',
                permissions: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE]
            },
            COMMENTS: {
                name: 'comments',
                permissions: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE]
            }
        }
    },
    MEDIA: {
        name: 'media',
        subModules: {
            PHOTOS: {
                name: 'photos',
                permissions: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE]
            },
            DOCUMENTS: {
                name: 'documents',
                permissions: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE]
            }
        }
    },
    ADMIN: {
        name: 'admin',
        subModules: {
            USERS: {
                name: 'users',
                permissions: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE, PERMISSIONS.MANAGE]
            },
            SYSTEM: {
                name: 'system',
                permissions: [PERMISSIONS.READ, PERMISSIONS.MANAGE]
            }
        }
    }
};

// Define roles with their permissions
const ROLES = {
    SUPER_ADMIN: {
        name: 'super_admin',
        description: 'Full system access',
        permissions: {
            [MODULES.FAMILY.name]: {
                [MODULES.FAMILY.subModules.TREE.name]: [PERMISSIONS.MANAGE],
                [MODULES.FAMILY.subModules.MEMBERS.name]: [PERMISSIONS.MANAGE],
                [MODULES.FAMILY.subModules.RELATIONSHIPS.name]: [PERMISSIONS.MANAGE]
            },
            [MODULES.EVENTS.name]: {
                [MODULES.EVENTS.subModules.PERSONAL.name]: [PERMISSIONS.MANAGE],
                [MODULES.EVENTS.subModules.FAMILY.name]: [PERMISSIONS.MANAGE],
                [MODULES.EVENTS.subModules.PUBLIC.name]: [PERMISSIONS.MANAGE]
            },
            [MODULES.POSTS.name]: {
                [MODULES.POSTS.subModules.FEED.name]: [PERMISSIONS.MANAGE],
                [MODULES.POSTS.subModules.COMMENTS.name]: [PERMISSIONS.MANAGE]
            },
            [MODULES.MEDIA.name]: {
                [MODULES.MEDIA.subModules.PHOTOS.name]: [PERMISSIONS.MANAGE],
                [MODULES.MEDIA.subModules.DOCUMENTS.name]: [PERMISSIONS.MANAGE]
            },
            [MODULES.ADMIN.name]: {
                [MODULES.ADMIN.subModules.USERS.name]: [PERMISSIONS.MANAGE],
                [MODULES.ADMIN.subModules.SYSTEM.name]: [PERMISSIONS.MANAGE]
            }
        }
    },
    ADMIN: {
        name: 'admin',
        description: 'Administrative access',
        permissions: {
            [MODULES.FAMILY.name]: {
                [MODULES.FAMILY.subModules.TREE.name]: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE],
                [MODULES.FAMILY.subModules.MEMBERS.name]: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE],
                [MODULES.FAMILY.subModules.RELATIONSHIPS.name]: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE]
            },
            [MODULES.EVENTS.name]: {
                [MODULES.EVENTS.subModules.PERSONAL.name]: [PERMISSIONS.READ, PERMISSIONS.UPDATE],
                [MODULES.EVENTS.subModules.FAMILY.name]: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE],
                [MODULES.EVENTS.subModules.PUBLIC.name]: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE]
            },
            [MODULES.POSTS.name]: {
                [MODULES.POSTS.subModules.FEED.name]: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE],
                [MODULES.POSTS.subModules.COMMENTS.name]: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE]
            },
            [MODULES.MEDIA.name]: {
                [MODULES.MEDIA.subModules.PHOTOS.name]: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE],
                [MODULES.MEDIA.subModules.DOCUMENTS.name]: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE]
            },
            [MODULES.ADMIN.name]: {
                [MODULES.ADMIN.subModules.USERS.name]: [PERMISSIONS.READ, PERMISSIONS.UPDATE],
                [MODULES.ADMIN.subModules.SYSTEM.name]: [PERMISSIONS.READ]
            }
        }
    },
    MODERATOR: {
        name: 'moderator',
        description: 'Content moderation access',
        permissions: {
            [MODULES.FAMILY.name]: {
                [MODULES.FAMILY.subModules.TREE.name]: [PERMISSIONS.READ, PERMISSIONS.UPDATE],
                [MODULES.FAMILY.subModules.MEMBERS.name]: [PERMISSIONS.READ, PERMISSIONS.UPDATE],
                [MODULES.FAMILY.subModules.RELATIONSHIPS.name]: [PERMISSIONS.READ, PERMISSIONS.UPDATE]
            },
            [MODULES.EVENTS.name]: {
                [MODULES.EVENTS.subModules.PERSONAL.name]: [PERMISSIONS.READ],
                [MODULES.EVENTS.subModules.FAMILY.name]: [PERMISSIONS.READ, PERMISSIONS.UPDATE],
                [MODULES.EVENTS.subModules.PUBLIC.name]: [PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE]
            },
            [MODULES.POSTS.name]: {
                [MODULES.POSTS.subModules.FEED.name]: [PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE],
                [MODULES.POSTS.subModules.COMMENTS.name]: [PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE]
            },
            [MODULES.MEDIA.name]: {
                [MODULES.MEDIA.subModules.PHOTOS.name]: [PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE],
                [MODULES.MEDIA.subModules.DOCUMENTS.name]: [PERMISSIONS.READ, PERMISSIONS.UPDATE]
            }
        }
    },
    USER: {
        name: 'user',
        description: 'Standard user access',
        permissions: {
            [MODULES.FAMILY.name]: {
                [MODULES.FAMILY.subModules.TREE.name]: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE],
                [MODULES.FAMILY.subModules.MEMBERS.name]: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE],
                [MODULES.FAMILY.subModules.RELATIONSHIPS.name]: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE]
            },
            [MODULES.EVENTS.name]: {
                [MODULES.EVENTS.subModules.PERSONAL.name]: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE],
                [MODULES.EVENTS.subModules.FAMILY.name]: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE],
                [MODULES.EVENTS.subModules.PUBLIC.name]: [PERMISSIONS.READ]
            },
            [MODULES.POSTS.name]: {
                [MODULES.POSTS.subModules.FEED.name]: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE],
                [MODULES.POSTS.subModules.COMMENTS.name]: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE]
            },
            [MODULES.MEDIA.name]: {
                [MODULES.MEDIA.subModules.PHOTOS.name]: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE],
                [MODULES.MEDIA.subModules.DOCUMENTS.name]: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE]
            }
        }
    },
    GUEST: {
        name: 'guest',
        description: 'Limited read-only access',
        permissions: {
            [MODULES.FAMILY.name]: {
                [MODULES.FAMILY.subModules.TREE.name]: [PERMISSIONS.READ],
                [MODULES.FAMILY.subModules.MEMBERS.name]: [PERMISSIONS.READ],
                [MODULES.FAMILY.subModules.RELATIONSHIPS.name]: [PERMISSIONS.READ]
            },
            [MODULES.EVENTS.name]: {
                [MODULES.EVENTS.subModules.PUBLIC.name]: [PERMISSIONS.READ]
            },
            [MODULES.POSTS.name]: {
                [MODULES.POSTS.subModules.FEED.name]: [PERMISSIONS.READ]
            },
            [MODULES.MEDIA.name]: {
                [MODULES.MEDIA.subModules.PHOTOS.name]: [PERMISSIONS.READ]
            }
        }
    }
};

/**
 * Check if a role has permission for a specific module/sub-module/action
 * @param {string} roleName - Role name (e.g., 'user', 'admin')
 * @param {string} module - Module name (e.g., 'family', 'events')
 * @param {string} subModule - Sub-module name (e.g., 'tree', 'members')
 * @param {string} permission - Permission to check (e.g., 'create', 'read')
 * @returns {boolean} - True if role has permission
 */
const hasPermission = (roleName, module, subModule, permission) => {
    const role = ROLES[roleName.toUpperCase()];
    if (!role) return false;

    const modulePermissions = role.permissions[module];
    if (!modulePermissions) return false;

    const subModulePermissions = modulePermissions[subModule];
    if (!subModulePermissions) return false;

    // Check for MANAGE permission (grants all permissions)
    if (subModulePermissions.includes(PERMISSIONS.MANAGE)) return true;

    // Check for specific permission
    return subModulePermissions.includes(permission);
};

/**
 * Get all permissions for a role
 * @param {string} roleName - Role name
 * @returns {object} - All permissions for the role
 */
const getRolePermissions = (roleName) => {
    const role = ROLES[roleName.toUpperCase()];
    return role ? role.permissions : {};
};

/**
 * Get available roles
 * @returns {object} - All available roles
 */
const getAvailableRoles = () => {
    return Object.keys(ROLES).map(key => ({
        name: ROLES[key].name,
        description: ROLES[key].description
    }));
};

module.exports = {
    PERMISSIONS,
    MODULES,
    ROLES,
    hasPermission,
    getRolePermissions,
    getAvailableRoles
};