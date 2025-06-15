const express = require('express');
const registrarController = require('../controllers/registrarController');

const router = express.Router();

/**
 * @route   GET /api/registrar/cases/pending
 * @desc    Get pending cases
 * @access  Public
 */
router.get('/cases/pending', registrarController.getPendingCases);

/**
 * @route   GET /api/registrar/cases/verified
 * @desc    Get verified cases
 * @access  Public
 */
router.get('/cases/verified', registrarController.getVerifiedCases);

/**
 * @route   GET /api/registrar/case/:caseID
 * @desc    Get case by ID
 * @access  Public
 */
router.get('/case/:caseID', registrarController.getCaseById);

/**
 * @route   POST /api/registrar/case/verify
 * @desc    Verify a case
 * @access  Public
 */
router.post('/case/verify', registrarController.verifyCase);

/**
 * @route   POST /api/registrar/case/assign
 * @desc    Assign case to stamp reporter
 * @access  Public
 */
router.post('/case/assign', registrarController.assignToStampReporter);

/**
 * @route   POST /api/registrar/case/receive
 * @desc    Receive a new case
 * @access  Public
 */
router.post('/case/receive', registrarController.receiveCase);

/**
 * @route   PUT /api/registrar/case/update
 * @desc    Update case details
 * @access  Public
 */
router.put('/case/update', registrarController.updateCase);

/**
 * @route   POST /api/registrar/case/fetch-from-lawyer
 * @desc    Fetch and store case from lawyer channel
 * @access  Public
 */
router.post('/case/fetch-from-lawyer', registrarController.fetchFromLawyerChannel);

/**
 * @route   GET /api/registrar/stats
 * @desc    Get case statistics
 * @access  Public
 */
router.get('/stats', registrarController.queryStats);

module.exports = router;
