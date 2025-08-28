const gremlin = require('gremlin');
const { v4: uuidv4 } = require('crypto').webcrypto ? { v4: () => crypto.randomUUID() } : require('uuid');
const db = require('../../config/database');

const __ = gremlin.process.statics;

// Comprehensive relationship types with metadata
const RELATIONSHIP_TYPES = {
    // Direct Family - Parents/Children
    'PARENT_OF': {
        reciprocal: 'CHILD_OF',
        category: 'blood',
        generation: 1,
        allowedSubtypes: ['biological', 'adoptive', 'step', 'foster'],
        description: 'Parent to child relationship',
        validationRules: ['preventSelfRelation', 'ageValidation', 'preventCircular']
    },
    'CHILD_OF': {
        reciprocal: 'PARENT_OF',
        category: 'blood',
        generation: -1,
        allowedSubtypes: ['biological', 'adoptive', 'step', 'foster'],
        description: 'Child to parent relationship',
        validationRules: ['preventSelfRelation', 'ageValidation', 'preventCircular']
    },
    'FATHER_OF': {
        reciprocal: 'SON_OF',
        category: 'blood',
        generation: 1,
        gender: 'male',
        allowedSubtypes: ['biological', 'adoptive', 'step', 'foster'],
        description: 'Father to son/daughter relationship'
    },
    'MOTHER_OF': {
        reciprocal: 'DAUGHTER_OF',
        category: 'blood',
        generation: 1,
        gender: 'female',
        allowedSubtypes: ['biological', 'adoptive', 'step', 'foster'],
        description: 'Mother to son/daughter relationship'
    },
    'SON_OF': {
        reciprocal: 'FATHER_OF',
        category: 'blood',
        generation: -1,
        gender: 'male',
        allowedSubtypes: ['biological', 'adoptive', 'step', 'foster'],
        description: 'Son to father/mother relationship'
    },
    'DAUGHTER_OF': {
        reciprocal: 'MOTHER_OF',
        category: 'blood',
        generation: -1,
        gender: 'female',
        allowedSubtypes: ['biological', 'adoptive', 'step', 'foster'],
        description: 'Daughter to father/mother relationship'
    },

    // Siblings
    'SIBLING_OF': {
        reciprocal: 'SIBLING_OF',
        category: 'blood',
        generation: 0,
        allowedSubtypes: ['full', 'half', 'step', 'adoptive'],
        description: 'Sibling relationship',
        validationRules: ['preventSelfRelation', 'sameGeneration']
    },
    'BROTHER_OF': {
        reciprocal: 'SISTER_OF',
        category: 'blood',
        generation: 0,
        gender: 'male',
        allowedSubtypes: ['full', 'half', 'step', 'adoptive'],
        description: 'Brother relationship'
    },
    'SISTER_OF': {
        reciprocal: 'BROTHER_OF',
        category: 'blood',
        generation: 0,
        gender: 'female',
        allowedSubtypes: ['full', 'half', 'step', 'adoptive'],
        description: 'Sister relationship'
    },

    // Grandparents/Grandchildren
    'GRANDPARENT_OF': {
        reciprocal: 'GRANDCHILD_OF',
        category: 'blood',
        generation: 2,
        allowedSubtypes: ['paternal', 'maternal'],
        description: 'Grandparent to grandchild relationship'
    },
    'GRANDFATHER_OF': {
        reciprocal: 'GRANDSON_OF',
        category: 'blood',
        generation: 2,
        gender: 'male',
        allowedSubtypes: ['paternal', 'maternal'],
        description: 'Grandfather relationship'
    },
    'GRANDMOTHER_OF': {
        reciprocal: 'GRANDDAUGHTER_OF',
        category: 'blood',
        generation: 2,
        gender: 'female',
        allowedSubtypes: ['paternal', 'maternal'],
        description: 'Grandmother relationship'
    },
    'GRANDCHILD_OF': {
        reciprocal: 'GRANDPARENT_OF',
        category: 'blood',
        generation: -2,
        description: 'Grandchild to grandparent relationship'
    },
    'GRANDSON_OF': {
        reciprocal: 'GRANDFATHER_OF',
        category: 'blood',
        generation: -2,
        gender: 'male',
        description: 'Grandson relationship'
    },
    'GRANDDAUGHTER_OF': {
        reciprocal: 'GRANDMOTHER_OF',
        category: 'blood',
        generation: -2,
        gender: 'female',
        description: 'Granddaughter relationship'
    },

    // Great-Grandparents
    'GREAT_GRANDPARENT_OF': {
        reciprocal: 'GREAT_GRANDCHILD_OF',
        category: 'blood',
        generation: 3,
        description: 'Great-grandparent relationship'
    },
    'GREAT_GRANDCHILD_OF': {
        reciprocal: 'GREAT_GRANDPARENT_OF',
        category: 'blood',
        generation: -3,
        description: 'Great-grandchild relationship'
    },

    // Aunts/Uncles/Nieces/Nephews
    'AUNT_OF': {
        reciprocal: 'NIECE_OF',
        category: 'blood',
        generation: 1,
        gender: 'female',
        allowedSubtypes: ['blood', 'marriage'],
        description: 'Aunt relationship'
    },
    'UNCLE_OF': {
        reciprocal: 'NEPHEW_OF',
        category: 'blood',
        generation: 1,
        gender: 'male',
        allowedSubtypes: ['blood', 'marriage'],
        description: 'Uncle relationship'
    },
    'NIECE_OF': {
        reciprocal: 'AUNT_OF',
        category: 'blood',
        generation: -1,
        gender: 'female',
        description: 'Niece relationship'
    },
    'NEPHEW_OF': {
        reciprocal: 'UNCLE_OF',
        category: 'blood',
        generation: -1,
        gender: 'male',
        description: 'Nephew relationship'
    },

    // Cousins
    'COUSIN_OF': {
        reciprocal: 'COUSIN_OF',
        category: 'blood',
        generation: 0,
        allowedSubtypes: ['first', 'second', 'third', 'removed'],
        description: 'Cousin relationship'
    },

    // Marriage Relationships
    'MARRIED_TO': {
        reciprocal: 'MARRIED_TO',
        category: 'marriage',
        generation: 0,
        requiredProperties: ['marriageDate'],
        validationRules: ['preventSelfRelation', 'preventPolygamy'],
        description: 'Marriage relationship'
    },
    'HUSBAND_OF': {
        reciprocal: 'WIFE_OF',
        category: 'marriage',
        generation: 0,
        gender: 'male',
        requiredProperties: ['marriageDate'],
        description: 'Husband relationship'
    },
    'WIFE_OF': {
        reciprocal: 'HUSBAND_OF',
        category: 'marriage',
        generation: 0,
        gender: 'female',
        requiredProperties: ['marriageDate'],
        description: 'Wife relationship'
    },
    'SPOUSE_OF': {
        reciprocal: 'SPOUSE_OF',
        category: 'marriage',
        generation: 0,
        requiredProperties: ['marriageDate'],
        description: 'Gender-neutral spouse relationship'
    },

    // Engagement
    'ENGAGED_TO': {
        reciprocal: 'ENGAGED_TO',
        category: 'engagement',
        generation: 0,
        requiredProperties: ['engagementDate'],
        description: 'Engagement relationship'
    },

    // Divorce
    'DIVORCED_FROM': {
        reciprocal: 'DIVORCED_FROM',
        category: 'divorce',
        generation: 0,
        requiredProperties: ['divorceDate'],
        description: 'Divorced relationship'
    },

    // In-Laws
    'PARENT_IN_LAW_OF': {
        reciprocal: 'CHILD_IN_LAW_OF',
        category: 'marriage',
        generation: 1,
        requiredProperties: ['throughSpouse'],
        description: 'Parent-in-law relationship'
    },
    'FATHER_IN_LAW_OF': {
        reciprocal: 'SON_IN_LAW_OF',
        category: 'marriage',
        generation: 1,
        gender: 'male',
        description: 'Father-in-law relationship'
    },
    'MOTHER_IN_LAW_OF': {
        reciprocal: 'DAUGHTER_IN_LAW_OF',
        category: 'marriage',
        generation: 1,
        gender: 'female',
        description: 'Mother-in-law relationship'
    },
    'CHILD_IN_LAW_OF': {
        reciprocal: 'PARENT_IN_LAW_OF',
        category: 'marriage',
        generation: -1,
        description: 'Child-in-law relationship'
    },
    'SON_IN_LAW_OF': {
        reciprocal: 'FATHER_IN_LAW_OF',
        category: 'marriage',
        generation: -1,
        gender: 'male',
        description: 'Son-in-law relationship'
    },
    'DAUGHTER_IN_LAW_OF': {
        reciprocal: 'MOTHER_IN_LAW_OF',
        category: 'marriage',
        generation: -1,
        gender: 'female',
        description: 'Daughter-in-law relationship'
    },
    'SIBLING_IN_LAW_OF': {
        reciprocal: 'SIBLING_IN_LAW_OF',
        category: 'marriage',
        generation: 0,
        description: 'Sibling-in-law relationship'
    },
    'BROTHER_IN_LAW_OF': {
        reciprocal: 'SISTER_IN_LAW_OF',
        category: 'marriage',
        generation: 0,
        gender: 'male',
        description: 'Brother-in-law relationship'
    },
    'SISTER_IN_LAW_OF': {
        reciprocal: 'BROTHER_IN_LAW_OF',
        category: 'marriage',
        generation: 0,
        gender: 'female',
        description: 'Sister-in-law relationship'
    },

    // Step Family
    'STEPPARENT_OF': {
        reciprocal: 'STEPCHILD_OF',
        category: 'step',
        generation: 1,
        description: 'Step-parent relationship'
    },
    'STEPFATHER_OF': {
        reciprocal: 'STEPSON_OF',
        category: 'step',
        generation: 1,
        gender: 'male',
        description: 'Step-father relationship'
    },
    'STEPMOTHER_OF': {
        reciprocal: 'STEPDAUGHTER_OF',
        category: 'step',
        generation: 1,
        gender: 'female',
        description: 'Step-mother relationship'
    },
    'STEPCHILD_OF': {
        reciprocal: 'STEPPARENT_OF',
        category: 'step',
        generation: -1,
        description: 'Step-child relationship'
    },
    'STEPSON_OF': {
        reciprocal: 'STEPFATHER_OF',
        category: 'step',
        generation: -1,
        gender: 'male',
        description: 'Step-son relationship'
    },
    'STEPDAUGHTER_OF': {
        reciprocal: 'STEPMOTHER_OF',
        category: 'step',
        generation: -1,
        gender: 'female',
        description: 'Step-daughter relationship'
    },
    'STEPSIBLING_OF': {
        reciprocal: 'STEPSIBLING_OF',
        category: 'step',
        generation: 0,
        description: 'Step-sibling relationship'
    },

    // Adoptive Family
    'ADOPTIVE_PARENT_OF': {
        reciprocal: 'ADOPTIVE_CHILD_OF',
        category: 'adoptive',
        generation: 1,
        requiredProperties: ['adoptionDate'],
        description: 'Adoptive parent relationship'
    },
    'ADOPTIVE_FATHER_OF': {
        reciprocal: 'ADOPTIVE_SON_OF',
        category: 'adoptive',
        generation: 1,
        gender: 'male',
        description: 'Adoptive father relationship'
    },
    'ADOPTIVE_MOTHER_OF': {
        reciprocal: 'ADOPTIVE_DAUGHTER_OF',
        category: 'adoptive',
        generation: 1,
        gender: 'female',
        description: 'Adoptive mother relationship'
    },
    'ADOPTIVE_CHILD_OF': {
        reciprocal: 'ADOPTIVE_PARENT_OF',
        category: 'adoptive',
        generation: -1,
        description: 'Adoptive child relationship'
    },
    'ADOPTIVE_SON_OF': {
        reciprocal: 'ADOPTIVE_FATHER_OF',
        category: 'adoptive',
        generation: -1,
        gender: 'male',
        description: 'Adoptive son relationship'
    },
    'ADOPTIVE_DAUGHTER_OF': {
        reciprocal: 'ADOPTIVE_MOTHER_OF',
        category: 'adoptive',
        generation: -1,
        gender: 'female',
        description: 'Adoptive daughter relationship'
    },

    // Foster Family
    'FOSTER_PARENT_OF': {
        reciprocal: 'FOSTER_CHILD_OF',
        category: 'foster',
        generation: 1,
        description: 'Foster parent relationship'
    },
    'FOSTER_CHILD_OF': {
        reciprocal: 'FOSTER_PARENT_OF',
        category: 'foster',
        generation: -1,
        description: 'Foster child relationship'
    },

    // Guardianship
    'GUARDIAN_OF': {
        reciprocal: 'WARD_OF',
        category: 'legal',
        generation: 1,
        description: 'Guardian relationship'
    },
    'WARD_OF': {
        reciprocal: 'GUARDIAN_OF',
        category: 'legal',
        generation: -1,
        description: 'Ward relationship'
    },

    // Godparents
    'GODPARENT_OF': {
        reciprocal: 'GODCHILD_OF',
        category: 'spiritual',
        generation: 1,
        description: 'Godparent relationship'
    },
    'GODFATHER_OF': {
        reciprocal: 'GODSON_OF',
        category: 'spiritual',
        generation: 1,
        gender: 'male',
        description: 'Godfather relationship'
    },
    'GODMOTHER_OF': {
        reciprocal: 'GODDAUGHTER_OF',
        category: 'spiritual',
        generation: 1,
        gender: 'female',
        description: 'Godmother relationship'
    },
    'GODCHILD_OF': {
        reciprocal: 'GODPARENT_OF',
        category: 'spiritual',
        generation: -1,
        description: 'Godchild relationship'
    },
    'GODSON_OF': {
        reciprocal: 'GODFATHER_OF',
        category: 'spiritual',
        generation: -1,
        gender: 'male',
        description: 'Godson relationship'
    },
    'GODDAUGHTER_OF': {
        reciprocal: 'GODMOTHER_OF',
        category: 'spiritual',
        generation: -1,
        gender: 'female',
        description: 'Goddaughter relationship'
    },

    // Social/Non-blood relationships
    'FRIEND_OF': {
        reciprocal: 'FRIEND_OF',
        category: 'social',
        generation: 0,
        description: 'Friend relationship'
    },
    'MENTOR_OF': {
        reciprocal: 'MENTEE_OF',
        category: 'social',
        generation: 0,
        description: 'Mentor relationship'
    },
    'MENTEE_OF': {
        reciprocal: 'MENTOR_OF',
        category: 'social',
        generation: 0,
        description: 'Mentee relationship'
    },

    // Professional relationships
    'COLLEAGUE_OF': {
        reciprocal: 'COLLEAGUE_OF',
        category: 'professional',
        generation: 0,
        description: 'Colleague relationship'
    },
    'SUPERVISOR_OF': {
        reciprocal: 'EMPLOYEE_OF',
        category: 'professional',
        generation: 0,
        description: 'Supervisor relationship'
    },
    'EMPLOYEE_OF': {
        reciprocal: 'SUPERVISOR_OF',
        category: 'professional',
        generation: 0,
        description: 'Employee relationship'
    }
};

class Relationship {
    constructor(data) {
        this.id = data.id || uuidv4();
        this.fromUserId = data.fromUserId;
        this.toUserId = data.toUserId;
        this.relationshipType = data.relationshipType;
        this.relationshipSubtype = data.relationshipSubtype || null;
        
        // Relationship properties
        this.properties = {
            establishedDate: data.establishedDate || new Date().toISOString(),
            confidence: data.confidence || 0.8,
            isVerified: data.isVerified || false,
            notes: data.notes || null,
            sources: data.sources || [],
            
            // Marriage specific
            marriageDate: data.marriageDate || null,
            marriagePlace: data.marriagePlace || null,
            divorceDate: data.divorceDate || null,
            
            // Engagement specific
            engagementDate: data.engagementDate || null,
            
            // Adoption specific
            adoptionDate: data.adoptionDate || null,
            
            // In-law relationships
            throughSpouse: data.throughSpouse || null,
            
            // Additional metadata
            isActive: data.isActive !== false,
            startDate: data.startDate || null,
            endDate: data.endDate || null,
            
            ...data.properties
        };
        
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.createdBy = data.createdBy || null;
    }

    static getRelationshipTypes() {
        return RELATIONSHIP_TYPES;
    }

    static getRelationshipType(type) {
        return RELATIONSHIP_TYPES[type] || null;
    }

    static getRelationshipsByCategory(category) {
        return Object.entries(RELATIONSHIP_TYPES)
            .filter(([_, config]) => config.category === category)
            .reduce((obj, [key, config]) => ({ ...obj, [key]: config }), {});
    }

    async validate() {
        const relationshipConfig = RELATIONSHIP_TYPES[this.relationshipType];
        
        if (!relationshipConfig) {
            throw new Error(`Invalid relationship type: ${this.relationshipType}`);
        }

        // Check required properties
        if (relationshipConfig.requiredProperties) {
            for (const prop of relationshipConfig.requiredProperties) {
                if (!this.properties[prop]) {
                    throw new Error(`Required property '${prop}' missing for relationship type '${this.relationshipType}'`);
                }
            }
        }

        // Apply validation rules
        if (relationshipConfig.validationRules) {
            for (const rule of relationshipConfig.validationRules) {
                await this.applyValidationRule(rule);
            }
        }

        // Validate subtype
        if (this.relationshipSubtype && relationshipConfig.allowedSubtypes) {
            if (!relationshipConfig.allowedSubtypes.includes(this.relationshipSubtype)) {
                throw new Error(`Invalid subtype '${this.relationshipSubtype}' for relationship type '${this.relationshipType}'`);
            }
        }

        return true;
    }

    async applyValidationRule(rule) {
        const g = db.getTraversal();

        switch (rule) {
            case 'preventSelfRelation':
                if (this.fromUserId === this.toUserId) {
                    throw new Error('Cannot create relationship with oneself');
                }
                break;

            case 'preventPolygamy':
                if (this.relationshipType.includes('MARRIED_TO')) {
                    const existingMarriages = await g.V()
                        .has('User', 'id', this.fromUserId)
                        .outE('FAMILY_RELATIONSHIP')
                        .has('relationshipType', gremlin.process.P.within(['MARRIED_TO', 'HUSBAND_OF', 'WIFE_OF', 'SPOUSE_OF']))
                        .has('isActive', true)
                        .toList();
                    
                    if (existingMarriages.length > 0) {
                        throw new Error('User is already married');
                    }
                }
                break;

            case 'ageValidation':
                // Ensure parent is older than child
                if (this.relationshipType.includes('PARENT_OF') || this.relationshipType.includes('FATHER_OF') || this.relationshipType.includes('MOTHER_OF')) {
                    const [parentData, childData] = await Promise.all([
                        g.V().has('User', 'id', this.fromUserId).elementMap().next(),
                        g.V().has('User', 'id', this.toUserId).elementMap().next()
                    ]);

                    if (parentData.value && childData.value) {
                        const parentBirth = new Date(parentData.value.get('dateOfBirth'));
                        const childBirth = new Date(childData.value.get('dateOfBirth'));
                        
                        if (parentBirth >= childBirth) {
                            throw new Error('Parent must be older than child');
                        }
                    }
                }
                break;

            case 'preventCircular':
                // Check for circular relationships that would create impossible family structures
                const isCircular = await this.checkCircularRelationship();
                if (isCircular) {
                    throw new Error('Relationship would create circular family structure');
                }
                break;
        }
    }

    async checkCircularRelationship() {
        const g = db.getTraversal();
        
        try {
            // Check if adding this relationship would create a path back to the original user
            const paths = await g.V()
                .has('User', 'id', this.toUserId)
                .repeat(__.out('FAMILY_RELATIONSHIP'))
                .until(__.has('id', this.fromUserId).or().loops().is(gremlin.process.P.gt(5)))
                .has('id', this.fromUserId)
                .toList();
            
            return paths.length > 0;
        } catch (error) {
            return false; // If there's an error, assume no circular relationship
        }
    }

    async save() {
        const g = db.getTraversal();
        
        try {
            // Validate relationship
            await this.validate();

            this.updatedAt = new Date().toISOString();

            // Create relationship edge
            const relationshipEdge = await g.V()
                .has('User', 'id', this.fromUserId)
                .addE('FAMILY_RELATIONSHIP')
                .to(__.V().has('User', 'id', this.toUserId))
                .property('id', this.id)
                .property('relationshipType', this.relationshipType)
                .property('relationshipSubtype', this.relationshipSubtype)
                .property('establishedDate', this.properties.establishedDate)
                .property('confidence', this.properties.confidence)
                .property('isVerified', this.properties.isVerified)
                .property('notes', this.properties.notes)
                .property('sources', JSON.stringify(this.properties.sources))
                .property('marriageDate', this.properties.marriageDate)
                .property('marriagePlace', this.properties.marriagePlace)
                .property('divorceDate', this.properties.divorceDate)
                .property('engagementDate', this.properties.engagementDate)
                .property('adoptionDate', this.properties.adoptionDate)
                .property('throughSpouse', this.properties.throughSpouse)
                .property('isActive', this.properties.isActive)
                .property('startDate', this.properties.startDate)
                .property('endDate', this.properties.endDate)
                .property('createdAt', this.createdAt)
                .property('updatedAt', this.updatedAt)
                .property('createdBy', this.createdBy)
                .next();

            // Create reciprocal relationship if needed
            const relationshipConfig = RELATIONSHIP_TYPES[this.relationshipType];
            if (relationshipConfig.reciprocal && relationshipConfig.reciprocal !== this.relationshipType) {
                await this.createReciprocalRelationship();
            }

            return this;
        } catch (error) {
            throw new Error(`Error saving relationship: ${error.message}`);
        }
    }

    async createReciprocalRelationship() {
        const g = db.getTraversal();
        const relationshipConfig = RELATIONSHIP_TYPES[this.relationshipType];
        const reciprocalType = relationshipConfig.reciprocal;

        try {
            await g.V()
                .has('User', 'id', this.toUserId)
                .addE('FAMILY_RELATIONSHIP')
                .to(__.V().has('User', 'id', this.fromUserId))
                .property('id', uuidv4())
                .property('relationshipType', reciprocalType)
                .property('relationshipSubtype', this.relationshipSubtype)
                .property('establishedDate', this.properties.establishedDate)
                .property('confidence', this.properties.confidence)
                .property('isVerified', this.properties.isVerified)
                .property('notes', this.properties.notes)
                .property('sources', JSON.stringify(this.properties.sources))
                .property('marriageDate', this.properties.marriageDate)
                .property('marriagePlace', this.properties.marriagePlace)
                .property('divorceDate', this.properties.divorceDate)
                .property('engagementDate', this.properties.engagementDate)
                .property('adoptionDate', this.properties.adoptionDate)
                .property('throughSpouse', this.properties.throughSpouse)
                .property('isActive', this.properties.isActive)
                .property('startDate', this.properties.startDate)
                .property('endDate', this.properties.endDate)
                .property('createdAt', this.createdAt)
                .property('updatedAt', this.updatedAt)
                .property('createdBy', this.createdBy)
                .iterate();
        } catch (error) {
            console.error(`Error creating reciprocal relationship: ${error.message}`);
        }
    }

    static async findById(id) {
        const g = db.getTraversal();
        
        try {
            const edges = await g.E().has('id', id).project('edge', 'from', 'to')
                .by(__.valueMap())
                .by(__.outV().elementMap())
                .by(__.inV().elementMap())
                .toList();
            
            if (edges.length === 0) {
                return null;
            }

            return Relationship.fromGraphData(edges[0]);
        } catch (error) {
            throw new Error(`Error finding relationship by ID: ${error.message}`);
        }
    }

    static async findByUsers(fromUserId, toUserId) {
        const g = db.getTraversal();
        
        try {
            const edges = await g.V()
                .has('User', 'id', fromUserId)
                .outE('FAMILY_RELATIONSHIP')
                .filter(__.inV().has('User', 'id', toUserId))
                .project('edge', 'from', 'to')
                .by(__.valueMap())
                .by(__.outV().elementMap())
                .by(__.inV().elementMap())
                .toList();
            
            return edges.map(edgeData => Relationship.fromGraphData(edgeData));
        } catch (error) {
            throw new Error(`Error finding relationships between users: ${error.message}`);
        }
    }

    static async findAll(filters = {}) {
        const g = db.getTraversal();
        
        try {
            let query = g.E().hasLabel('FAMILY_RELATIONSHIP');

            // Apply filters
            if (filters.relationshipType) {
                query = query.has('relationshipType', filters.relationshipType);
            }
            if (filters.category) {
                const typesInCategory = Object.entries(RELATIONSHIP_TYPES)
                    .filter(([_, config]) => config.category === filters.category)
                    .map(([type, _]) => type);
                query = query.has('relationshipType', gremlin.process.P.within(typesInCategory));
            }
            if (filters.isVerified !== undefined) {
                query = query.has('isVerified', filters.isVerified);
            }
            if (filters.isActive !== undefined) {
                query = query.has('isActive', filters.isActive);
            }

            const edges = await query.project('edge', 'from', 'to')
                .by(__.valueMap())
                .by(__.outV().elementMap())
                .by(__.inV().elementMap())
                .toList();
            
            return edges.map(edgeData => Relationship.fromGraphData(edgeData));
        } catch (error) {
            throw new Error(`Error finding relationships: ${error.message}`);
        }
    }

    static async delete(id) {
        const g = db.getTraversal();
        
        try {
            await g.E().has('id', id).drop().iterate();
            return true;
        } catch (error) {
            throw new Error(`Error deleting relationship: ${error.message}`);
        }
    }

    static fromGraphData(data) {
        const edgeMap = data.get('edge');
        const fromUserMap = data.get('from');
        const toUserMap = data.get('to');

        const relationshipData = {
            id: edgeMap.get('id'),
            fromUserId: fromUserMap.get('id'),
            toUserId: toUserMap.get('id'),
            relationshipType: edgeMap.get('relationshipType'),
            relationshipSubtype: edgeMap.get('relationshipSubtype'),
            establishedDate: edgeMap.get('establishedDate'),
            confidence: edgeMap.get('confidence'),
            isVerified: edgeMap.get('isVerified'),
            notes: edgeMap.get('notes'),
            marriageDate: edgeMap.get('marriageDate'),
            marriagePlace: edgeMap.get('marriagePlace'),
            divorceDate: edgeMap.get('divorceDate'),
            engagementDate: edgeMap.get('engagementDate'),
            adoptionDate: edgeMap.get('adoptionDate'),
            throughSpouse: edgeMap.get('throughSpouse'),
            isActive: edgeMap.get('isActive'),
            startDate: edgeMap.get('startDate'),
            endDate: edgeMap.get('endDate'),
            createdAt: edgeMap.get('createdAt'),
            updatedAt: edgeMap.get('updatedAt'),
            createdBy: edgeMap.get('createdBy'),
            sources: edgeMap.get('sources') ? JSON.parse(edgeMap.get('sources')) : []
        };

        return new Relationship(relationshipData);
    }

    toJSON() {
        return {
            id: this.id,
            fromUserId: this.fromUserId,
            toUserId: this.toUserId,
            relationshipType: this.relationshipType,
            relationshipSubtype: this.relationshipSubtype,
            properties: this.properties,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            createdBy: this.createdBy
        };
    }
}

module.exports = { Relationship, RELATIONSHIP_TYPES };