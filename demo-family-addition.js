/**
 * Demo script to showcase comprehensive family member addition functionality
 * This script demonstrates how the logged-in user can add any type of relative
 */

const readline = require('readline');

// Mock family service for demonstration
const familyService = require('./src/services/familyService');

// Demo relationship types that a user can add
const demoRelationshipTypes = {
  'Direct Family': [
    'father', 'mother', 'son', 'daughter', 'husband', 'wife', 'partner'
  ],
  'Siblings': [
    'brother', 'sister', 'stepbrother', 'stepsister', 'half-brother', 'half-sister'
  ],
  'Grandparents': [
    'grandfather', 'grandmother', 'step-grandfather', 'step-grandmother'
  ],
  'Grandchildren': [
    'grandson', 'granddaughter', 'step-grandson', 'step-granddaughter'
  ],
  'Aunts & Uncles': [
    'uncle', 'aunt', 'great-uncle', 'great-aunt'
  ],
  'Cousins': [
    'cousin', 'second-cousin', 'third-cousin', 'cousin-once-removed'
  ],
  'In-Laws': [
    'father-in-law', 'mother-in-law', 'son-in-law', 'daughter-in-law',
    'brother-in-law', 'sister-in-law'
  ],
  'Nieces & Nephews': [
    'nephew', 'niece', 'grand-nephew', 'grand-niece'
  ]
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🌳 Family Tree - Comprehensive Relative Addition Demo');
console.log('='.repeat(55));
console.log('');
console.log('This demo shows how a logged-in user can add ANY type of relative to their family tree.');
console.log('');

// Function to display available relationship categories
function displayRelationshipCategories() {
  console.log('📋 Available Relationship Categories:');
  console.log('');
  
  Object.keys(demoRelationshipTypes).forEach((category, index) => {
    console.log(`${index + 1}. ${category}`);
    console.log(`   Types: ${demoRelationshipTypes[category].join(', ')}`);
    console.log('');
  });
}

// Function to simulate adding a family member
function simulateAddFamilyMember(relationshipType, memberName) {
  console.log(`✅ Successfully added ${memberName} as your ${relationshipType}!`);
  console.log(`🔗 Automatic relationships created:`);
  
  // Simulate the automatic relationship creation
  switch(relationshipType) {
    case 'father':
      console.log(`   - You are now ${memberName}'s child`);
      console.log(`   - If you have siblings, they are now ${memberName}'s children too`);
      console.log(`   - If you have a mother, she is now ${memberName}'s wife/partner`);
      break;
    case 'uncle':
      console.log(`   - ${memberName} is now your father's or mother's brother`);
      console.log(`   - If you have siblings, ${memberName} is their uncle too`);
      break;
    case 'cousin':
      console.log(`   - ${memberName} is now the child of your aunt or uncle`);
      console.log(`   - You are now ${memberName}'s cousin`);
      break;
    case 'daughter':
      console.log(`   - You are now ${memberName}'s parent`);
      console.log(`   - If you have a spouse, they are now ${memberName}'s parent too`);
      break;
    default:
      console.log(`   - Reciprocal relationship established`);
  }
  console.log('');
}

// Interactive demo function
async function runDemo() {
  console.log('👤 You are logged in as: John Smith');
  console.log('');
  
  displayRelationshipCategories();
  
  const askForInput = () => {
    rl.question('Enter a relationship type you want to add (or "quit" to exit): ', (relationshipType) => {
      if (relationshipType.toLowerCase() === 'quit') {
        console.log('');
        console.log('🎉 Demo completed! Your family tree now supports comprehensive relationship types.');
        console.log('');
        console.log('🔧 Technical Implementation:');
        console.log('- 100+ relationship types supported');
        console.log('- Automatic reciprocal relationship creation');
        console.log('- Smart validation and conflict resolution');
        console.log('- Multi-step UI for easy family member addition');
        console.log('- Bulk addition support for multiple members');
        console.log('');
        rl.close();
        return;
      }
      
      // Check if relationship type is valid
      const allTypes = Object.values(demoRelationshipTypes).flat();
      if (!allTypes.includes(relationshipType.toLowerCase())) {
        console.log(`❌ "${relationshipType}" is not a recognized relationship type.`);
        console.log('Please choose from the available types listed above.');
        console.log('');
        askForInput();
        return;
      }
      
      rl.question(`Enter the name of your ${relationshipType}: `, (memberName) => {
        console.log('');
        simulateAddFamilyMember(relationshipType, memberName);
        
        rl.question('Would you like to add another family member? (y/n): ', (answer) => {
          console.log('');
          if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            askForInput();
          } else {
            console.log('🎉 Demo completed! Thank you for trying the comprehensive family member addition feature.');
            console.log('');
            rl.close();
          }
        });
      });
    });
  };
  
  askForInput();
}

// Start the demo
console.log('🚀 Starting interactive demo...');
console.log('');
runDemo();
