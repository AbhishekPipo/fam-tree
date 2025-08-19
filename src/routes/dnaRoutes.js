const express = require('express');
const DNAService = require('../services/dnaService');
const { authenticateToken } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/dna/{personId}:
 *   post:
 *     summary: Add DNA data for a person
 *     tags: [DNA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personId
 *         required: true
 *         schema:
 *           type: string
 *         description: Person ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testingCompany
 *               - testDate
 *             properties:
 *               testingCompany:
 *                 type: string
 *                 enum: [23andMe, AncestryDNA, MyHeritage, FamilyTreeDNA, LivingDNA]
 *               testDate:
 *                 type: string
 *                 format: date
 *               rawDataFile:
 *                 type: string
 *               haplogroups:
 *                 type: object
 *               ethnicityEstimate:
 *                 type: object
 *               healthReports:
 *                 type: object
 *               traits:
 *                 type: object
 *     responses:
 *       201:
 *         description: DNA data added successfully
 */
router.post('/:personId', async (req, res, next) => {
  try {
    const { personId } = req.params;
    const dnaData = req.body;
    
    const result = await DNAService.addDNAData(personId, dnaData);
    
    res.status(201).json({
      success: true,
      message: 'DNA data added successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/dna/{personId}:
 *   get:
 *     summary: Get DNA data for a person
 *     tags: [DNA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personId
 *         required: true
 *         schema:
 *           type: string
 *         description: Person ID
 *     responses:
 *       200:
 *         description: DNA data retrieved successfully
 *       404:
 *         description: No DNA data found
 */
router.get('/:personId', async (req, res, next) => {
  try {
    const { personId } = req.params;
    
    const dnaData = await DNAService.getDNAData(personId);
    
    if (!dnaData) {
      throw new AppError('No DNA data found for this person', 404, 'DNA_DATA_NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: dnaData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/dna/{personId}/matches:
 *   get:
 *     summary: Find DNA matches for a person
 *     tags: [DNA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personId
 *         required: true
 *         schema:
 *           type: string
 *         description: Person ID
 *       - in: query
 *         name: minSharedCM
 *         schema:
 *           type: number
 *           minimum: 1
 *           default: 7
 *         description: Minimum shared centimorgans
 *     responses:
 *       200:
 *         description: DNA matches found
 */
router.get('/:personId/matches', async (req, res, next) => {
  try {
    const { personId } = req.params;
    const { minSharedCM = 7 } = req.query;
    
    const matches = await DNAService.findDNAMatches(personId, parseFloat(minSharedCM));
    
    res.json({
      success: true,
      data: {
        personId,
        minSharedCM: parseFloat(minSharedCM),
        matches
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/dna/matches:
 *   post:
 *     summary: Add DNA match relationship between two persons
 *     tags: [DNA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - person1Id
 *               - person2Id
 *               - sharedCM
 *             properties:
 *               person1Id:
 *                 type: string
 *               person2Id:
 *                 type: string
 *               sharedCM:
 *                 type: number
 *                 minimum: 0
 *               sharedSegments:
 *                 type: integer
 *                 minimum: 0
 *               longestSegment:
 *                 type: number
 *                 minimum: 0
 *               estimatedRelationship:
 *                 type: string
 *               confidence:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *               testingCompany:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: DNA match added successfully
 */
router.post('/matches', async (req, res, next) => {
  try {
    const { person1Id, person2Id, ...matchData } = req.body;
    
    if (!person1Id || !person2Id) {
      throw new AppError('Both person1Id and person2Id are required', 400, 'MISSING_PERSON_IDS');
    }
    
    if (person1Id === person2Id) {
      throw new AppError('Cannot create DNA match with the same person', 400, 'SAME_PERSON_MATCH');
    }
    
    const result = await DNAService.addDNAMatch(person1Id, person2Id, matchData);
    
    res.status(201).json({
      success: true,
      message: 'DNA match added successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/dna/{personId}/analysis:
 *   get:
 *     summary: Analyze DNA matches for a person
 *     tags: [DNA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personId
 *         required: true
 *         schema:
 *           type: string
 *         description: Person ID
 *     responses:
 *       200:
 *         description: DNA analysis results
 */
router.get('/:personId/analysis', async (req, res, next) => {
  try {
    const { personId } = req.params;
    
    const analysis = await DNAService.analyzeDNAMatches(personId);
    
    res.json({
      success: true,
      data: {
        personId,
        analysis
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/dna/{personId}/report:
 *   get:
 *     summary: Generate comprehensive DNA report for a person
 *     tags: [DNA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personId
 *         required: true
 *         schema:
 *           type: string
 *         description: Person ID
 *     responses:
 *       200:
 *         description: DNA report generated successfully
 *       404:
 *         description: No DNA data found
 */
router.get('/:personId/report', async (req, res, next) => {
  try {
    const { personId } = req.params;
    
    const report = await DNAService.generateDNAReport(personId);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/dna/predict-relationship:
 *   post:
 *     summary: Predict relationship based on shared cM
 *     tags: [DNA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sharedCM
 *             properties:
 *               sharedCM:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Relationship predictions
 */
router.post('/predict-relationship', async (req, res, next) => {
  try {
    const { sharedCM } = req.body;
    
    if (sharedCM === undefined || sharedCM < 0) {
      throw new AppError('Valid sharedCM value is required', 400, 'INVALID_SHARED_CM');
    }
    
    const predictions = DNAService.predictRelationship(parseFloat(sharedCM));
    
    res.json({
      success: true,
      data: {
        sharedCM: parseFloat(sharedCM),
        predictions
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/dna/import:
 *   post:
 *     summary: Import DNA data from file
 *     tags: [DNA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - personId
 *               - format
 *               - filePath
 *             properties:
 *               personId:
 *                 type: string
 *               format:
 *                 type: string
 *                 enum: [23andMe, AncestryDNA, MyHeritage, FamilyTreeDNA]
 *               filePath:
 *                 type: string
 *     responses:
 *       200:
 *         description: DNA data import initiated
 */
router.post('/import', uploadLimiter, async (req, res, next) => {
  try {
    const { personId, format, filePath } = req.body;
    
    if (!personId || !format || !filePath) {
      throw new AppError('personId, format, and filePath are required', 400, 'MISSING_IMPORT_DATA');
    }
    
    const result = await DNAService.importDNAData(personId, format, filePath);
    
    res.json({
      success: true,
      message: 'DNA data import initiated',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;