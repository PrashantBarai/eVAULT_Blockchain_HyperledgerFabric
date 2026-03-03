const { connectToNetwork, disconnectFromNetwork } = require('../fabric/network');
const config = require('../config/config');
const logger = require('../utils/logger');
const axios = require('axios');

const CLIENT_BACKEND_URL = 'http://localhost:3000';

/**
 * Controller for BenchClerk Contract functions
 * 
 * Channel topology:
 * - stampreporter-benchclerk-channel: Receives cases (benchclerk namespace)
 * - benchclerk-judge-channel: Forwards to judge / receives judgment
 * - benchclerk-lawyer-channel: Syncs status to lawyer
 */
const benchClerkController = {
    /**
     * Get pending cases from benchclerk namespace
     */
    getPendingCases: async (req, res) => {
        let gateway;
        try {
            const fabricConfig = config.fabric.benchclerk;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, fabricConfig.user,
                fabricConfig.channelName, fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetAllCases');
            const resultStr = result.toString();
            const cases = resultStr ? JSON.parse(resultStr) : [];
            const pendingCases = (cases || []).filter(c =>
                c.status === 'PENDING_BENCHCLERK_REVIEW' ||
                c.status === 'FORWARDED_TO_BENCHCLERK' ||
                (c.currentOrg === 'BenchClerksOrg' && !['FORWARDED_TO_JUDGE', 'PENDING_JUDGE_REVIEW', 'JUDGMENT_ISSUED', 'DECISION_CONFIRMED'].includes(c.status))
            );

            logger.info(`Retrieved ${pendingCases.length} pending cases for bench clerk`);
            return res.status(200).json({ success: true, data: pendingCases });
        } catch (error) {
            logger.error(`Error getting pending cases: ${error.message}`);
            return res.status(200).json({ success: true, data: [], message: 'No pending cases available' });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get case by ID from benchclerk namespace
     */
    getCaseById: async (req, res) => {
        const { caseID } = req.params;
        if (!caseID) return res.status(400).json({ error: 'Missing caseID parameter' });

        let gateway;
        try {
            const fabricConfig = config.fabric.benchclerk;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, fabricConfig.user,
                fabricConfig.channelName, fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetCaseById', caseID);
            const resultStr = result.toString();
            if (!resultStr) return res.status(404).json({ success: false, message: `Case not found: ${caseID}` });
            const caseData = JSON.parse(resultStr);
            return res.status(200).json({ success: true, data: caseData });
        } catch (error) {
            logger.error(`Error getting case by ID: ${error.message}`);
            return res.status(404).json({ success: false, message: `Case not found or unavailable: ${caseID}` });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get all judges
     */
    getAllJudges: async (req, res) => {
        let gateway;
        try {
            const fabricConfig = config.fabric.benchclerk;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, fabricConfig.user,
                fabricConfig.channelName, fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetAllJudges');
            const resultStr = result.toString();
            const judges = resultStr ? JSON.parse(resultStr) : [];
            return res.status(200).json({ success: true, data: judges });
        } catch (error) {
            logger.error(`Error getting judges: ${error.message}`);
            return res.status(200).json({ success: true, data: [], message: 'No judges available' });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get case statistics
     */
    queryStats: async (req, res) => {
        let gateway;
        try {
            const fabricConfig = config.fabric.benchclerk;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, fabricConfig.user,
                fabricConfig.channelName, fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('QueryStats');
            const resultStr = result.toString();
            const stats = resultStr ? JSON.parse(resultStr) : { totalCases: 0, pendingCases: 0, forwardedToJudge: 0, judgedCases: 0, confirmedCases: 0 };
            return res.status(200).json({ success: true, data: stats });
        } catch (error) {
            logger.error(`Error getting stats: ${error.message}`);
            return res.status(200).json({
                success: true,
                data: { totalCases: 0, pendingCases: 0, forwardedToJudge: 0, judgedCases: 0, confirmedCases: 0 },
                message: 'Stats unavailable, returning defaults'
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * SEQUENTIAL: Forward case to judge (namespace-aware, cross-channel)
     *
     * 1. ForwardToJudge on stampreporter-benchclerk-channel (benchclerk namespace)
     * 2. Store on benchclerk-judge-channel via benchclerk chaincode
     *    (judge reads via FetchAndStoreCaseFromBenchClerkChannel)
     * 3. Sync to benchclerk-lawyer-channel via LAWYER chaincode (lawyer namespace)
     * 4. MongoDB update
     */
    forwardToJudgeAndSync: async (req, res) => {
        const { caseID, assignmentDetails } = req.body;
        if (!caseID || !assignmentDetails) {
            return res.status(400).json({ error: 'Missing caseID or assignmentDetails' });
        }

        let gateway1 = null, gateway2 = null, gateway3 = null;
        const MAX_RETRIES = 3;

        try {
            const fabricConfig = config.fabric.benchclerk;

            // STEP 1: ForwardToJudge on benchclerk namespace
            logger.info(`[Step 1/3] ForwardToJudge for case ${caseID}`);
            const conn1 = await connectToNetwork(
                fabricConfig.org, fabricConfig.user,
                fabricConfig.channelName, fabricConfig.chaincodeName
            );
            gateway1 = conn1.gateway;

            await conn1.contract.submitTransaction('ForwardToJudge', caseID, JSON.stringify(assignmentDetails));
            logger.info(`[Step 1/3] ✓ Case assigned to judge`);

            // Wait until the peer commits the transaction before fetching for cross-channel sync
            let caseData;
            for (let i = 0; i < 5; i++) {
                const caseResult = await conn1.contract.evaluateTransaction('GetCaseById', caseID);
                caseData = JSON.parse(caseResult.toString());
                if (caseData.status === 'PENDING_JUDGE_REVIEW') break;
                await new Promise(r => setTimeout(r, 1000));
            }

            await disconnectFromNetwork(gateway1);
            gateway1 = null;

            // STEP 2: Store on benchclerk-judge-channel via benchclerk chaincode
            const judgeChannelName = fabricConfig.judgeChannel || 'benchclerk-judge-channel';
            logger.info(`[Step 2/3] Storing on ${judgeChannelName} via benchclerk chaincode`);

            let step2Error = null;
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    if (gateway2) { await disconnectFromNetwork(gateway2); gateway2 = null; }
                    const conn2 = await connectToNetwork(
                        fabricConfig.org, fabricConfig.user,
                        judgeChannelName, fabricConfig.chaincodeName
                    );
                    gateway2 = conn2.gateway;
                    await conn2.contract.submitTransaction('StoreCase', JSON.stringify(caseData));
                    step2Error = null;
                    break;
                } catch (retryErr) {
                    step2Error = retryErr;
                    logger.warn(`[Step 2/3] Attempt ${attempt}/${MAX_RETRIES} failed: ${retryErr.message}`);
                    if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, attempt * 2000));
                }
            }
            if (step2Error) throw new Error(`Failed to store on judge channel: ${step2Error.message}`);
            logger.info(`[Step 2/3] ✓ Case stored on ${judgeChannelName}`);

            if (gateway2) { await disconnectFromNetwork(gateway2); gateway2 = null; }

            // STEP 3: Sync to lawyer namespace
            const lawyerChannelName = fabricConfig.lawyerChannel || 'benchclerk-lawyer-channel';
            logger.info(`[Step 3/3] Syncing to ${lawyerChannelName} via lawyer namespace`);

            const lawyerCaseData = { ...caseData };
            lawyerCaseData.status = 'FORWARDED_TO_JUDGE';
            lawyerCaseData.currentOrg = 'JudgesOrg';
            lawyerCaseData.lastModified = new Date().toISOString();

            let step3Error = null;
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    if (gateway3) { await disconnectFromNetwork(gateway3); gateway3 = null; }
                    const lawyerConfig = config.fabric.lawyer;
                    const conn3 = await connectToNetwork(
                        lawyerConfig.org, lawyerConfig.user,
                        lawyerChannelName, 'lawyer'
                    );
                    gateway3 = conn3.gateway;
                    await conn3.contract.submitTransaction('StoreCase', JSON.stringify(lawyerCaseData));
                    step3Error = null;
                    break;
                } catch (retryErr) {
                    step3Error = retryErr;
                    logger.warn(`[Step 3/3] Attempt ${attempt}/${MAX_RETRIES} failed: ${retryErr.message}`);
                    if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, attempt * 2000));
                }
            }
            if (step3Error) {
                logger.warn(`[Step 3/3] Failed to sync to lawyer: ${step3Error.message}`);
            } else {
                logger.info(`[Step 3/3] ✓ Synced to lawyer namespace`);
            }

            // MONGODB
            try {
                await axios.post(`${CLIENT_BACKEND_URL}/update-case-status`, {
                    caseID, status: 'FORWARDED_TO_JUDGE', currentOrg: 'JudgesOrg',
                    timeline: [{
                        status: 'FORWARDED_TO_JUDGE', organization: 'BenchClerksOrg',
                        timestamp: new Date().toISOString(),
                        comments: `Case forwarded to Judge ${assignmentDetails.judgeId || ''}`
                    }]
                });
            } catch (mongoError) {
                logger.warn(`MongoDB update failed: ${mongoError.message}`);
            }

            return res.status(200).json({
                success: true,
                message: `Case ${caseID} forwarded to judge successfully`,
                data: { caseID, status: 'FORWARDED_TO_JUDGE', assignedJudge: assignmentDetails.judgeId }
            });
        } catch (error) {
            logger.error(`Error in forwardToJudgeAndSync: ${error.message}`);
            return res.status(500).json({ success: false, message: `Failed to forward case to judge: ${error.message}` });
        } finally {
            if (gateway1) await disconnectFromNetwork(gateway1);
            if (gateway2) await disconnectFromNetwork(gateway2);
            if (gateway3) await disconnectFromNetwork(gateway3);
        }
    },

    /**
     * Get cases with JUDGMENT_ISSUED from benchclerk-judge-channel
     */
    getJudgedCases: async (req, res) => {
        let gateway;
        try {
            const fabricConfig = config.fabric.benchclerk;
            const judgeChannelName = fabricConfig.judgeChannel || 'benchclerk-judge-channel';
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, fabricConfig.user,
                judgeChannelName, fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('QueryCasesByStatus', 'JUDGMENT_ISSUED');
            const resultStr = result.toString();
            const cases = resultStr ? JSON.parse(resultStr) : [];
            logger.info(`Retrieved ${cases.length} judged cases`);
            return res.status(200).json({ success: true, data: cases });
        } catch (error) {
            logger.error(`Error getting judged cases: ${error.message}`);
            return res.status(200).json({ success: true, data: [], message: 'No judged cases available' });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get case by ID from benchclerk-judge-channel
     */
    getCaseFromJudgeChannel: async (req, res) => {
        const { caseID } = req.params;
        if (!caseID) return res.status(400).json({ error: 'Missing caseID' });

        let gateway;
        try {
            const fabricConfig = config.fabric.benchclerk;
            const judgeChannelName = fabricConfig.judgeChannel || 'benchclerk-judge-channel';
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, fabricConfig.user,
                judgeChannelName, fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetCaseById', caseID);
            const resultStr = result.toString();
            if (!resultStr) return res.status(404).json({ success: false, message: `Case not found: ${caseID}` });
            const caseData = JSON.parse(resultStr);
            return res.status(200).json({ success: true, data: caseData });
        } catch (error) {
            logger.error(`Error getting case from judge channel: ${error.message}`);
            return res.status(404).json({ success: false, message: `Case not found or unavailable: ${caseID}` });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * SEQUENTIAL: Confirm judge decision and forward to lawyer (namespace-aware)
     *
     * 1. ConfirmJudgeDecision on benchclerk-judge-channel (benchclerk namespace)
     * 2. Store on benchclerk-lawyer-channel via LAWYER chaincode (lawyer namespace)
     * 3. MongoDB update
     */
    confirmDecisionAndForwardToLawyer: async (req, res) => {
        const { caseID } = req.body;
        if (!caseID) return res.status(400).json({ error: 'Missing caseID' });

        let gateway1 = null, gateway2 = null;
        const MAX_RETRIES = 3;

        try {
            const fabricConfig = config.fabric.benchclerk;
            const judgeChannelName = fabricConfig.judgeChannel || 'benchclerk-judge-channel';

            // STEP 1: ConfirmJudgeDecision
            logger.info(`[Step 1/2] ConfirmJudgeDecision for case ${caseID}`);
            const conn1 = await connectToNetwork(
                fabricConfig.org, fabricConfig.user,
                judgeChannelName, fabricConfig.chaincodeName
            );
            gateway1 = conn1.gateway;

            await conn1.contract.submitTransaction('ConfirmJudgeDecision', caseID);
            logger.info(`[Step 1/2] ✓ Decision confirmed`);

            let caseData;
            for (let i = 0; i < 5; i++) {
                const caseResult = await conn1.contract.evaluateTransaction('GetCaseById', caseID);
                caseData = JSON.parse(caseResult.toString());
                if (caseData.status === 'DECISION_CONFIRMED') break;
                await new Promise(r => setTimeout(r, 1000));
            }
            await disconnectFromNetwork(gateway1);
            gateway1 = null;

            // STEP 2: Store on lawyer namespace
            const lawyerChannelName = fabricConfig.lawyerChannel || 'benchclerk-lawyer-channel';
            logger.info(`[Step 2/2] Storing on ${lawyerChannelName} via lawyer namespace`);

            let step2Error = null;
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    if (gateway2) { await disconnectFromNetwork(gateway2); gateway2 = null; }
                    const lawyerConfig = config.fabric.lawyer;
                    const conn2 = await connectToNetwork(
                        lawyerConfig.org, lawyerConfig.user,
                        lawyerChannelName, 'lawyer'
                    );
                    gateway2 = conn2.gateway;
                    await conn2.contract.submitTransaction('StoreCase', JSON.stringify(caseData));
                    step2Error = null;
                    break;
                } catch (retryErr) {
                    step2Error = retryErr;
                    logger.warn(`[Step 2/2] Attempt ${attempt}/${MAX_RETRIES} failed: ${retryErr.message}`);
                    if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, attempt * 2000));
                }
            }
            if (step2Error) {
                logger.warn(`[Step 2/2] Failed to sync to lawyer: ${step2Error.message}`);
            } else {
                logger.info(`[Step 2/2] ✓ Confirmed case synced to lawyer namespace`);
            }

            // MONGODB
            try {
                await axios.post(`${CLIENT_BACKEND_URL}/update-case-status`, {
                    caseID, status: 'DECISION_CONFIRMED', currentOrg: 'LawyersOrg',
                    timeline: [{
                        status: 'DECISION_CONFIRMED', organization: 'BenchClerksOrg',
                        timestamp: new Date().toISOString(),
                        comments: 'Judge decision confirmed and forwarded to lawyer'
                    }]
                });
            } catch (mongoError) {
                logger.warn(`MongoDB update failed: ${mongoError.message}`);
            }

            return res.status(200).json({
                success: true,
                message: `Case ${caseID} decision confirmed and forwarded to lawyer`,
                data: { caseID, status: 'DECISION_CONFIRMED' }
            });
        } catch (error) {
            logger.error(`Error confirming decision: ${error.message}`);
            return res.status(500).json({ success: false, message: `Failed to confirm decision: ${error.message}` });
        } finally {
            if (gateway1) await disconnectFromNetwork(gateway1);
            if (gateway2) await disconnectFromNetwork(gateway2);
        }
    }
};

module.exports = benchClerkController;
