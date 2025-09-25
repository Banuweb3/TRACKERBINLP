import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { BulkAnalysisSession } from '../models/BulkAnalysisSession.js';
import { BulkFileResult } from '../models/BulkFileResult.js';
import { reportGenerator } from '../services/reportGenerator.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Create new bulk analysis session
router.post('/sessions', authenticateToken, [
  body('sessionName')
    .notEmpty()
    .isLength({ max: 255 })
    .withMessage('Session name is required and must be less than 255 characters'),
  body('sourceLanguage')
    .notEmpty()
    .isLength({ max: 10 })
    .withMessage('Source language is required'),
  body('totalFiles')
    .isInt({ min: 1 })
    .withMessage('Total files must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { sessionName, sourceLanguage, totalFiles } = req.body;

    const session = await BulkAnalysisSession.create({
      userId: req.user.id,
      sessionName,
      sourceLanguage,
      totalFiles,
      status: 'processing'
    });

    res.status(201).json({
      message: 'Bulk analysis session created successfully',
      session: session.toJSON()
    });

  } catch (error) {
    console.error('Create bulk session error:', error);
    res.status(500).json({ error: 'Failed to create bulk analysis session' });
  }
});

// Store individual file result
router.post('/sessions/:sessionId/files', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const fileData = req.body;

    // Verify session belongs to user
    const session = await BulkAnalysisSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Bulk analysis session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create file result with minimal validation
    const fileResult = await BulkFileResult.create(sessionId, fileData);

    // Update session progress asynchronously for speed
    session.updateProgress().catch(err => console.error('Progress update error:', err));

    res.status(201).json({
      message: 'File result stored successfully',
      fileResult: fileResult.toJSON()
    });

  } catch (error) {
    console.error('Store file result error:', error);
    console.error('Request data:', JSON.stringify(req.body, null, 2));
    console.error('Session ID:', sessionId);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({ 
      error: 'Failed to store file result',
      details: error.message,
      sessionId: sessionId,
      fileName: req.body.fileName || 'unknown'
    });
  }
});

// Update bulk session summary
router.put('/sessions/:sessionId/summary', authenticateToken, [
  body('batchSummary').optional().isString(),
  body('keyInsights').optional().isObject(),
  body('topKeywords').optional().isArray(),
  body('recommendations').optional().isString(),
  body('avgOverallScore').optional().isFloat({ min: 0, max: 10 }),
  body('avgCallOpeningScore').optional().isFloat({ min: 0, max: 10 }),
  body('avgCallClosingScore').optional().isFloat({ min: 0, max: 10 }),
  body('avgSpeakingQualityScore').optional().isFloat({ min: 0, max: 10 }),
  body('positiveSentimentCount').optional().isInt({ min: 0 }),
  body('neutralSentimentCount').optional().isInt({ min: 0 }),
  body('negativeSentimentCount').optional().isInt({ min: 0 }),
  body('positiveSentimentPercentage').optional().isFloat({ min: 0, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { sessionId } = req.params;
    const summaryData = req.body;

    const session = await BulkAnalysisSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Bulk analysis session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedSession = await session.updateSummary(summaryData);

    res.json({
      message: 'Bulk session summary updated successfully',
      session: updatedSession.toJSON()
    });

  } catch (error) {
    console.error('Update bulk summary error:', error);
    res.status(500).json({ error: 'Failed to update bulk session summary' });
  }
});

// Get user's bulk analysis sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const sessions = await BulkAnalysisSession.findByUserId(
      req.user.id,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      sessions: sessions.map(session => session.toJSON()),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: sessions.length
      }
    });

  } catch (error) {
    console.error('Get bulk sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch bulk analysis sessions' });
  }
});

// Get specific bulk analysis session with file results
router.get('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await BulkAnalysisSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Bulk analysis session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const sessionWithFiles = await session.getWithFiles();

    res.json({
      session: sessionWithFiles.toJSON()
    });

  } catch (error) {
    console.error('Get bulk session error:', error);
    res.status(500).json({ error: 'Failed to fetch bulk analysis session' });
  }
});

// Get file results for a bulk session
router.get('/sessions/:sessionId/files', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const session = await BulkAnalysisSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Bulk analysis session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const fileResults = await BulkFileResult.findBySessionId(
      sessionId,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      fileResults: fileResults.map(result => result.toJSON()),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: fileResults.length
      }
    });

  } catch (error) {
    console.error('Get file results error:', error);
    res.status(500).json({ error: 'Failed to fetch file results' });
  }
});

// Update file result status
router.put('/sessions/:sessionId/files/:fileId', authenticateToken, [
  body('status').optional().isIn(['pending', 'processing', 'completed', 'failed']),
  body('errorMessage').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { sessionId, fileId } = req.params;
    const updateData = req.body;

    // Verify session belongs to user
    const session = await BulkAnalysisSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Bulk analysis session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const fileResult = await BulkFileResult.findById(fileId);
    if (!fileResult || fileResult.bulkSessionId !== parseInt(sessionId)) {
      return res.status(404).json({ error: 'File result not found' });
    }

    const updatedFileResult = await fileResult.updateStatus(updateData);

    res.json({
      message: 'File result updated successfully',
      fileResult: updatedFileResult.toJSON()
    });

  } catch (error) {
    console.error('Update file result error:', error);
    res.status(500).json({ error: 'Failed to update file result' });
  }
});

// Delete bulk analysis session
router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await BulkAnalysisSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Bulk analysis session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await session.delete();

    res.json({ message: 'Bulk session deleted successfully' });

  } catch (error) {
    console.error('Delete bulk session error:', error);
    res.status(500).json({ error: 'Failed to delete bulk session' });
  }
});

// Get bulk analysis statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const stats = await BulkAnalysisSession.getUserStats(req.user.id, parseInt(days));

    res.json({
      stats: {
        ...stats,
        period: `${days} days`
      }
    });

  } catch (error) {
    console.error('Get bulk stats error:', error);
    res.status(500).json({ error: 'Failed to fetch bulk statistics' });
  }
});

// Export bulk analysis session as Excel
router.get('/sessions/:sessionId/export/excel', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await BulkAnalysisSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Bulk analysis session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const fileResults = await BulkFileResult.findBySessionId(sessionId);
    const { filePath, fileName } = await reportGenerator.generateExcelReport(session, fileResults);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      // Clean up the temporary file
      fs.unlinkSync(filePath);
    });

  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ error: 'Failed to generate Excel report' });
  }
});

// Export bulk analysis session as PDF
router.get('/sessions/:sessionId/export/pdf', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await BulkAnalysisSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Bulk analysis session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const fileResults = await BulkFileResult.findBySessionId(sessionId);
    const { filePath, fileName } = await reportGenerator.generatePDFReport(session, fileResults);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      // Clean up the temporary file
      fs.unlinkSync(filePath);
    });

  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

// Export bulk analysis session as ZIP (contains Excel, PDF, and text summary)
router.get('/sessions/:sessionId/export/zip', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { formats = 'excel,pdf' } = req.query;

    const session = await BulkAnalysisSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Bulk analysis session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const fileResults = await BulkFileResult.findBySessionId(sessionId);
    const formatArray = formats.split(',').map(f => f.trim());
    
    const { filePath, fileName } = await reportGenerator.generateZipArchive(session, fileResults, formatArray);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      // Clean up the temporary file
      fs.unlinkSync(filePath);
    });

  } catch (error) {
    console.error('Export ZIP error:', error);
    res.status(500).json({ error: 'Failed to generate ZIP archive' });
  }
});

// Get downloadable summary for bulk analysis
router.get('/sessions/:sessionId/summary/download', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await BulkAnalysisSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Bulk analysis session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const fileResults = await BulkFileResult.findBySessionId(sessionId);
    const textSummary = reportGenerator.generateTextSummary(session, fileResults);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="bulk_analysis_${sessionId}_summary.txt"`);
    res.send(textSummary);

  } catch (error) {
    console.error('Download summary error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// Export training data as JSON
router.get('/sessions/:sessionId/export/training-json', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await BulkAnalysisSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Bulk analysis session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const fileResults = await BulkFileResult.findBySessionId(sessionId);
    const { filePath, fileName } = await reportGenerator.generateTrainingDataExport(session, fileResults);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      fs.unlinkSync(filePath);
    });

  } catch (error) {
    console.error('Export training JSON error:', error);
    res.status(500).json({ error: 'Failed to generate training data JSON' });
  }
});

// Export training data as CSV
router.get('/sessions/:sessionId/export/training-csv', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await BulkAnalysisSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Bulk analysis session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const fileResults = await BulkFileResult.findBySessionId(sessionId);
    const { filePath, fileName } = await reportGenerator.generateTrainingDataCSV(session, fileResults);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      fs.unlinkSync(filePath);
    });

  } catch (error) {
    console.error('Export training CSV error:', error);
    res.status(500).json({ error: 'Failed to generate training data CSV' });
  }
});

// Export complete training package (JSON + CSV + metadata + README)
router.get('/sessions/:sessionId/export/training-package', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await BulkAnalysisSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Bulk analysis session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const fileResults = await BulkFileResult.findBySessionId(sessionId);
    const { filePath, fileName } = await reportGenerator.generateTrainingPackage(session, fileResults);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      fs.unlinkSync(filePath);
    });

  } catch (error) {
    console.error('Export training package error:', error);
    res.status(500).json({ error: 'Failed to generate training package' });
  }
});

export default router;
