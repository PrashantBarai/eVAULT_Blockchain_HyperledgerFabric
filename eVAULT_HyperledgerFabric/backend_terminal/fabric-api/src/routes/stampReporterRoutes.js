const express = require('express');
const stampReporterController = require('../controllers/stampReporterController');

const router = express.Router();

/**
 * @route   GET /api/stampreporter/cases/pending
 * @desc    Get pending cases
 * @access  Public
 */
router.get('/cases/pending', stampReporterController.getPendingCases);

/**
 * @route   GET /api/stampreporter/cases/rejected
 * @desc    Get rejected cases
 * @access  Public
 */
router.get('/cases/rejected', stampReporterController.getRejectedCases);

/**
 * @route   GET /api/stampreporter/cases/onhold
 * @desc    Get on hold cases
 * @access  Public
 */
router.get('/cases/onhold', stampReporterController.getOnHoldCases);

/**
 * @route   GET /api/stampreporter/case/:caseID
 * @desc    Get case by ID
 * @access  Public
 */
router.get('/case/:caseID', stampReporterController.getCaseById);

/**
 * @route   POST /api/stampreporter/case/validate
 * @desc    Validate documents for a case
 * @access  Public
 */
router.post('/case/validate', stampReporterController.validateDocuments);

/**
 * @route   POST /api/stampreporter/case/forward-to-benchclerk
 * @desc    Forward case to bench clerk
 * @access  Public
 */
router.post('/case/forward-to-benchclerk', stampReporterController.forwardCaseToBenchClerk);

/**
 * @route   POST /api/stampreporter/case/forward-to-lawyer
 * @desc    Forward case to lawyer
 * @access  Public
 */
router.post('/case/forward-to-lawyer', stampReporterController.forwardCaseToLawyer);

/**
 * @route   POST /api/stampreporter/case/fetch-from-registrar
 * @desc    Fetch and store case from registrar channel
 * @access  Public
 */
router.post('/case/fetch-from-registrar', stampReporterController.fetchFromRegistrarChannel);

/**
 * @route   POST /api/stampreporter/case/sync-across-channels
 * @desc    Sync case across channels
 * @access  Public
 */
router.post('/case/sync-across-channels', stampReporterController.syncCaseAcrossChannels);

/**
 * @route   POST /api/stampreporter/cases/fetch-all-pending
 * @desc    Get all pending cases from registrar
 * @access  Public
 */
router.post('/cases/fetch-all-pending', stampReporterController.getAllPendingCasesFromRegistrar);

/**
 * @route   GET /api/stampreporter/stats
 * @desc    Get case statistics
 * @access  Public
 */
router.get('/stats', stampReporterController.queryStats);

module.exports = router;
