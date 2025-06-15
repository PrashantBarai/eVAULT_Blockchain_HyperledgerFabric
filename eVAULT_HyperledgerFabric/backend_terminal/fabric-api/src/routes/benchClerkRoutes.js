const express = require('express');
const benchClerkController = require('../controllers/benchClerkController');

const router = express.Router();

/**
 * @route   POST /api/benchclerk/case/forward-to-judge
 * @desc    Forward case to judge
 * @access  Public
 */
router.post('/case/forward-to-judge', benchClerkController.forwardToJudge);

/**
 * @route   PUT /api/benchclerk/case/update-hearing
 * @desc    Update hearing details
 * @access  Public
 */
router.put('/case/update-hearing', benchClerkController.updateHearingDetails);

/**
 * @route   POST /api/benchclerk/case/notify-lawyer
 * @desc    Notify lawyer
 * @access  Public
 */
router.post('/case/notify-lawyer', benchClerkController.notifyLawyer);

/**
 * @route   GET /api/benchclerk/case/details/:caseID
 * @desc    Get case details
 * @access  Public
 */
router.get('/case/details/:caseID', benchClerkController.getCaseDetails);

/**
 * @route   GET /api/benchclerk/case/:caseID
 * @desc    Get case by ID
 * @access  Public
 */
router.get('/case/:caseID', benchClerkController.getCaseById);

/**
 * @route   POST /api/benchclerk/case/store
 * @desc    Store case
 * @access  Public
 */
router.post('/case/store', benchClerkController.storeCase);

/**
 * @route   POST /api/benchclerk/case/fetch-from-stampreporter
 * @desc    Fetch and store case from stamp reporter channel
 * @access  Public
 */
router.post('/case/fetch-from-stampreporter', benchClerkController.fetchFromStampReporterChannel);

/**
 * @route   POST /api/benchclerk/cases/fetch-from-judge
 * @desc    Fetch and store cases from judge channel
 * @access  Public
 */
router.post('/cases/fetch-from-judge', benchClerkController.fetchFromJudgeChannel);

/**
 * @route   GET /api/benchclerk/stats
 * @desc    Get case statistics
 * @access  Public
 */
router.get('/stats', benchClerkController.queryStats);

module.exports = router;
