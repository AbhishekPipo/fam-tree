const { User, DirectRelationship, IndirectRelationship, RelationshipType } = require('../models');
const familyService = require('./familyService');

class GraphService {
  /**
   * Transform family tree data into graph format for visualization
   * @param {number} userId - User ID
   * @param {Object} options - Graph options
   * @returns {Object} - Graph data with nodes and edges
   */
  async getFamilyTreeGraph(userId, options = {}) {
    const {
      includeInLaws = false,
      layout = 'hierarchical', // 'hierarchical', 'force', 'circular'
      maxDepth = 3,
      includeExtended = true
    } = options;

    // Get family tree data
    const familyTree = await familyService.getExtendedFamilyTree(userId, includeInLaws);
    
    // Transform to graph format
    const graphData = await this._transformToGraphData(familyTree, userId, options);
    
    return {
      ...graphData,
      metadata: {
        centerUserId: userId,
        layout,
        includeInLaws,
        totalNodes: graphData.nodes.length,
        totalEdges: graphData.edges.length,
        maxDepth,
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Get graph data for specific relationship paths
   * @param {number} userId - User ID
   * @param {number} targetUserId - Target user ID
   * @returns {Object} - Path graph data
   */
  async getRelationshipPath(userId, targetUserId) {
    // Get both users' family trees
    const userTree = await familyService.getFamilyTree(userId);
    const targetTree = await familyService.getFamilyTree(targetUserId);
    
    // Find connection paths
    const paths = await this._findConnectionPaths(userId, targetUserId, userTree, targetTree);
    
    // Transform paths to graph format
    const graphData = await this._transformPathsToGraph(paths, userId, targetUserId);
    
    return {
      ...graphData,
      metadata: {
        fromUserId: userId,
        toUserId: targetUserId,
        pathsFound: paths.length,
        shortestPath: paths.length > 0 ? paths[0].length : 0
      }
    };
  }

  /**
   * Transform family tree data to graph nodes and edges
   * @private
   */
  async _transformToGraphData(familyTree, centerUserId, options) {
    const nodes = [];
    const edges = [];
    const processedUsers = new Set();

    // Add center user node
    const centerUser = familyTree.currentUser;
    nodes.push(this._createUserNode(centerUser, 'center', 0));
    processedUsers.add(centerUser.id);

    // Process ancestors (parents, grandparents, etc.)
    familyTree.ancestors.forEach(ancestor => {
      if (!processedUsers.has(ancestor.user.id)) {
        nodes.push(this._createUserNode(ancestor.user, 'ancestor', ancestor.level));
        processedUsers.add(ancestor.user.id);
      }
      
      // Add edge from ancestor to center user or their descendants
      edges.push(this._createRelationshipEdge(
        ancestor.user.id,
        this._findDirectConnection(ancestor.user, centerUserId, familyTree),
        ancestor.relationship,
        'ancestor'
      ));

      // Process ancestor's children (cousins, etc.)
      if (ancestor.children && options.includeExtended) {
        ancestor.children.forEach(child => {
          if (!processedUsers.has(child.user.id)) {
            nodes.push(this._createUserNode(child.user, 'extended', child.level));
            processedUsers.add(child.user.id);
          }
          
          edges.push(this._createRelationshipEdge(
            ancestor.user.id,
            child.user.id,
            this._getParentChildRelationship(ancestor.user.gender),
            'parent-child'
          ));
        });
      }
    });

    // Process descendants (children, grandchildren, etc.)
    familyTree.descendants.forEach(descendant => {
      if (!processedUsers.has(descendant.user.id)) {
        nodes.push(this._createUserNode(descendant.user, 'descendant', descendant.level));
        processedUsers.add(descendant.user.id);
      }
      
      // Find parent connection
      const parentId = this._findParentConnection(descendant.user, centerUserId, familyTree);
      if (parentId) {
        edges.push(this._createRelationshipEdge(
          parentId,
          descendant.user.id,
          this._getParentChildRelationship(descendant.user.gender, true),
          'parent-child'
        ));
      }
    });

    // Process adjacent relationships (spouses, siblings, cousins)
    familyTree.adjacent.forEach(adjacent => {
      if (!processedUsers.has(adjacent.user.id)) {
        nodes.push(this._createUserNode(adjacent.user, 'adjacent', adjacent.level));
        processedUsers.add(adjacent.user.id);
      }
      
      edges.push(this._createRelationshipEdge(
        centerUserId,
        adjacent.user.id,
        adjacent.relationship,
        this._getEdgeType(adjacent.relationship)
      ));
    });

    // Process in-laws if included
    if (options.includeInLaws && familyTree.inLaws) {
      familyTree.inLaws.forEach(inLawTree => {
        this._processInLawTree(inLawTree, nodes, edges, processedUsers, options);
      });
    }

    return { nodes, edges };
  }

  /**
   * Create a user node for the graph
   * @private
   */
  _createUserNode(user, category, level) {
    return {
      id: user.id,
      label: `${user.firstName} ${user.lastName}`,
      title: this._createNodeTooltip(user, category, level),
      category,
      level,
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        location: user.location,
        hasMedication: user.hasMedication,
        isOnline: this._checkUserOnlineStatus(user.id)
      },
      style: this._getNodeStyle(category, user.gender, level),
      physics: category !== 'center' // Center node should be fixed
    };
  }

  /**
   * Create a relationship edge for the graph
   * @private
   */
  _createRelationshipEdge(fromId, toId, relationship, edgeType) {
    return {
      id: `${fromId}-${toId}`,
      from: fromId,
      to: toId,
      label: relationship,
      title: `${relationship} relationship`,
      category: edgeType,
      style: this._getEdgeStyle(edgeType, relationship),
      arrows: this._getEdgeArrows(edgeType, relationship)
    };
  }

  /**
   * Get node styling based on category and properties
   * @private
   */
  _getNodeStyle(category, gender, level) {
    const baseStyle = {
      borderWidth: 2,
      borderWidthSelected: 3,
      font: { size: 12, face: 'Arial' }
    };

    const categoryStyles = {
      center: {
        color: { background: '#4CAF50', border: '#2E7D32' },
        size: 25,
        font: { size: 14, color: 'white' }
      },
      ancestor: {
        color: { background: '#2196F3', border: '#1565C0' },
        size: 20,
        font: { color: 'white' }
      },
      descendant: {
        color: { background: '#FF9800', border: '#E65100' },
        size: 20,
        font: { color: 'white' }
      },
      adjacent: {
        color: { background: '#9C27B0', border: '#6A1B9A' },
        size: 20,
        font: { color: 'white' }
      },
      extended: {
        color: { background: '#607D8B', border: '#37474F' },
        size: 18,
        font: { color: 'white' }
      },
      inlaw: {
        color: { background: '#795548', border: '#4E342E' },
        size: 18,
        font: { color: 'white' },
        borderDashes: [5, 5]
      }
    };

    // Gender-based shape modifications
    const genderModifications = {
      male: { shape: 'box' },
      female: { shape: 'ellipse' },
      other: { shape: 'diamond' }
    };

    return {
      ...baseStyle,
      ...categoryStyles[category],
      ...genderModifications[gender] || genderModifications.other
    };
  }

  /**
   * Get edge styling based on relationship type
   * @private
   */
  _getEdgeStyle(edgeType, relationship) {
    const baseStyle = {
      width: 2,
      font: { size: 10, align: 'middle' }
    };

    const edgeStyles = {
      'parent-child': {
        color: { color: '#333', highlight: '#666' },
        width: 3
      },
      'spouse': {
        color: { color: '#E91E63', highlight: '#AD1457' },
        width: 4,
        dashes: false
      },
      'sibling': {
        color: { color: '#9C27B0', highlight: '#7B1FA2' },
        width: 2
      },
      'extended': {
        color: { color: '#607D8B', highlight: '#455A64' },
        width: 1,
        dashes: [5, 5]
      },
      'inlaw': {
        color: { color: '#795548', highlight: '#5D4037' },
        width: 2,
        dashes: [10, 5]
      }
    };

    return {
      ...baseStyle,
      ...edgeStyles[edgeType] || edgeStyles.extended
    };
  }

  /**
   * Get edge arrows configuration
   * @private
   */
  _getEdgeArrows(edgeType, relationship) {
    // Most family relationships are bidirectional, but some have direction
    const directionalRelationships = ['father', 'mother', 'son', 'daughter'];
    
    if (directionalRelationships.includes(relationship.toLowerCase())) {
      return { to: { enabled: true, scaleFactor: 0.8 } };
    }
    
    return { to: { enabled: false }, from: { enabled: false } };
  }

  /**
   * Create tooltip content for nodes
   * @private
   */
  _createNodeTooltip(user, category, level) {
    const age = user.dateOfBirth ? this._calculateAge(user.dateOfBirth) : 'Unknown';
    const status = this._checkUserOnlineStatus(user.id) ? '🟢 Online' : '🔴 Offline';
    
    return `
      <div style="padding: 8px;">
        <strong>${user.firstName} ${user.lastName}</strong><br>
        <em>${category} (Level ${level})</em><br>
        Age: ${age}<br>
        Gender: ${user.gender}<br>
        Location: ${user.location || 'Not specified'}<br>
        Status: ${status}
        ${user.hasMedication ? '<br>📋 Has medication reminders' : ''}
      </div>
    `;
  }

  /**
   * Process in-law family tree
   * @private
   */
  _processInLawTree(inLawTree, nodes, edges, processedUsers, options) {
    // Add in-law family members with special styling
    const processInLawMember = (member, category) => {
      if (!processedUsers.has(member.user.id)) {
        nodes.push({
          ...this._createUserNode(member.user, 'inlaw', member.level),
          inLawContext: true
        });
        processedUsers.add(member.user.id);
      }
    };

    // Process in-law ancestors
    inLawTree.ancestors?.forEach(ancestor => {
      processInLawMember(ancestor, 'inlaw');
    });

    // Process in-law descendants
    inLawTree.descendants?.forEach(descendant => {
      processInLawMember(descendant, 'inlaw');
    });

    // Process in-law adjacent
    inLawTree.adjacent?.forEach(adjacent => {
      processInLawMember(adjacent, 'inlaw');
    });

    // Add connections within in-law family
    // This would require additional logic to connect in-law family members
  }

  /**
   * Helper methods
   * @private
   */
  _calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  _checkUserOnlineStatus(userId) {
    // This would integrate with your real-time system
    // For now, return random status for demo
    return Math.random() > 0.5;
  }

  _findDirectConnection(user, centerUserId, familyTree) {
    // Logic to find the direct connection path
    // This is a simplified version - you'd implement proper path finding
    return centerUserId;
  }

  _findParentConnection(user, centerUserId, familyTree) {
    return user.fatherId || user.motherId || centerUserId;
  }

  _getParentChildRelationship(gender, isChild = false) {
    if (isChild) {
      return gender === 'male' ? 'son' : gender === 'female' ? 'daughter' : 'child';
    }
    return gender === 'male' ? 'father' : gender === 'female' ? 'mother' : 'parent';
  }

  _getEdgeType(relationship) {
    const spouseRelationships = ['husband', 'wife', 'partner'];
    const siblingRelationships = ['brother', 'sister', 'half-brother', 'half-sister'];
    
    if (spouseRelationships.includes(relationship)) return 'spouse';
    if (siblingRelationships.includes(relationship)) return 'sibling';
    return 'extended';
  }

  /**
   * Find connection paths between two users
   * @private
   */
  async _findConnectionPaths(userId, targetUserId, userTree, targetTree) {
    // Implement path-finding algorithm
    // This is a placeholder for the actual implementation
    return [];
  }

  /**
   * Transform connection paths to graph format
   * @private
   */
  async _transformPathsToGraph(paths, userId, targetUserId) {
    // Transform paths to nodes and edges
    return { nodes: [], edges: [] };
  }
}

module.exports = new GraphService();