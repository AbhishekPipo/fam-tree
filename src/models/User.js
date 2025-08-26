const janusGraphConnection = require('../config/database');

class User {
  constructor(userData) {
    this.phone = userData.phone;
    this.firstName = userData.firstName;
    this.lastName = userData.lastName;
    this.email = userData.email;
    this.dateOfBirth = userData.dateOfBirth;
    this.gender = userData.gender;
    this.profilePicture = userData.profilePicture;
    this.isActive = userData.isActive !== undefined ? userData.isActive : true;
    this.createdAt = userData.createdAt || new Date();
    this.updatedAt = userData.updatedAt || new Date();
  }

  // Create a new user in JanusGraph
  async save() {
    try {
      const g = janusGraphConnection.getTraversal();
      
      // Check if user already exists
      const existingUser = await g.V().has('user', 'phone', this.phone).next();
      
      if (existingUser.value) {
        throw new Error('User with this phone number already exists');
      }

      // Create new user vertex
      const userVertex = await g.addV('user')
        .property('phone', this.phone)
        .property('firstName', this.firstName)
        .property('lastName', this.lastName)
        .property('email', this.email)
        .property('dateOfBirth', this.dateOfBirth)
        .property('gender', this.gender)
        .property('profilePicture', this.profilePicture)
        .property('isActive', this.isActive)
        .property('createdAt', this.createdAt)
        .property('updatedAt', this.updatedAt)
        .next();

      return userVertex.value;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Find user by phone number
  static async findByPhone(phone) {
    try {
      const g = janusGraphConnection.getTraversal();
      
      const userVertex = await g.V()
        .has('user', 'phone', phone)
        .valueMap(true)
        .next();

      if (!userVertex.value) {
        return null;
      }

      const userData = userVertex.value;
      return new User({
        phone: userData.phone[0],
        firstName: userData.firstName?.[0],
        lastName: userData.lastName?.[0],
        email: userData.email?.[0],
        dateOfBirth: userData.dateOfBirth?.[0],
        gender: userData.gender?.[0],
        profilePicture: userData.profilePicture?.[0],
        isActive: userData.isActive?.[0],
        createdAt: userData.createdAt?.[0],
        updatedAt: userData.updatedAt?.[0]
      });
    } catch (error) {
      console.error('Error finding user:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(userId) {
    try {
      const g = janusGraphConnection.getTraversal();
      
      const userVertex = await g.V(userId)
        .hasLabel('user')
        .valueMap(true)
        .next();

      if (!userVertex.value) {
        return null;
      }

      const userData = userVertex.value;
      return new User({
        id: userData.id,
        phone: userData.phone[0],
        firstName: userData.firstName?.[0],
        lastName: userData.lastName?.[0],
        email: userData.email?.[0],
        dateOfBirth: userData.dateOfBirth?.[0],
        gender: userData.gender?.[0],
        profilePicture: userData.profilePicture?.[0],
        isActive: userData.isActive?.[0],
        createdAt: userData.createdAt?.[0],
        updatedAt: userData.updatedAt?.[0]
      });
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Update user
  async update(updateData) {
    try {
      const g = janusGraphConnection.getTraversal();
      
      let traversal = g.V().has('user', 'phone', this.phone);
      
      // Update each provided field
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          traversal = traversal.property(key, updateData[key]);
          this[key] = updateData[key];
        }
      });
      
      // Always update the updatedAt timestamp
      traversal = traversal.property('updatedAt', new Date());
      this.updatedAt = new Date();
      
      await traversal.next();
      
      return this;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  async delete() {
    try {
      const g = janusGraphConnection.getTraversal();
      
      await g.V()
        .has('user', 'phone', this.phone)
        .drop()
        .next();
        
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get user's family relationships
  async getFamilyRelationships() {
    try {
      const g = janusGraphConnection.getTraversal();
      
      const relationships = await g.V()
        .has('user', 'phone', this.phone)
        .bothE('parentOf', 'childOf', 'spouseOf', 'siblingOf')
        .project('relationship', 'relatedUser')
        .by('label')
        .by(__.otherV().valueMap(true))
        .toList();

      return relationships;
    } catch (error) {
      console.error('Error getting family relationships:', error);
      throw error;
    }
  }

  // Add family relationship
  async addRelationship(relatedUserPhone, relationshipType) {
    try {
      const g = janusGraphConnection.getTraversal();
      
      // Find both users
      const currentUser = await g.V().has('user', 'phone', this.phone).next();
      const relatedUser = await g.V().has('user', 'phone', relatedUserPhone).next();
      
      if (!currentUser.value || !relatedUser.value) {
        throw new Error('One or both users not found');
      }

      // Add relationship edge
      await g.V(currentUser.value.id)
        .addE(relationshipType)
        .to(g.V(relatedUser.value.id))
        .property('createdAt', new Date())
        .next();

      return true;
    } catch (error) {
      console.error('Error adding relationship:', error);
      throw error;
    }
  }

  // Convert to JSON (remove sensitive data)
  toJSON() {
    return {
      phone: this.phone,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      profilePicture: this.profilePicture,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = User;