const express = require('express');
const lawyerController = require('../controllers/lawyerController');

const router = express.Router();

/**
 * @route   POST /api/lawyer/case/create
 * @desc    Create a new case
 * @access  Public
 */
router.post('/case/create', lawyerController.createCase);

/**
 * @route   POST /api/lawyer/case/submit
 * @desc    Submit case to registrar
 * @access  Public
 */
router.post('/case/submit', lawyerController.submitToRegistrar);

/**
 * @route   GET /api/lawyer/case/:caseID
 * @desc    Get case by ID
 * @access  Public
 */
router.get('/case/:caseID', lawyerController.getCaseById);

/**
 * @route   PUT /api/lawyer/case/update
 * @desc    Update case details
 * @access  Public
 */
router.put('/case/update', lawyerController.updateCaseDetails);

/**
 * @route   GET /api/lawyer/cases/filter
 * @desc    Get cases by filter
 * @access  Public
 */
router.get('/cases/filter', lawyerController.getCasesByFilter);

/**
 * @route   POST /api/lawyer/case/add-document
 * @desc    Add document to case
 * @access  Public
 */
router.post('/case/add-document', lawyerController.addDocumentToCase);

/**
 * @route   GET /api/lawyer/decisions/confirmed
 * @desc    Get confirmed decisions
 * @access  Public
 */
router.get('/decisions/confirmed', lawyerController.getConfirmedDecisions);

/**
 * @route   GET /api/lawyer/judgment/:caseID
 * @desc    View judgment details
 * @access  Public
 */
router.get('/judgment/:caseID', lawyerController.viewJudgmentDetails);

/**
 * @route   GET /api/lawyer/cases/all
 * @desc    Get all cases
 * @access  Public
 */
router.get('/cases/all', lawyerController.getAllCases);

/**
 * @route   GET /api/lawyer/cases/by-lawyer/:lawyerID
 * @desc    Get cases by lawyer ID
 * @access  Public
 */
router.get('/cases/by-lawyer/:lawyerID', lawyerController.getCasesByLawyerID);

/**
 * @route   GET /api/lawyer/case/track/:caseID
 * @desc    Track case status
 * @access  Public
 */
router.get('/case/track/:caseID', lawyerController.trackCaseStatus);

/**
 * @route   GET /api/lawyer/stats
 * @desc    Get case statistics
 * @access  Public
 */
router.get('/stats', lawyerController.queryStats);

module.exports = router;
