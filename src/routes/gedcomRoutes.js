const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const GedcomService = require('../services/gedcomService');
const { authenticateToken } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Configure multer for GEDCOM file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/gedcom');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `gedcom-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept .ged and .gedcom files
  const allowedExtensions = ['.ged', '.gedcom'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new AppError('Only .ged and .gedcom files are allowed', 400, 'INVALID_FILE_TYPE'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  }
});

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/gedcom/import:
 *   post:
 *     summary: Import GEDCOM file
 *     tags: [GEDCOM]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: GEDCOM file (.ged or .gedcom)
 *               treeId:
 *                 type: string
 *                 description: Existing family tree ID (optional)
 *     responses:
 *       200:
 *         description: GEDCOM import completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     treeId:
 *                       type: string
 *                     personsImported:
 *                       type: integer
 *                     relationshipsImported:
 *                       type: integer
 *                     eventsImported:
 *                       type: integer
 *                     errors:
 *                       type: array
 *                     warnings:
 *                       type: array
 *       400:
 *         description: Invalid file or import error
 */
router.post('/import', uploadLimiter, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('GEDCOM file is required', 400, 'MISSING_FILE');
    }

    const { treeId } = req.body;
    const userId = req.user.id;
    const filePath = req.file.path;

    try {
      const importResults = await GedcomService.importGedcom(filePath, userId, treeId);

      // Clean up uploaded file
      await fs.unlink(filePath).catch(err => 
        console.warn('Failed to delete uploaded file:', err)
      );

      res.json({
        success: true,
        message: 'GEDCOM import completed',
        data: importResults
      });

    } catch (error) {
      // Clean up uploaded file on error
      await fs.unlink(filePath).catch(err => 
        console.warn('Failed to delete uploaded file:', err)
      );
      throw error;
    }

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/gedcom/export/{treeId}:
 *   get:
 *     summary: Export family tree to GEDCOM format
 *     tags: [GEDCOM]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: treeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Family tree ID
 *       - in: query
 *         name: download
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Whether to download as file
 *     responses:
 *       200:
 *         description: GEDCOM export successful
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     treeId:
 *                       type: string
 *                     gedcomContent:
 *                       type: string
 *       404:
 *         description: Family tree not found
 */
router.get('/export/:treeId', async (req, res, next) => {
  try {
    const { treeId } = req.params;
    const { download = 'true' } = req.query;
    const userId = req.user.id;

    const gedcomContent = await GedcomService.exportGedcom(treeId, userId);

    if (download === 'true') {
      // Send as downloadable file
      const filename = `family-tree-${treeId}-${Date.now()}.ged`;
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', Buffer.byteLength(gedcomContent, 'utf8'));
      
      res.send(gedcomContent);
    } else {
      // Send as JSON response
      res.json({
        success: true,
        data: {
          treeId,
          gedcomContent
        }
      });
    }

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/gedcom/validate:
 *   post:
 *     summary: Validate GEDCOM file without importing
 *     tags: [GEDCOM]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: GEDCOM file (.ged or .gedcom)
 *     responses:
 *       200:
 *         description: GEDCOM validation results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     isValid:
 *                       type: boolean
 *                     individuals:
 *                       type: integer
 *                     families:
 *                       type: integer
 *                     events:
 *                       type: integer
 *                     errors:
 *                       type: array
 *                     warnings:
 *                       type: array
 */
router.post('/validate', uploadLimiter, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('GEDCOM file is required', 400, 'MISSING_FILE');
    }

    const filePath = req.file.path;

    try {
      // Read and parse GEDCOM file
      const gedcomContent = await fs.readFile(filePath, 'utf-8');
      const parsedData = GedcomService.parseGedcom(gedcomContent);

      // Basic validation
      const validation = {
        isValid: true,
        individuals: parsedData.individuals.length,
        families: parsedData.families.length,
        events: parsedData.events.length,
        errors: [],
        warnings: []
      };

      // Check for common issues
      if (parsedData.individuals.length === 0) {
        validation.errors.push('No individuals found in GEDCOM file');
        validation.isValid = false;
      }

      // Check for individuals without names
      const individualsWithoutNames = parsedData.individuals.filter(ind => 
        !ind.data.NAME || ind.data.NAME.length === 0
      );
      
      if (individualsWithoutNames.length > 0) {
        validation.warnings.push(`${individualsWithoutNames.length} individuals without names`);
      }

      // Clean up uploaded file
      await fs.unlink(filePath).catch(err => 
        console.warn('Failed to delete uploaded file:', err)
      );

      res.json({
        success: true,
        data: validation
      });

    } catch (error) {
      // Clean up uploaded file on error
      await fs.unlink(filePath).catch(err => 
        console.warn('Failed to delete uploaded file:', err)
      );
      throw error;
    }

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/gedcom/preview:
 *   post:
 *     summary: Preview GEDCOM file contents before import
 *     tags: [GEDCOM]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: GEDCOM file (.ged or .gedcom)
 *               limit:
 *                 type: integer
 *                 default: 10
 *                 description: Number of individuals to preview
 *     responses:
 *       200:
 *         description: GEDCOM preview data
 */
router.post('/preview', uploadLimiter, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('GEDCOM file is required', 400, 'MISSING_FILE');
    }

    const { limit = 10 } = req.body;
    const filePath = req.file.path;

    try {
      // Read and parse GEDCOM file
      const gedcomContent = await fs.readFile(filePath, 'utf-8');
      const parsedData = GedcomService.parseGedcom(gedcomContent);

      // Convert sample individuals for preview
      const previewIndividuals = parsedData.individuals
        .slice(0, parseInt(limit))
        .map(individual => {
          try {
            return GedcomService.convertGedcomIndividual(individual);
          } catch (error) {
            return {
              error: `Failed to convert individual ${individual.id}: ${error.message}`
            };
          }
        });

      // Clean up uploaded file
      await fs.unlink(filePath).catch(err => 
        console.warn('Failed to delete uploaded file:', err)
      );

      res.json({
        success: true,
        data: {
          totalIndividuals: parsedData.individuals.length,
          totalFamilies: parsedData.families.length,
          totalEvents: parsedData.events.length,
          previewIndividuals,
          previewLimit: parseInt(limit)
        }
      });

    } catch (error) {
      // Clean up uploaded file on error
      await fs.unlink(filePath).catch(err => 
        console.warn('Failed to delete uploaded file:', err)
      );
      throw error;
    }

  } catch (error) {
    next(error);
  }
});

module.exports = router;