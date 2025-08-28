const gremlin = require('gremlin');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('crypto').webcrypto ? { v4: () => crypto.randomUUID() } : require('uuid');
const db = require('../../config/database');

const __ = gremlin.process.statics;

class User {
    constructor(data) {
        // Core Identity Fields (10)
        this.id = data.id || uuidv4();
        this.firstName = data.firstName;
        this.middleName = data.middleName || null;
        this.lastName = data.lastName;
        this.fullName = data.fullName || `${data.firstName} ${data.middleName || ''} ${data.lastName}`.trim();
        this.preferredName = data.preferredName || data.firstName;
        this.suffix = data.suffix || null; // Jr., Sr., III, etc.
        this.prefix = data.prefix || null; // Dr., Mr., Mrs., etc.
        this.maidenName = data.maidenName || null;
        this.nicknames = data.nicknames || [];

        // Contact Information (8)
        this.primaryEmail = data.primaryEmail || data.email;
        this.secondaryEmail = data.secondaryEmail || null;
        this.primaryPhone = data.primaryPhone || data.phoneNumber;
        this.secondaryPhone = data.secondaryPhone || null;
        this.workPhone = data.workPhone || null;
        this.socialMedia = data.socialMedia || {};
        this.website = data.website || null;
        this.emergencyContact = data.emergencyContact || null;

        // Demographics (10)
        this.dateOfBirth = data.dateOfBirth;
        this.placeOfBirth = data.placeOfBirth || null;
        this.dateOfDeath = data.dateOfDeath || null;
        this.placeOfDeath = data.placeOfDeath || null;
        this.gender = data.gender; // male, female, non-binary, other
        this.maritalStatus = data.maritalStatus || 'unknown'; // single, married, divorced, widowed, separated
        this.nationality = data.nationality || null;
        this.ethnicity = data.ethnicity || null;
        this.religion = data.religion || null;
        this.languages = data.languages || [];

        // Physical Characteristics (8)
        this.height = data.height || null;
        this.weight = data.weight || null;
        this.eyeColor = data.eyeColor || null;
        this.hairColor = data.hairColor || null;
        this.bloodType = data.bloodType || null;
        this.physicalTraits = data.physicalTraits || [];
        this.disabilities = data.disabilities || [];
        this.medicalConditions = data.medicalConditions || [];

        // Location Information (6)
        this.currentAddress = data.currentAddress || data.location || null;
        this.previousAddresses = data.previousAddresses || [];
        this.birthCountry = data.birthCountry || null;
        this.currentCountry = data.currentCountry || null;
        this.timeZone = data.timeZone || null;
        this.coordinates = data.coordinates || null;

        // Professional Information (8)
        this.occupation = data.occupation || null;
        this.employer = data.employer || null;
        this.workAddress = data.workAddress || null;
        this.jobTitle = data.jobTitle || null;
        this.industry = data.industry || null;
        this.skills = data.skills || [];
        this.education = data.education || [];
        this.certifications = data.certifications || [];

        // App-specific Fields (10)
        this.isAppUser = data.isAppUser || false;
        this.password = data.password || null;
        this.isVerified = data.isVerified || false;
        this.isActive = data.isActive !== false;
        this.lastLoginAt = data.lastLoginAt || null;
        this.profilePicture = data.profilePicture || null;
        this.coverPhoto = data.coverPhoto || null;
        this.privacySettings = data.privacySettings || this.getDefaultPrivacySettings();
        this.preferences = data.preferences || {};
        this.notificationSettings = data.notificationSettings || this.getDefaultNotificationSettings();

        // Family Tree Context (8)
        this.isAlive = data.isAlive !== false;
        this.isDeceased = data.isDeceased || false;
        this.familyTreeIds = data.familyTreeIds || [];
        this.addedBy = data.addedBy || null;
        this.verifiedBy = data.verifiedBy || [];
        this.sources = data.sources || [];
        this.notes = data.notes || null;
        this.tags = data.tags || [];

        // Health Information (5)
        this.hasMedication = data.hasMedication || false;
        this.medicationName = data.medicationName || null;
        this.medicationFrequency = data.medicationFrequency || null;
        this.medicationTime = data.medicationTime || null;
        this.healthNotes = data.healthNotes || null;

        // Social & Personal (5)
        this.interests = data.interests || [];
        this.hobbies = data.hobbies || [];
        this.achievements = data.achievements || [];
        this.personality = data.personality || null;
        this.biography = data.biography || null;

        // System Fields (4)
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.isOnline = data.isOnline || false;
        this.lastSeenAt = data.lastSeenAt || null;
    }

    getDefaultPrivacySettings() {
        return {
            profile: 'family', // public, family, private
            email: 'private',
            phone: 'family',
            location: 'family',
            dateOfBirth: 'family',
            biography: 'public',
            photos: 'family',
            relationships: 'family',
            health: 'private'
        };
    }

    getDefaultNotificationSettings() {
        return {
            email: true,
            push: true,
            familyUpdates: true,
            eventReminders: true,
            messageAlerts: true,
            systemNotifications: true
        };
    }

    async save() {
        const g = db.getTraversal();
        
        try {
            // Hash password if provided and user is an app user
            if (this.password && this.isAppUser) {
                this.password = await bcrypt.hash(this.password, 12);
            }

            this.updatedAt = new Date().toISOString();

            // Check if user exists
            const existingUser = await g.V().has('User', 'id', this.id).toList();
            
            if (existingUser.length > 0) {
                // Update existing user
                const updateQuery = g.V().has('User', 'id', this.id);
                
                // Update all properties
                Object.keys(this).forEach(key => {
                    if (this[key] !== null && key !== 'id') {
                        updateQuery.property(key, this[key]);
                    }
                });

                await updateQuery.iterate();
                return this;
            } else {
                // Create new user
                const userVertex = await g.addV('User')
                    .property('id', this.id)
                    .property('firstName', this.firstName)
                    .property('middleName', this.middleName)
                    .property('lastName', this.lastName)
                    .property('fullName', this.fullName)
                    .property('preferredName', this.preferredName)
                    .property('suffix', this.suffix)
                    .property('prefix', this.prefix)
                    .property('maidenName', this.maidenName)
                    .property('nicknames', JSON.stringify(this.nicknames))
                    .property('primaryEmail', this.primaryEmail)
                    .property('secondaryEmail', this.secondaryEmail)
                    .property('primaryPhone', this.primaryPhone)
                    .property('secondaryPhone', this.secondaryPhone)
                    .property('workPhone', this.workPhone)
                    .property('socialMedia', JSON.stringify(this.socialMedia))
                    .property('website', this.website)
                    .property('emergencyContact', this.emergencyContact)
                    .property('dateOfBirth', this.dateOfBirth)
                    .property('placeOfBirth', this.placeOfBirth)
                    .property('dateOfDeath', this.dateOfDeath)
                    .property('placeOfDeath', this.placeOfDeath)
                    .property('gender', this.gender)
                    .property('maritalStatus', this.maritalStatus)
                    .property('nationality', this.nationality)
                    .property('ethnicity', this.ethnicity)
                    .property('religion', this.religion)
                    .property('languages', JSON.stringify(this.languages))
                    .property('height', this.height)
                    .property('weight', this.weight)
                    .property('eyeColor', this.eyeColor)
                    .property('hairColor', this.hairColor)
                    .property('bloodType', this.bloodType)
                    .property('physicalTraits', JSON.stringify(this.physicalTraits))
                    .property('disabilities', JSON.stringify(this.disabilities))
                    .property('medicalConditions', JSON.stringify(this.medicalConditions))
                    .property('currentAddress', this.currentAddress)
                    .property('previousAddresses', JSON.stringify(this.previousAddresses))
                    .property('birthCountry', this.birthCountry)
                    .property('currentCountry', this.currentCountry)
                    .property('timeZone', this.timeZone)
                    .property('coordinates', JSON.stringify(this.coordinates))
                    .property('occupation', this.occupation)
                    .property('employer', this.employer)
                    .property('workAddress', this.workAddress)
                    .property('jobTitle', this.jobTitle)
                    .property('industry', this.industry)
                    .property('skills', JSON.stringify(this.skills))
                    .property('education', JSON.stringify(this.education))
                    .property('certifications', JSON.stringify(this.certifications))
                    .property('isAppUser', this.isAppUser)
                    .property('password', this.password)
                    .property('isVerified', this.isVerified)
                    .property('isActive', this.isActive)
                    .property('lastLoginAt', this.lastLoginAt)
                    .property('profilePicture', this.profilePicture)
                    .property('coverPhoto', this.coverPhoto)
                    .property('privacySettings', JSON.stringify(this.privacySettings))
                    .property('preferences', JSON.stringify(this.preferences))
                    .property('notificationSettings', JSON.stringify(this.notificationSettings))
                    .property('isAlive', this.isAlive)
                    .property('isDeceased', this.isDeceased)
                    .property('familyTreeIds', JSON.stringify(this.familyTreeIds))
                    .property('addedBy', this.addedBy)
                    .property('verifiedBy', JSON.stringify(this.verifiedBy))
                    .property('sources', JSON.stringify(this.sources))
                    .property('notes', this.notes)
                    .property('tags', JSON.stringify(this.tags))
                    .property('hasMedication', this.hasMedication)
                    .property('medicationName', this.medicationName)
                    .property('medicationFrequency', this.medicationFrequency)
                    .property('medicationTime', this.medicationTime)
                    .property('healthNotes', this.healthNotes)
                    .property('interests', JSON.stringify(this.interests))
                    .property('hobbies', JSON.stringify(this.hobbies))
                    .property('achievements', JSON.stringify(this.achievements))
                    .property('personality', this.personality)
                    .property('biography', this.biography)
                    .property('createdAt', this.createdAt)
                    .property('updatedAt', this.updatedAt)
                    .property('isOnline', this.isOnline)
                    .property('lastSeenAt', this.lastSeenAt)
                    .next();

                return this;
            }
        } catch (error) {
            throw new Error(`Error saving user: ${error.message}`);
        }
    }

    static async findById(id) {
        const g = db.getTraversal();
        
        try {
            let users = [];
            
            // First try to find by vertex ID (numeric)
            if (!isNaN(id)) {
                users = await g.V(parseInt(id)).hasLabel('User').elementMap().toList();
            }
            
            // If not found, try to find by property 'id' (UUID string)
            if (users.length === 0) {
                users = await g.V().has('User', 'id', id).elementMap().toList();
            }
            
            if (users.length === 0) {
                return null;
            }

            return User.fromGraphData(users[0]);
        } catch (error) {
            throw new Error(`Error finding user by ID: ${error.message}`);
        }
    }

    static async findByEmail(email) {
        const g = db.getTraversal();
        
        try {
            const users = await g.V().has('User', 'primaryEmail', email).elementMap().toList();
            
            if (users.length === 0) {
                return null;
            }

            return User.fromGraphData(users[0]);
        } catch (error) {
            throw new Error(`Error finding user by email: ${error.message}`);
        }
    }

    static async findByPhone(phone) {
        const g = db.getTraversal();
        
        try {
            const users = await g.V().has('User', 'primaryPhone', phone).elementMap().toList();
            
            if (users.length === 0) {
                return null;
            }

            return User.fromGraphData(users[0]);
        } catch (error) {
            throw new Error(`Error finding user by phone: ${error.message}`);
        }
    }

    static async findAll(filters = {}) {
        const g = db.getTraversal();
        
        try {
            let query = g.V().hasLabel('User');

            // Apply filters
            if (filters.isAppUser !== undefined) {
                query = query.has('isAppUser', filters.isAppUser);
            }
            if (filters.isAlive !== undefined) {
                query = query.has('isAlive', filters.isAlive);
            }
            if (filters.gender) {
                query = query.has('gender', filters.gender);
            }
            if (filters.familyTreeId) {
                query = query.has('familyTreeIds', gremlin.process.P.within([filters.familyTreeId]));
            }

            // Apply pagination
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.skip) {
                query = query.skip(filters.skip);
            }

            const users = await query.elementMap().toList();
            return users.map(userData => User.fromGraphData(userData));
        } catch (error) {
            throw new Error(`Error finding users: ${error.message}`);
        }
    }

    static async delete(id) {
        const g = db.getTraversal();
        
        try {
            await g.V().has('User', 'id', id).drop().iterate();
            return true;
        } catch (error) {
            throw new Error(`Error deleting user: ${error.message}`);
        }
    }

    static fromGraphData(data) {
        const userData = {};
        
        // Convert Map to object and parse JSON fields
        for (const [key, value] of data.entries()) {
            // Skip T.label and T.id enum values
            if (typeof key === 'object' && key.elementName) {
                continue;
            }
            
            // Parse JSON fields
            const jsonFields = [
                'nicknames', 'socialMedia', 'languages', 'physicalTraits', 
                'disabilities', 'medicalConditions', 'previousAddresses', 
                'coordinates', 'skills', 'education', 'certifications',
                'privacySettings', 'preferences', 'notificationSettings',
                'familyTreeIds', 'verifiedBy', 'sources', 'tags',
                'interests', 'hobbies', 'achievements'
            ];
            
            if (jsonFields.includes(key) && typeof value === 'string') {
                try {
                    userData[key] = JSON.parse(value);
                } catch (e) {
                    userData[key] = value;
                }
            } else {
                userData[key] = value;
            }
        }

        return new User(userData);
    }

    async comparePassword(candidatePassword) {
        if (!this.password) {
            return false;
        }
        return bcrypt.compare(candidatePassword, this.password);
    }

    toJSON() {
        const obj = { ...this };
        delete obj.password; // Never include password in JSON output
        return obj;
    }

    // Get family relationships
    async getRelationships() {
        const g = db.getTraversal();
        
        try {
            const relationships = await g.V().has('User', 'id', this.id)
                .bothE('FAMILY_RELATIONSHIP')
                .project('id', 'type', 'relatedUser', 'properties')
                .by(__.id())
                .by('relationshipType')
                .by(__.otherV().elementMap())
                .by(__.valueMap())
                .toList();

            return relationships.map(rel => ({
                id: rel.get('id'),
                type: rel.get('type'),
                relatedUser: User.fromGraphData(rel.get('relatedUser')),
                properties: rel.get('properties')
            }));
        } catch (error) {
            throw new Error(`Error getting relationships: ${error.message}`);
        }
    }

    // Get family tree
    async getFamilyTree(depth = 3) {
        const g = db.getTraversal();
        
        try {
            // First find the user vertex by ID (either vertex ID or property ID)
            let userVertex;
            if (!isNaN(this.id)) {
                userVertex = g.V(parseInt(this.id)).hasLabel('User');
            } else {
                userVertex = g.V().has('User', 'id', this.id);
            }
            
            const tree = await userVertex
                .repeat(__.both('FAMILY_RELATIONSHIP'))
                .times(depth)
                .dedup()
                .elementMap()
                .toList();

            return tree.map(userData => User.fromGraphData(userData));
        } catch (error) {
            throw new Error(`Error getting family tree: ${error.message}`);
        }
    }
}

module.exports = User;