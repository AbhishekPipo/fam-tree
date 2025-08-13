# 🌳 Dynamic Family Tree Graph

A comprehensive graph-based visualization system for family relationships with interactive features and multiple layout options.

## 🚀 Features Implemented

### ✅ Backend Graph Service
- **Graph Data Transformation**: Converts family tree data into graph nodes and edges
- **Multiple Layout Support**: Hierarchical, Force-Directed, and Circular layouts
- **Relationship Categorization**: Ancestors, descendants, adjacent, and in-law relationships
- **Dynamic Node Styling**: Gender-based shapes, category-based colors, relationship levels
- **Interactive Edge Labels**: Relationship types with directional arrows
- **Statistics Generation**: Family tree metrics and analytics

### ✅ Graph API Endpoints
- `GET /api/graph/family-tree` - Get family tree in graph format
- `GET /api/graph/family-tree/:userId` - Get specific user's family tree
- `GET /api/graph/relationship-path/:targetUserId` - Find relationship paths
- `GET /api/graph/layouts` - Available layout options
- `GET /api/graph/statistics` - Family tree statistics

### ✅ Dynamic HTML Visualization
- **Interactive Graph**: Built with Vis.js for smooth interactions
- **Multiple Layouts**: Switch between hierarchical, force-directed, and circular
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Controls**: Zoom, pan, fit, center, and layout switching
- **Node Interactions**: Click, hover, and selection with detailed tooltips
- **Export Functionality**: Save graph as PNG image
- **Statistics Panel**: Live family tree metrics
- **Legend**: Visual guide for node types and relationships

### ✅ Authentication Integration
- **Secure Access**: JWT-based authentication for all graph endpoints
- **User Context**: Graphs centered on authenticated user
- **Login Interface**: Simple login page with demo users

## 🎨 Visual Features

### Node Styling
- **Center User**: Green circle (current user)
- **Ancestors**: Blue shapes (parents, grandparents)
- **Descendants**: Orange shapes (children, grandchildren)
- **Adjacent**: Purple shapes (spouses, siblings)
- **Extended Family**: Gray shapes (cousins, aunts, uncles)
- **In-Laws**: Brown dashed shapes (spouse's family)

### Gender Representation
- **Male**: Square/Box shapes
- **Female**: Circular/Ellipse shapes
- **Other**: Diamond shapes

### Relationship Edges
- **Parent-Child**: Solid thick lines with arrows
- **Spouse**: Thick pink lines
- **Sibling**: Purple lines
- **Extended**: Dashed gray lines
- **In-Law**: Dashed brown lines

## 🔧 Technical Architecture

### Backend Components
```
src/services/graphService.js     - Graph data transformation
src/routes/graphRoutes.js        - Graph API endpoints
src/middleware/auth.js           - Authentication middleware
```

### Frontend Components
```
dynamic_family_tree_graph.html   - Main graph visualization
login.html                       - Authentication interface
```

### Libraries Used
- **Vis.js**: Network graph visualization
- **D3.js**: Additional graph utilities (available)
- **Axios**: HTTP client for API calls

## 🚀 Usage Instructions

### 1. Start the Server
```bash
npm start
```
Server runs on: http://localhost:3000

### 2. Login
Visit: http://localhost:3000/login.html

**Demo Users:**
- prashanth@example.com / password123
- meera@example.com / password123
- amit@example.com / password123

### 3. View Graph
Visit: http://localhost:3000/dynamic_family_tree_graph.html

### 4. Interactive Controls

#### Layout Options
- **Hierarchical**: Traditional family tree with generations in levels
- **Force-Directed**: Physics-based layout grouping related members
- **Circular**: Circular layout with user at center

#### Graph Controls
- **Zoom In/Out**: + and - buttons
- **Fit to Screen**: Home button
- **Center on User**: Target button
- **Export**: Download as PNG

#### Filters
- **Depth**: 2-5 relationship levels
- **Include In-Laws**: Show spouse's family
- **Extended Family**: Show cousins, aunts, uncles

## 📊 Graph Statistics

The system provides real-time statistics:
- Total family members
- Number of relationships
- Generation count
- Online members
- Relationship type breakdown

## 🔗 API Examples

### Get Family Tree Graph
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:3000/api/graph/family-tree?layout=hierarchical&includeInLaws=true"
```

### Get Relationship Path
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:3000/api/graph/relationship-path/123"
```

### Get Graph Statistics
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:3000/api/graph/statistics"
```

## 🎯 Graph Data Format

### Node Structure
```json
{
  "id": 1,
  "label": "John Doe",
  "category": "center",
  "level": 0,
  "data": {
    "firstName": "John",
    "lastName": "Doe",
    "gender": "male",
    "isOnline": true
  },
  "style": {
    "color": { "background": "#4CAF50" },
    "shape": "box"
  }
}
```

### Edge Structure
```json
{
  "id": "1-2",
  "from": 1,
  "to": 2,
  "label": "father",
  "category": "parent-child",
  "style": {
    "color": { "color": "#333" },
    "width": 3
  }
}
```

## 🔮 Advanced Features

### Interactive Behaviors
- **Node Click**: Show detailed member information
- **Node Hover**: Highlight connected relationships
- **Edge Click**: Show relationship details
- **Multi-select**: Select multiple nodes for comparison

### Layout Algorithms
- **Hierarchical**: Uses directed graph with level separation
- **Force-Directed**: Physics simulation with attraction/repulsion
- **Circular**: Radial layout with distance-based positioning

### Performance Optimizations
- **Lazy Loading**: Load extended family on demand
- **Node Clustering**: Group distant relatives
- **Edge Bundling**: Combine similar relationships
- **Viewport Culling**: Render only visible nodes

## 🛠️ Customization Options

### Styling
- Modify colors in `_getNodeStyle()` and `_getEdgeStyle()`
- Adjust node sizes and shapes
- Customize relationship labels

### Layouts
- Add new layout algorithms
- Modify physics parameters
- Create custom positioning logic

### Data Sources
- Extend graph service for additional data
- Add external family tree imports
- Integrate with social media APIs

## 📱 Mobile Responsiveness

The graph interface is fully responsive:
- **Touch Controls**: Pinch to zoom, drag to pan
- **Mobile Layout**: Stacked controls and panels
- **Gesture Support**: Tap, double-tap, long-press
- **Adaptive UI**: Adjusts to screen size

## 🔐 Security Features

- **JWT Authentication**: Secure API access
- **User Context**: Only show authorized family data
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Sanitize all inputs

## 🚀 Next Steps

### Planned Enhancements
1. **Real-time Updates**: Live family tree changes
2. **Collaborative Editing**: Multiple users editing simultaneously
3. **Advanced Filtering**: Search, filter by attributes
4. **Timeline View**: Historical family changes
5. **3D Visualization**: Three-dimensional family trees
6. **AI Insights**: Relationship pattern analysis

### Integration Possibilities
- **Social Media**: Import from Facebook, LinkedIn
- **Genealogy Sites**: Ancestry.com, FamilySearch
- **Photo Integration**: Family photo galleries
- **Event Timeline**: Birth, marriage, death events
- **DNA Analysis**: Genetic relationship verification

## 📚 Documentation Links

- **API Documentation**: http://localhost:3000/api-docs
- **Graph Endpoints**: `/api/graph/*`
- **Authentication**: `/api/auth/*`
- **Family Management**: `/api/family/*`

---

**Built with ❤️ for dynamic family visualization**