const { connectToNetwork, disconnectFromNetwork } = require('../fabric/network');
const config = require('../config/config');
const logger = require('../utils/logger');
const axios = require('axios');

const CLIENT_BACKEND_URL = 'http://localhost:3000';

/**
 * Controller for Judge Contract functions
 * 
 * Channel topology:
 * - benchclerk-judge-channel: Receives cases from bench clerk (judge + benchclerk chaincodes)
 * 
 * Namespace pattern:
 * - Bench clerk stores cases via benchclerk chaincode (benchclerk namespace)
 * - Judge reads from benchclerk namespace, copies to judge namespace via FetchAndStoreCaseFromBenchClerkChannel
 * - After judgment, syncs back to benchclerk namespace and to lawyer namespace
 */
const judgeController = {
    /**
     * Get pending cases from BENCHCLERK namespace on benchclerk-judge-channel
     * These are cases stored by bench clerk that are awaiting judge review
     */
    getPendingCases: async (req, res) => {
        let gateway;
        try {
            const benchClerkConfig = config.fabric.benchclerk;
            const judgeConfig = config.fabric.judge;
            const judgeChannelName = judgeConfig.channelName; // benchclerk-judge-channel

            // Connect as BenchClerksOrg to read from benchclerk namespace
            const { contract, gateway: g } = await connectToNetwork(
                benchClerkConfig.org, benchClerkConfig.user,
                judgeChannelName, benchClerkConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetAllCases');
            const resultStr = result.toString();
            const cases = resultStr ? JSON.parse(resultStr) : [];
            const pendingCases = (cases || []).filter(c =>
                c.status === 'PENDING_JUDGE_REVIEW' ||
                c.status === 'FORWARDED_TO_JUDGE' ||
                (c.currentOrg === 'JudgesOrg' && !['JUDGMENT_ISSUED', 'RECEIVED_BY_JUDGE', 'DECISION_CONFIRMED'].includes(c.status))
            );

            logger.info(`Retrieved ${pendingCases.length} pending cases for judge from benchclerk namespace`);
            return res.status(200).json({ success: true, data: pendingCases });
        } catch (error) {
            logger.error(`Error getting pending cases: ${error.message}`);
            // Return empty array gracefully instead of 500 (no cases is not an error)
            return res.status(200).json({ success: true, data: [], message: 'No pending cases available' });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Fetch and accept a case: copies from benchclerk namespace to judge namespace
     * Uses FetchAndStoreCaseFromBenchClerkChannel (sets status RECEIVED_BY_JUDGE)
     * Then updates benchclerk namespace to reflect acceptance
     */
    fetchAndAcceptCase: async (req, res) => {
        const { caseID } = req.body;
        if (!caseID) return res.status(400).json({ error: 'Missing caseID' });

        let gateway1 = null, gateway2 = null;
        try {
            const judgeConfig = config.fabric.judge;
            const benchClerkConfig = config.fabric.benchclerk;

            // STEP 1: Copy case from benchclerk namespace to judge namespace
            logger.info(`[Step 1/2] FetchAndStoreCaseFromBenchClerkChannel for ${caseID}`);
            const conn1 = await connectToNetwork(
                judgeConfig.org, judgeConfig.user,
                judgeConfig.channelName, judgeConfig.chaincodeName
            );
            gateway1 = conn1.gateway;

            const result = await conn1.contract.submitTransaction('FetchAndStoreCaseFromBenchClerkChannel', caseID);
            const caseData = JSON.parse(result.toString());
            logger.info(`[Step 1/2] ✓ Case ${caseID} copied to judge namespace with status RECEIVED_BY_JUDGE`);
            await disconnectFromNetwork(gateway1);
            gateway1 = null;

            // STEP 2: Update benchclerk namespace to reflect acceptance
            logger.info(`[Step 2/2] Updating benchclerk namespace status to RECEIVED_BY_JUDGE`);
            const conn2 = await connectToNetwork(
                benchClerkConfig.org, benchClerkConfig.user,
                judgeConfig.channelName, benchClerkConfig.chaincodeName
            );
            gateway2 = conn2.gateway;

            const updatedForBenchClerk = { ...caseData, status: 'RECEIVED_BY_JUDGE', currentOrg: 'JudgesOrg' };
            await conn2.contract.submitTransaction('StoreCase', JSON.stringify(updatedForBenchClerk));
            logger.info(`[Step 2/2] ✓ Benchclerk namespace updated`);

            return res.status(200).json({
                success: true,
                message: `Case ${caseID} accepted by judge`,
                data: caseData
            });
        } catch (error) {
            logger.error(`Error accepting case: ${error.message}`);
            return res.status(500).json({ success: false, message: `Failed to accept case: ${error.message}` });
        } finally {
            if (gateway1) await disconnectFromNetwork(gateway1);
            if (gateway2) await disconnectFromNetwork(gateway2);
        }
    },

    /**
     * Get active cases from judge's own namespace (cases accepted by judge)
     */
    getActiveCases: async (req, res) => {
        let gateway;
        try {
            const judgeConfig = config.fabric.judge;
            const { contract, gateway: g } = await connectToNetwork(
                judgeConfig.org, judgeConfig.user,
                judgeConfig.channelName, judgeConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetAllCases');
            const resultStr = result.toString();
            const cases = resultStr ? JSON.parse(resultStr) : [];
            const activeCases = (cases || []).filter(c =>
                c.status === 'RECEIVED_BY_JUDGE' || c.status === 'PENDING_JUDGE_REVIEW'
            );

            logger.info(`Retrieved ${activeCases.length} active cases from judge namespace`);
            return res.status(200).json({ success: true, data: activeCases });
        } catch (error) {
            logger.error(`Error getting active cases: ${error.message}`);
            // Return empty array gracefully instead of 500
            return res.status(200).json({ success: true, data: [], message: 'No active cases available' });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get case by ID from judge namespace
     */
    getCaseById: async (req, res) => {
        const { caseID } = req.params;
        if (!caseID) return res.status(400).json({ error: 'Missing caseID parameter' });

        let gateway;
        try {
            const judgeConfig = config.fabric.judge;
            const { contract, gateway: g } = await connectToNetwork(
                judgeConfig.org, judgeConfig.user,
                judgeConfig.channelName, judgeConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetCaseById', caseID);
            const resultStr = result.toString();
            if (!resultStr) return res.status(404).json({ success: false, message: `Case not found: ${caseID}` });
            const caseData = JSON.parse(resultStr);
            return res.status(200).json({ success: true, data: caseData });
        } catch (error) {
            logger.error(`Error getting case by ID: ${error.message}`);
            // Return 404 for specific case lookup failures
            return res.status(404).json({ success: false, message: `Case not found or unavailable: ${caseID}` });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Add hearing notes to a case
     */
    addHearingNotes: async (req, res) => {
        const { caseID, hearingDetails } = req.body;
        if (!caseID || !hearingDetails) {
            return res.status(400).json({ error: 'Missing caseID or hearingDetails' });
        }

        let gateway;
        try {
            const judgeConfig = config.fabric.judge;
            const { contract, gateway: g } = await connectToNetwork(
                judgeConfig.org, judgeConfig.user,
                judgeConfig.channelName, judgeConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('AddHearingNotes', caseID, JSON.stringify(hearingDetails));
            logger.info(`Hearing notes added to case ${caseID}`);
            return res.status(200).json({ success: true, message: `Hearing notes added to case ${caseID}` });
        } catch (error) {
            logger.error(`Error adding hearing notes: ${error.message}`);
            return res.status(500).json({ success: false, message: `Failed to add hearing notes: ${error.message}` });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * SEQUENTIAL: Record judgment and sync to bench clerk + lawyer (namespace-aware)
     *
     * 1. RecordJudgment on judge namespace (sets JUDGMENT_ISSUED, currentOrg=BenchClerksOrg)
     * 2. Read updated case from judge namespace
     * 3. Store on benchclerk namespace (benchclerk-judge-channel/benchclerk)
     * 4. Sync to lawyer namespace (benchclerk-lawyer-channel/lawyer)
     * 5. MongoDB update
     */
    recordJudgmentAndSync: async (req, res) => {
        const { caseID, judgmentDetails } = req.body;
        if (!caseID || !judgmentDetails) {
            return res.status(400).json({ error: 'Missing caseID or judgmentDetails' });
        }

        let gateway1 = null, gateway2 = null, gateway3 = null;
        const MAX_RETRIES = 3;

        try {
            const judgeConfig = config.fabric.judge;
            const benchClerkConfig = config.fabric.benchclerk;

            // STEP 1: RecordJudgment on judge namespace
            logger.info(`[Step 1/4] RecordJudgment for case ${caseID}`);
            const conn1 = await connectToNetwork(
                judgeConfig.org, judgeConfig.user,
                judgeConfig.channelName, judgeConfig.chaincodeName
            );
            gateway1 = conn1.gateway;

            await conn1.contract.submitTransaction('RecordJudgment', caseID, JSON.stringify(judgmentDetails));
            logger.info(`[Step 1/4] ✓ Judgment recorded`);

            // STEP 2: Read updated case (wait for peer to commit)
            let caseData;
            for (let i = 0; i < 5; i++) {
                const caseResult = await conn1.contract.evaluateTransaction('GetCaseById', caseID);
                caseData = JSON.parse(caseResult.toString());
                if (caseData.status === 'JUDGMENT_ISSUED') break;
                await new Promise(r => setTimeout(r, 1000));
            }
            logger.info(`[Step 2/4] ✓ Updated case read from judge namespace`);
            await disconnectFromNetwork(gateway1);
            gateway1 = null;

            // STEP 3: Store on benchclerk namespace so bench clerk can see the judgment
            logger.info(`[Step 3/4] Storing judged case on benchclerk namespace`);
            let step3Error = null;
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    if (gateway2) { await disconnectFromNetwork(gateway2); gateway2 = null; }
                    const conn2 = await connectToNetwork(
                        benchClerkConfig.org, benchClerkConfig.user,
                        judgeConfig.channelName, benchClerkConfig.chaincodeName
                    );
                    gateway2 = conn2.gateway;
                    await conn2.contract.submitTransaction('StoreCase', JSON.stringify(caseData));
                    step3Error = null;
                    break;
                } catch (retryErr) {
                    step3Error = retryErr;
                    logger.warn(`[Step 3/4] Attempt ${attempt}/${MAX_RETRIES} failed: ${retryErr.message}`);
                    if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, attempt * 2000));
                }
            }
            if (step3Error) throw new Error(`Failed to store on benchclerk namespace: ${step3Error.message}`);
            logger.info(`[Step 3/4] ✓ Judged case stored on benchclerk namespace`);
            if (gateway2) { await disconnectFromNetwork(gateway2); gateway2 = null; }

            // STEP 4: Sync to lawyer namespace via benchclerk-lawyer-channel
            const lawyerChannelName = benchClerkConfig.lawyerChannel || 'benchclerk-lawyer-channel';
            logger.info(`[Step 4/4] Syncing judgment to ${lawyerChannelName} via lawyer namespace`);

            const lawyerCaseData = { ...caseData };
            lawyerCaseData.lastModified = new Date().toISOString();

            let step4Error = null;
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
                    step4Error = null;
                    break;
                } catch (retryErr) {
                    step4Error = retryErr;
                    logger.warn(`[Step 4/4] Attempt ${attempt}/${MAX_RETRIES} failed: ${retryErr.message}`);
                    if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, attempt * 2000));
                }
            }
            if (step4Error) {
                logger.warn(`[Step 4/4] Failed to sync to lawyer: ${step4Error.message}`);
            } else {
                logger.info(`[Step 4/4] ✓ Judgment synced to lawyer namespace`);
            }

            // MONGODB
            try {
                await axios.post(`${CLIENT_BACKEND_URL}/update-case-status`, {
                    caseID, status: 'JUDGMENT_ISSUED', currentOrg: 'BenchClerksOrg',
                    timeline: [{
                        status: 'JUDGMENT_ISSUED', organization: 'JudgesOrg',
                        timestamp: new Date().toISOString(),
                        comments: `Final judgment issued by Judge ${judgmentDetails.judgeId || ''}: ${judgmentDetails.decision || ''}`
                    }]
                });
            } catch (mongoError) {
                logger.warn(`MongoDB update failed: ${mongoError.message}`);
            }

            return res.status(200).json({
                success: true,
                message: `Judgment recorded for case ${caseID} and synced`,
                data: { caseID, status: 'JUDGMENT_ISSUED', judgment: caseData.judgment }
            });
        } catch (error) {
            logger.error(`Error recording judgment: ${error.message}`);
            return res.status(500).json({ success: false, message: `Failed to record judgment: ${error.message}` });
        } finally {
            if (gateway1) await disconnectFromNetwork(gateway1);
            if (gateway2) await disconnectFromNetwork(gateway2);
            if (gateway3) await disconnectFromNetwork(gateway3);
        }
    },

    /**
     * Get judged cases from judge namespace
     */
    getJudgedCases: async (req, res) => {
        let gateway;
        try {
            const judgeConfig = config.fabric.judge;
            const { contract, gateway: g } = await connectToNetwork(
                judgeConfig.org, judgeConfig.user,
                judgeConfig.channelName, judgeConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetJudgedCases');
            const resultStr = result.toString();
            const cases = resultStr ? JSON.parse(resultStr) : [];
            logger.info(`Retrieved ${(cases || []).length} judged cases`);
            return res.status(200).json({ success: true, data: cases || [] });
        } catch (error) {
            logger.error(`Error getting judged cases: ${error.message}`);
            // Return empty array gracefully instead of 500
            return res.status(200).json({ success: true, data: [], message: 'No judged cases available' });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get case statistics from judge namespace
     */
    queryStats: async (req, res) => {
        let judgeGateway, bcGateway;
        try {
            const judgeConfig = config.fabric.judge;
            const benchClerkConfig = config.fabric.benchclerk;

            // 1. Get raw stats and all cases from judge namespace
            const { contract: judgeContract, gateway: jGateway } = await connectToNetwork(
                judgeConfig.org, judgeConfig.user,
                judgeConfig.channelName, judgeConfig.chaincodeName
            );
            judgeGateway = jGateway;

            const result = await judgeContract.evaluateTransaction('QueryStats');
            const resultStr = result.toString();
            const rawStats = resultStr ? JSON.parse(resultStr) : { pendingCases: 0, completedCases: 0, scheduledHearings: 0, judgmentsIssued: 0 };

            const allJudgeCasesResult = await judgeContract.evaluateTransaction('GetAllCases');
            const allJudgeCasesStr = allJudgeCasesResult.toString();
            const allJudgeCases = allJudgeCasesStr ? JSON.parse(allJudgeCasesStr) : [];
            const activeCasesCount = (allJudgeCases || []).filter(c =>
                c.status === 'RECEIVED_BY_JUDGE' || c.status === 'PENDING_JUDGE_REVIEW'
            ).length;

            // 2. Count pending cases from benchclerk namespace
            const { contract: bcContract, gateway: bGateway } = await connectToNetwork(
                benchClerkConfig.org, benchClerkConfig.user,
                judgeConfig.channelName, benchClerkConfig.chaincodeName
            );
            bcGateway = bGateway;

            const bcResult = await bcContract.evaluateTransaction('GetAllCases');
            const bcResultStr = bcResult.toString();
            const bcCases = bcResultStr ? JSON.parse(bcResultStr) : [];
            const pendingCasesCount = (bcCases || []).filter(c =>
                c.status === 'PENDING_JUDGE_REVIEW' ||
                c.status === 'FORWARDED_TO_JUDGE' ||
                (c.currentOrg === 'JudgesOrg' && !['JUDGMENT_ISSUED', 'RECEIVED_BY_JUDGE', 'DECISION_CONFIRMED'].includes(c.status))
            ).length;

            const stats = {
                totalCases: pendingCasesCount + activeCasesCount + (rawStats.judgmentsIssued || rawStats.completedCases || 0),
                pendingCases: pendingCasesCount,
                activeCases: activeCasesCount,
                judgedCases: rawStats.judgmentsIssued || rawStats.completedCases || 0
            };

            return res.status(200).json({ success: true, data: stats });
        } catch (error) {
            logger.error(`Error getting stats: ${error.message}`);
            return res.status(200).json({
                success: true,
                data: {
                    totalCases: 0,
                    pendingCases: 0,
                    activeCases: 0,
                    judgedCases: 0
                },
                message: 'Stats unavailable, returning defaults'
            });
        } finally {
            if (judgeGateway) await disconnectFromNetwork(judgeGateway);
            if (bcGateway) await disconnectFromNetwork(bcGateway);
        }
    }
};

module.exports = judgeController;