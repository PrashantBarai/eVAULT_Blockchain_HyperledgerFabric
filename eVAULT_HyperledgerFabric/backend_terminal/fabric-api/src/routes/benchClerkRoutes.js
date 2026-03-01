const express = require('express');
const benchClerkController = require('../controllers/benchClerkController');

const router = express.Router();

/**
 * @route   GET /api/benchclerk/cases/pending
 * @desc    Get pending cases from benchclerk namespace
 */
router.get('/cases/pending', benchClerkController.getPendingCases);

/**
 * @route   GET /api/benchclerk/case/:caseID
 * @desc    Get case by ID from benchclerk namespace
 */
router.get('/case/:caseID', benchClerkController.getCaseById);

/**
 * @route   GET /api/benchclerk/judges
 * @desc    Get all judges
 */
router.get('/judges', benchClerkController.getAllJudges);

/**
 * @route   GET /api/benchclerk/stats
 * @desc    Get case statistics
 */
router.get('/stats', benchClerkController.queryStats);

/**
 * @route   POST /api/benchclerk/case/forward-to-judge-and-sync
 * @desc    Forward case to judge (namespace-aware cross-channel)
 */
router.post('/case/forward-to-judge-and-sync', benchClerkController.forwardToJudgeAndSync);

/**
 * @route   GET /api/benchclerk/cases/judged
 * @desc    Get judged cases from benchclerk-judge-channel
 */
router.get('/cases/judged', benchClerkController.getJudgedCases);

/**
 * @route   GET /api/benchclerk/case/judge-channel/:caseID
 * @desc    Get case from benchclerk-judge-channel
 */
router.get('/case/judge-channel/:caseID', benchClerkController.getCaseFromJudgeChannel);

/**
 * @route   POST /api/benchclerk/case/confirm-decision
 * @desc    Confirm judge decision and forward to lawyer (namespace-aware)
 */
router.post('/case/confirm-decision', benchClerkController.confirmDecisionAndForwardToLawyer);

module.exports = router;
