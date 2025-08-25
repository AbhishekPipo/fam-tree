/**
 * Demo: Relationship Dropdown API Usage
 * Shows how to use the new dropdown API for relationship selection
 */

// Example: Fetching relationship options for dropdown
console.log('🎯 Relationship Dropdown API Demo');
console.log('='.repeat(50));
console.log('');

// 1. First, get relationship options for dropdown
console.log('📋 Step 1: Get Relationship Options for Dropdown');
console.log('API Call: GET /api/family/relationship-dropdown');
console.log('');

// Example response structure
const dropdownResponse = {
  "success": true,
  "data": {
    "relationshipOptions": [
      {
        "id": "father",
        "label": "Father", 
        "category": "Parents",
        "description": "Biological or adoptive father",
        "level": 1,
        "subcategory": "blood"
      },
      {
        "id": "mother",
        "label": "Mother",
        "category": "Parents", 
        "description": "Biological or adoptive mother",
        "level": 1,
        "subcategory": "blood"
      },
      {
        "id": "uncle",
        "label": "Uncle",
        "category": "Aunts & Uncles",
        "description": "Parent's brother",
        "level": 1,
        "subcategory": "blood"
      },
      {
        "id": "daughter",
        "label": "Daughter",
        "category": "Children",
        "description": "Female child", 
        "level": -1,
        "subcategory": "blood"
      },
      {
        "id": "cousin",
        "label": "Cousin",
        "category": "Cousins",
        "description": "Child of aunt or uncle",
        "level": 0,
        "subcategory": "blood"
      }
      // ... 100+ more options
    ]
  }
};

console.log('✅ Sample Response:');
console.log(JSON.stringify(dropdownResponse, null, 2));
console.log('');

// 2. Show how to use in HTML dropdown
console.log('🎨 Step 2: HTML Dropdown Implementation');
console.log('');

const htmlExample = `
<select id="relationshipSelect" name="relationshipType" required>
  <option value="">Select Relationship Type</option>
  <optgroup label="Parents">
    <option value="father">Father - Biological or adoptive father</option>
    <option value="mother">Mother - Biological or adoptive mother</option>
    <option value="stepfather">Stepfather - Mother's husband (not biological father)</option>
  </optgroup>
  <optgroup label="Children">
    <option value="son">Son - Male child</option>
    <option value="daughter">Daughter - Female child</option>
    <option value="stepson">Stepson - Spouse's male child from previous relationship</option>
  </optgroup>
  <optgroup label="Aunts & Uncles">
    <option value="uncle">Uncle - Parent's brother</option>
    <option value="aunt">Aunt - Parent's sister</option>
  </optgroup>
  <!-- More categories... -->
</select>
`;

console.log(htmlExample);
console.log('');

// 3. Show JavaScript implementation
console.log('💻 Step 3: JavaScript Implementation');
console.log('');

const jsExample = `
// Fetch and populate dropdown
async function loadRelationshipDropdown() {
  try {
    const response = await fetch('/api/family/relationship-dropdown', {
      headers: {
        'Authorization': 'Bearer ' + authToken
      }
    });
    
    const data = await response.json();
    const options = data.data.relationshipOptions;
    
    // Group by category
    const grouped = {};
    options.forEach(option => {
      if (!grouped[option.category]) {
        grouped[option.category] = [];
      }
      grouped[option.category].push(option);
    });
    
    // Populate dropdown
    const select = document.getElementById('relationshipSelect');
    
    Object.keys(grouped).forEach(category => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = category;
      
      grouped[category].forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.id;  // Use ID for form submission
        optionElement.textContent = option.label + ' - ' + option.description;
        optgroup.appendChild(optionElement);
      });
      
      select.appendChild(optgroup);
    });
    
  } catch (error) {
    console.error('Error loading dropdown:', error);
  }
}
`;

console.log(jsExample);
console.log('');

// 4. Show how to use selected ID in member API
console.log('🎯 Step 4: Using Selected ID in Add Member API');
console.log('');

const memberPayloadExample = {
  // Required fields
  "firstName": "John",
  "lastName": "Smith", 
  "email": "john.smith@example.com",
  "relationshipType": "father",  // ← This ID comes from dropdown selection
  "gender": "male",
  
  // Optional fields
  "middleName": "Michael",
  "dateOfBirth": "1960-05-15",
  "location": "New York, USA"
};

console.log('📤 POST /api/family/member payload:');
console.log(JSON.stringify(memberPayloadExample, null, 2));
console.log('');

// 5. Complete workflow example
console.log('🔄 Complete Workflow:');
console.log('');
console.log('1. User visits add family member page');
console.log('2. Frontend calls GET /api/family/relationship-dropdown');
console.log('3. Populate dropdown with returned relationship options');
console.log('4. User selects relationship type (e.g., "father") from dropdown');
console.log('5. User fills out member details form');
console.log('6. Frontend sends POST /api/family/member with:');
console.log('   - relationshipType: "father" (from dropdown selection)');
console.log('   - firstName, lastName, email, gender (from form)');
console.log('   - Optional: middleName, dateOfBirth, location');
console.log('7. Backend creates family member and establishes relationships');
console.log('');

console.log('✅ Benefits of Dropdown API:');
console.log('- Standardized relationship type IDs');
console.log('- Categorized display for better UX');
console.log('- Descriptions for user guidance'); 
console.log('- Consistent with backend validation');
console.log('- Supports 100+ relationship types');
console.log('');

console.log('🎉 Demo Complete! Your dropdown API is ready for frontend integration.');
