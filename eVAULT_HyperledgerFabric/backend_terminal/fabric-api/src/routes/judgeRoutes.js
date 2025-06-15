const express = require('express');
const judgeController = require('../controllers/judgeController');

const router = express.Router();

/**
 * @route   POST /api/judge/judgment/record
 * @desc    Record judgment for a case
 * @access  Public
 */
router.post('/judgment/record', judgeController.recordJudgment);

/**
 * @route   POST /api/judge/hearing/add-notes
 * @desc    Add hearing notes to case
 * @access  Public
 */
router.post('/hearing/add-notes', judgeController.addHearingNotes);

/**
 * @route   POST /api/judge/case/store
 * @desc    Store a case
 * @access  Public
 */
router.post('/case/store', judgeController.storeCase);

/**
 * @route   GET /api/judge/case/:caseID
 * @desc    Get case by ID
 * @access  Public
 */
router.get('/case/:caseID', judgeController.getCaseById);

/**
 * @route   POST /api/judge/case/forward-to-benchclerk
 * @desc    Forward case to bench clerk
 * @access  Public
 */
router.post('/case/forward-to-benchclerk', judgeController.forwardCaseToBenchClerk);

/**
 * @route   POST /api/judge/case/fetch-from-benchclerk
 * @desc    Fetch and store case from bench clerk channel
 * @access  Public
 */
router.post('/case/fetch-from-benchclerk', judgeController.fetchFromBenchClerkChannel);

/**
 * @route   GET /api/judge/cases/judged
 * @desc    Get judged cases
 * @access  Public
 */
router.get('/cases/judged', judgeController.getJudgedCases);

/**
 * @route   GET /api/judge/stats
 * @desc    Get case statistics
 * @access  Public
 */
router.get('/stats', judgeController.queryStats);

module.exports = router;
