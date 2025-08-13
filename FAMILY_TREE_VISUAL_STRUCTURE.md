# Family Tree Visual Structure

## Current API Response Structure for Prashanth's Family Tree

Based on the fixed API response, here's how the family tree should be visually rendered:

## ASCII Tree Diagram

```
                    Grandfather (19)  ═══════════  Grandmother (20)
                           │                              │
                           └──────────────┬───────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
              Ramesh (1) ═══════ Mallika (2)            Suresh (9)
               Father              Mother                 Uncle
                    │                    │                    │
                    └──────────┬─────────┘                    │
                              │                              │
                              │                         ┌────┴────┐
                              │                         │         │
                         Prashanth (3) ═══════ Anjali (4)   Amit (21) Priya (22)
                             ME                Wife        Cousin    Cousin
                              │                              
                    ┌─────────┼─────────┐                    
                    │         │         │                    
              Vikash (15) ═══ Priya (16) │                    
               Brother        Sister-in-law                   
                    │                    │                    
               ┌────┴────┐               │                    
               │         │               │                    
          Karan (17) Rohit (18)    ┌────┴────┐               
           Nephew     Nephew       │         │               
                                Arjun (6) Simran (5)         
                                  Son    Daughter            
```

## Visual Layout Structure

### Level 2 (Grandparents)
```
┌─────────────┐    ┌─────────────┐
│ Grandfather │════│ Grandmother │
│   (Level 2) │    │   (Level 2) │
└─────────────┘    └─────────────┘
```

### Level 1 (Parents & Uncles)
```
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Ramesh  │══│ Mallika │  │ Suresh  │
│ Father  │  │ Mother  │  │ Uncle   │
│(Level 1)│  │(Level 1)│  │(Level 1)│
└─────────┘  └─────────┘  └─────────┘
                               │
                          ┌────┴────┐
                          │         │
                     ┌─────────┐ ┌─────────┐
                     │  Amit   │ │  Priya  │
                     │ Cousin  │ │ Cousin  │
                     │(Level 0)│ │(Level 0)│
                     └─────────┘ └─────────┘
```

### Level 0 (Current User & Siblings)
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Prashanth  │══│   Anjali    │  │   Vikash    │
│     ME      │  │    Wife     │  │   Brother   │
│  (Level 0)  │  │  (Level 0)  │  │  (Level 0)  │
└─────────────┘  └─────────────┘  └─────────────┘
                                         │
                                    ┌────┴────┐
                                    │         │
                               ┌─────────┐ ┌─────────┐
                               │  Karan  │ │  Rohit  │
                               │ Nephew  │ │ Nephew  │
                               │(Level-1)│ │(Level-1)│
                               └─────────┘ └─────────┘
```

### Level -1 (Children)
```
                    ┌─────────┐  ┌─────────┐
                    │  Arjun  │  │ Simran  │
                    │   Son   │  │Daughter │
                    │(Level-1)│  │(Level-1)│
                    └─────────┘  └─────────┘
```

## Frontend Implementation Guide

### 1. Tree Layout Algorithm
```javascript
// Pseudo-code for rendering the tree
function renderFamilyTree(data) {
  const { currentUser, ancestors, descendants, adjacent } = data;
  
  // Group by levels
  const levels = {
    2: ancestors.filter(a => a.level === 2),  // Grandparents
    1: ancestors.filter(a => a.level === 1),  // Parents & Uncles
    0: [currentUser, ...adjacent],            // Current level
    '-1': descendants.filter(d => d.level === -1), // Children
    '-2': descendants.filter(d => d.level === -2)  // Grandchildren
  };
  
  // Render each level with proper connections
  levels.forEach((levelMembers, level) => {
    renderLevel(levelMembers, level);
    
    // Handle children connections for extended family
    levelMembers.forEach(member => {
      if (member.children) {
        renderChildrenConnections(member, member.children);
      }
    });
  });
}
```

### 2. Connection Lines
- **Horizontal lines (═══)**: Marriage/spouse connections
- **Vertical lines (│)**: Parent-child connections  
- **Branch lines (┌┴┐)**: Multiple children connections
- **Dotted lines (┄┄┄)**: Extended family connections

### 3. Visual Hierarchy
```
Level 2: Grandparents Row
    ↓
Level 1: Parents & Uncles Row
    ↓ (with side branches for uncle's children)
Level 0: Current User & Siblings Row  
    ↓ (with side branches for sibling's children)
Level -1: Direct Children Row
    ↓
Level -2: Grandchildren Row
```

### 4. Key Visual Elements

#### Person Card
```
┌─────────────┐
│   Name      │
│ Relationship│
│   (Level)   │
│   Status    │ ← Online/Offline indicator
└─────────────┘
```

#### Marriage Connection
```
Person A ═══════ Person B
```

#### Parent-Child Connection
```
    Parent
       │
    ┌──┴──┐
    │     │
 Child1 Child2
```

#### Extended Family Branch
```
Uncle/Aunt
    │
┌───┴───┐
│       │
Cousin1 Cousin2
```

## Implementation Notes

1. **Responsive Design**: Tree should adapt to different screen sizes
2. **Interactive Elements**: Click to expand/collapse branches
3. **Visual Indicators**: 
   - Online status (green dot)
   - Deceased (gray out)
   - Lives with user (house icon)
   - Has medication (pill icon)
4. **Zoom/Pan**: For large family trees
5. **Search/Filter**: Highlight specific relationships

## CSS Grid/Flexbox Layout

```css
.family-tree {
  display: grid;
  grid-template-rows: repeat(5, auto);
  gap: 40px;
  justify-items: center;
}

.tree-level {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 60px;
}

.person-card {
  position: relative;
  width: 120px;
  height: 140px;
  border: 2px solid #ddd;
  border-radius: 8px;
  text-align: center;
}

.connection-line {
  position: absolute;
  background: #333;
}
```

This structure ensures that:
- ✅ Suresh's children (cousins) appear connected upstream to Suresh
- ✅ Vikash's children (nephews) appear connected upstream to Vikash  
- ✅ Direct descendants appear downstream from Prashanth
- ✅ Proper hierarchical relationships are maintained
- ✅ Extended family connections are clearly visible