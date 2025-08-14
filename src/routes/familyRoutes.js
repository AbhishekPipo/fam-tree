const express = require('express');
const familyController = require('../controllers/familyController');
const auth = require('../middleware/auth');

const router = express.Router();

// The auth middleware can be used to ensure the user is logged in,
// but the actual user ID for the tree is taken from the URL parameter.
router.get('/tree/:userId', auth, familyController.getFamilyTree);

module.exports = router;