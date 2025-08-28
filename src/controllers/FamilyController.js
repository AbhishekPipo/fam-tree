const User = require('../models/User');
const { Relationship, RELATIONSHIP_TYPES } = require('../models/Relationship');

class FamilyController {
    // Get family tree for a user
    static async getFamilyTree(req, res) {
        try {
            const userId = req.params.userId || req.query.userId;
            const { depth = 3 } = req.query;
            
            // Ensure the ID is treated as a string for consistency
            // JWT contains 'userId', not 'id'
            const finalUserId = String(userId || req.user.userId);
            
            const user = await User.findById(finalUserId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const familyTree = await user.getFamilyTree(parseInt(depth));
            
            res.status(200).json({
                success: true,
                data: {
                    centerPerson: user.toJSON(),
                    familyMembers: familyTree.map(member => member.toJSON()),
                    totalMembers: familyTree.length
                }
            });
        } catch (error) {
            console.error('Get family tree error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get all family members
    static async getFamilyMembers(req, res) {
        try {
            const filters = {
                ...req.query,
                familyTreeId: req.user.familyTreeIds?.[0] // Use user's primary family tree
            };
            
            const members = await User.findAll(filters);
            
            res.status(200).json({
                success: true,
                data: {
                    members: members.map(member => member.toJSON()),
                    totalCount: members.length
                }
            });
        } catch (error) {
            console.error('Get family members error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Add family member
    static async addFamilyMember(req, res) {
        try {
            const {
                firstName,
                lastName,
                middleName,
                gender,
                dateOfBirth,
                relationshipType,
                relationshipSubtype,
                relationshipProperties,
                ...userData
            } = req.body;

            // Create new user (family member)
            const familyMember = new User({
                firstName,
                lastName,
                middleName,
                gender,
                dateOfBirth,
                isAppUser: false, // Family member, not app user
                addedBy: req.user.id,
                familyTreeIds: req.user.familyTreeIds || [],
                ...userData
            });

            await familyMember.save();

            // Create relationship if specified
            if (relationshipType) {
                const relationship = new Relationship({
                    fromUserId: req.user.id,
                    toUserId: familyMember.id,
                    relationshipType,
                    relationshipSubtype,
                    createdBy: req.user.id,
                    ...relationshipProperties
                });

                await relationship.save();
            }

            res.status(201).json({
                success: true,
                message: 'Family member added successfully',
                data: {
                    member: familyMember.toJSON(),
                    relationship: relationshipType ? {
                        type: relationshipType,
                        subtype: relationshipSubtype
                    } : null
                }
            });
        } catch (error) {
            console.error('Add family member error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Update family member
    static async updateFamilyMember(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const familyMember = await User.findById(id);
            if (!familyMember) {
                return res.status(404).json({
                    success: false,
                    message: 'Family member not found'
                });
            }

            // Update properties
            Object.keys(updates).forEach(key => {
                if (updates[key] !== undefined) {
                    familyMember[key] = updates[key];
                }
            });

            familyMember.updatedAt = new Date().toISOString();
            await familyMember.save();

            res.status(200).json({
                success: true,
                message: 'Family member updated successfully',
                data: familyMember.toJSON()
            });
        } catch (error) {
            console.error('Update family member error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Remove family member
    static async removeFamilyMember(req, res) {
        try {
            const { id } = req.params;

            const familyMember = await User.findById(id);
            if (!familyMember) {
                return res.status(404).json({
                    success: false,
                    message: 'Family member not found'
                });
            }

            // Only allow deletion if user added this member or is admin
            if (familyMember.addedBy !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this family member'
                });
            }

            await User.delete(id);

            res.status(200).json({
                success: true,
                message: 'Family member removed successfully'
            });
        } catch (error) {
            console.error('Remove family member error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get relationship dropdown options
    static async getRelationshipDropdown(req, res) {
        try {
            const relationshipTypes = Object.entries(RELATIONSHIP_TYPES).map(([key, config]) => ({
                id: key,
                label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                category: config.category,
                description: config.description,
                generation: config.generation,
                gender: config.gender,
                allowedSubtypes: config.allowedSubtypes
            }));

            // Group by category
            const groupedRelationships = relationshipTypes.reduce((acc, rel) => {
                if (!acc[rel.category]) {
                    acc[rel.category] = [];
                }
                acc[rel.category].push(rel);
                return acc;
            }, {});

            res.status(200).json({
                success: true,
                data: {
                    relationshipOptions: relationshipTypes,
                    groupedByCategory: groupedRelationships,
                    categories: Object.keys(groupedRelationships)
                }
            });
        } catch (error) {
            console.error('Get relationship dropdown error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get all relationships for a user
    static async getUserRelationships(req, res) {
        try {
            const { userId } = req.params;
            
            const user = await User.findById(userId || req.user.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const relationships = await user.getRelationships();

            res.status(200).json({
                success: true,
                data: {
                    relationships: relationships,
                    totalCount: relationships.length
                }
            });
        } catch (error) {
            console.error('Get user relationships error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Create relationship between users
    static async createRelationship(req, res) {
        try {
            const {
                fromUserId,
                toUserId,
                relationshipType,
                relationshipSubtype,
                properties
            } = req.body;

            const relationship = new Relationship({
                fromUserId: fromUserId || req.user.id,
                toUserId,
                relationshipType,
                relationshipSubtype,
                createdBy: req.user.id,
                ...properties
            });

            await relationship.save();

            res.status(201).json({
                success: true,
                message: 'Relationship created successfully',
                data: relationship.toJSON()
            });
        } catch (error) {
            console.error('Create relationship error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Update relationship
    static async updateRelationship(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const relationship = await Relationship.findById(id);
            if (!relationship) {
                return res.status(404).json({
                    success: false,
                    message: 'Relationship not found'
                });
            }

            // Update properties
            Object.keys(updates).forEach(key => {
                if (updates[key] !== undefined) {
                    if (key === 'properties') {
                        relationship.properties = { ...relationship.properties, ...updates[key] };
                    } else {
                        relationship[key] = updates[key];
                    }
                }
            });

            relationship.updatedAt = new Date().toISOString();
            await relationship.save();

            res.status(200).json({
                success: true,
                message: 'Relationship updated successfully',
                data: relationship.toJSON()
            });
        } catch (error) {
            console.error('Update relationship error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Delete relationship
    static async deleteRelationship(req, res) {
        try {
            const { id } = req.params;

            const success = await Relationship.delete(id);
            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Relationship not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Relationship deleted successfully'
            });
        } catch (error) {
            console.error('Delete relationship error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get family statistics
    static async getFamilyStats(req, res) {
        try {
            const userId = req.user.id;
            
            // Get all family members
            const familyMembers = await User.findAll({
                familyTreeId: req.user.familyTreeIds?.[0]
            });

            // Get all relationships
            const relationships = await Relationship.findAll({});

            // Calculate statistics
            const stats = {
                totalMembers: familyMembers.length,
                totalRelationships: relationships.length,
                relationshipTypes: {},
                generationCounts: {},
                genderDistribution: { male: 0, female: 0, other: 0 },
                livingMembers: 0,
                deceasedMembers: 0,
                averageAge: 0,
                oldestMember: null,
                youngestMember: null
            };

            // Process family members
            let totalAge = 0;
            let ageCount = 0;
            let oldestAge = 0;
            let youngestAge = Infinity;

            familyMembers.forEach(member => {
                // Gender distribution
                stats.genderDistribution[member.gender] = (stats.genderDistribution[member.gender] || 0) + 1;

                // Living/deceased
                if (member.isAlive) {
                    stats.livingMembers++;
                } else {
                    stats.deceasedMembers++;
                }

                // Age calculations
                if (member.dateOfBirth) {
                    const birthDate = new Date(member.dateOfBirth);
                    const endDate = member.dateOfDeath ? new Date(member.dateOfDeath) : new Date();
                    const age = endDate.getFullYear() - birthDate.getFullYear();
                    
                    if (age > 0 && age < 150) { // Reasonable age range
                        totalAge += age;
                        ageCount++;

                        if (age > oldestAge) {
                            oldestAge = age;
                            stats.oldestMember = { name: member.fullName, age };
                        }
                        if (age < youngestAge) {
                            youngestAge = age;
                            stats.youngestMember = { name: member.fullName, age };
                        }
                    }
                }
            });

            stats.averageAge = ageCount > 0 ? Math.round(totalAge / ageCount) : 0;

            // Process relationships
            relationships.forEach(relationship => {
                const config = RELATIONSHIP_TYPES[relationship.relationshipType];
                if (config) {
                    stats.relationshipTypes[config.category] = (stats.relationshipTypes[config.category] || 0) + 1;
                }
            });

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get family stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Validate relationship constraints
    static async validateRelationship(req, res) {
        try {
            const { fromUserId, toUserId, relationshipType } = req.body;

            const tempRelationship = new Relationship({
                fromUserId,
                toUserId,
                relationshipType,
                createdBy: req.user.id
            });

            // This will throw an error if validation fails
            await tempRelationship.validate();

            res.status(200).json({
                success: true,
                message: 'Relationship is valid',
                data: {
                    isValid: true,
                    relationshipType,
                    config: RELATIONSHIP_TYPES[relationshipType]
                }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
                data: {
                    isValid: false,
                    relationshipType: req.body.relationshipType,
                    validationError: error.message
                }
            });
        }
    }

    // Get relationship suggestions
    static async getRelationshipSuggestions(req, res) {
        try {
            const { type, userId } = req.query;
            
            // This could implement AI-based suggestions in the future
            // For now, return basic suggestions based on relationship type
            const suggestions = [];

            if (type && RELATIONSHIP_TYPES[type]) {
                const config = RELATIONSHIP_TYPES[type];
                suggestions.push({
                    type,
                    description: config.description,
                    category: config.category,
                    reciprocal: config.reciprocal,
                    confidence: 0.8
                });

                // Add related relationship types
                Object.entries(RELATIONSHIP_TYPES)
                    .filter(([key, conf]) => conf.category === config.category && key !== type)
                    .slice(0, 3)
                    .forEach(([key, conf]) => {
                        suggestions.push({
                            type: key,
                            description: conf.description,
                            category: conf.category,
                            confidence: 0.6
                        });
                    });
            }

            res.status(200).json({
                success: true,
                data: {
                    suggestions,
                    totalCount: suggestions.length
                }
            });
        } catch (error) {
            console.error('Get relationship suggestions error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Bulk add family members
    static async bulkAddMembers(req, res) {
        try {
            const { members } = req.body;

            if (!Array.isArray(members) || members.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Members array is required'
                });
            }

            const results = [];
            const errors = [];

            for (let i = 0; i < members.length; i++) {
                try {
                    const memberData = members[i];
                    const familyMember = new User({
                        ...memberData,
                        isAppUser: false,
                        addedBy: req.user.id,
                        familyTreeIds: req.user.familyTreeIds || []
                    });

                    await familyMember.save();
                    results.push(familyMember.toJSON());
                } catch (error) {
                    errors.push({
                        index: i,
                        memberData: members[i],
                        error: error.message
                    });
                }
            }

            res.status(200).json({
                success: true,
                message: `Successfully added ${results.length} family members`,
                data: {
                    successful: results,
                    failed: errors,
                    totalProcessed: members.length,
                    successCount: results.length,
                    errorCount: errors.length
                }
            });
        } catch (error) {
            console.error('Bulk add members error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports = FamilyController;