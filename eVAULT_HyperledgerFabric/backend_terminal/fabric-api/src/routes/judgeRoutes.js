const express = require('express');
const judgeController = require('../controllers/judgeController');

const router = express.Router();

/**
 * @route   GET /api/judge/cases/pending
 * @desc    Get pending cases from benchclerk namespace
 */
router.get('/cases/pending', judgeController.getPendingCases);

/**
 * @route   POST /api/judge/case/accept
 * @desc    Fetch and accept case (copy from benchclerk to judge namespace)
 */
router.post('/case/accept', judgeController.fetchAndAcceptCase);

/**
 * @route   GET /api/judge/cases/active
 * @desc    Get active cases from judge namespace
 */
router.get('/cases/active', judgeController.getActiveCases);

/**
 * @route   GET /api/judge/case/:caseID
 * @desc    Get case by ID from judge namespace
 */
router.get('/case/:caseID', judgeController.getCaseById);

/**
 * @route   POST /api/judge/hearing/add-notes
 * @desc    Add hearing notes to case
 */
router.post('/hearing/add-notes', judgeController.addHearingNotes);

/**
 * @route   POST /api/judge/judgment/record-and-sync
 * @desc    Record judgment and sync to bench clerk + lawyer (namespace-aware)
 */
router.post('/judgment/record-and-sync', judgeController.recordJudgmentAndSync);

/**
 * @route   GET /api/judge/cases/judged
 * @desc    Get judged cases
 */
router.get('/cases/judged', judgeController.getJudgedCases);

/**
 * @route   GET /api/judge/stats
 * @desc    Get case statistics
 */
router.get('/stats', judgeController.queryStats);

module.exports = router;
