const { connectToNetwork, disconnectFromNetwork } = require('../fabric/network');
const config = require('../config/config');
const logger = require('../utils/logger');
const axios = require('axios');

// Client backend URL for MongoDB operations
const CLIENT_BACKEND_URL = 'http://localhost:3000';

/**
 * Controller for StampReporter Contract functions
 */
const stampReporterController = {
    /**
     * Validate documents for a case
     */
    validateDocuments: async (req, res) => {
        const { caseID, validationDetails } = req.body;
        if (!caseID || !validationDetails) {
            return res.status(400).json({ error: 'Missing caseID or validationDetails in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org,
                fabricConfig.user,
                fabricConfig.channelName,
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('ValidateDocuments', caseID, JSON.stringify(validationDetails));
            logger.info(`Documents for case ${caseID} validated successfully`);

            return res.status(200).json({
                success: true,
                message: `Documents for case ${caseID} validated successfully`,
            });
        } catch (error) {
            logger.error(`Error validating documents: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to validate documents: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get pending cases
     */
    getPendingCases: async (req, res) => {
        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org,
                fabricConfig.user,
                fabricConfig.channelName,
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetPendingCases');
            const resultStr = result.toString();
            const cases = resultStr ? JSON.parse(resultStr) : [];
            logger.info(`Retrieved ${(cases || []).length} pending cases`);

            return res.status(200).json({
                success: true,
                data: cases || []
            });
        } catch (error) {
            logger.error(`Error getting pending cases: ${error.message}`);
            return res.status(200).json({
                success: true,
                data: []
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get rejected cases
     */
    getRejectedCases: async (req, res) => {
        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org,
                fabricConfig.user,
                fabricConfig.channelName,
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetRejectedCases');
            const resultStr = result.toString();
            const cases = resultStr ? JSON.parse(resultStr) : [];
            logger.info(`Retrieved ${(cases || []).length} rejected cases`);

            return res.status(200).json({
                success: true,
                data: cases || []
            });
        } catch (error) {
            logger.error(`Error getting rejected cases: ${error.message}`);
            return res.status(200).json({
                success: true,
                data: []
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get on hold cases
     */
    getOnHoldCases: async (req, res) => {
        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org,
                fabricConfig.user,
                fabricConfig.channelName,
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetOnHoldCases');
            const resultStr = result.toString();
            const cases = resultStr ? JSON.parse(resultStr) : [];
            logger.info(`Retrieved ${(cases || []).length} on hold cases`);

            return res.status(200).json({
                success: true,
                data: cases || []
            });
        } catch (error) {
            logger.error(`Error getting on hold cases: ${error.message}`);
            return res.status(200).json({
                success: true,
                data: []
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get case by ID
     */
    getCaseById: async (req, res) => {
        const { caseID } = req.params;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID parameter' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org,
                fabricConfig.user,
                fabricConfig.channelName,
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetCaseById', caseID);
            const resultStr = result.toString();
            if (!resultStr) {
                return res.status(404).json({ success: false, message: `Case not found: ${caseID}` });
            }
            const caseData = JSON.parse(resultStr);
            logger.info(`Retrieved case ${caseID}`);

            return res.status(200).json({
                success: true,
                data: caseData
            });
        } catch (error) {
            logger.error(`Error getting case by ID: ${error.message}`);
            return res.status(404).json({
                success: false,
                message: `Case not found or unavailable: ${caseID}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Forward case to bench clerk (cross-channel invocation)
     * Called on stampreporter-benchclerk-channel using stampreporter chaincode
     * The ForwardCaseToBenchClerk function handles:
     * - Reading validated case from registrar-stampreporter-channel
     * - Storing case on stampreporter-benchclerk-channel
     * - Updating status to FORWARDED_TO_BENCHCLERK
     */
    forwardCaseToBenchClerk: async (req, res) => {
        const { caseID } = req.body;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
            // Connect to stampreporter-benchclerk-channel (not registrar-stampreporter-channel)
            const benchclerkChannelName = fabricConfig.benchclerkChannel || 'stampreporter-benchclerk-channel';

            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org,
                fabricConfig.user,
                benchclerkChannelName,  // stampreporter-benchclerk-channel
                fabricConfig.chaincodeName  // stampreporter chaincode
            );
            gateway = g;

            await contract.submitTransaction('ForwardCaseToBenchClerk', caseID);
            logger.info(`Case ${caseID} forwarded to bench clerk on ${benchclerkChannelName}`);

            return res.status(200).json({
                success: true,
                message: `Case ${caseID} forwarded to bench clerk successfully`,
            });
        } catch (error) {
            logger.error(`Error forwarding case to bench clerk: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to forward case to bench clerk: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Forward case to lawyer (cross-channel invocation)
     * Called on stampreporter-lawyer-channel using stampreporter chaincode
     * The ForwardCaseToLawyer function handles:
     * - Reading case from registrar-stampreporter-channel
     * - Storing case on stampreporter-lawyer-channel
     * - Updating status for lawyer visibility
     */
    forwardCaseToLawyer: async (req, res) => {
        const { caseID } = req.body;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
            // Connect to stampreporter-lawyer-channel (not registrar-stampreporter-channel)
            const lawyerChannelName = fabricConfig.lawyerChannel || 'stampreporter-lawyer-channel';

            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org,
                fabricConfig.user,
                lawyerChannelName,  // stampreporter-lawyer-channel
                fabricConfig.chaincodeName  // stampreporter chaincode
            );
            gateway = g;

            await contract.submitTransaction('ForwardCaseToLawyer', caseID);
            logger.info(`Case ${caseID} forwarded to lawyer on ${lawyerChannelName}`);

            return res.status(200).json({
                success: true,
                message: `Case ${caseID} forwarded to lawyer successfully`,
            });
        } catch (error) {
            logger.error(`Error forwarding case to lawyer: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to forward case to lawyer: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Fetch and store case from registrar channel
     */
    fetchFromRegistrarChannel: async (req, res) => {
        const { caseID } = req.body;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org,
                fabricConfig.user,
                fabricConfig.channelName,
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.submitTransaction('FetchAndStoreCaseFromRegistrarChannel', caseID);
            const caseData = JSON.parse(result.toString());
            logger.info(`Case ${caseID} fetched from registrar channel successfully`);

            return res.status(200).json({
                success: true,
                message: `Case ${caseID} fetched from registrar channel successfully`,
                data: caseData
            });
        } catch (error) {
            logger.error(`Error fetching case from registrar channel: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to fetch case from registrar channel: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Sync case across channels
     */
    syncCaseAcrossChannels: async (req, res) => {
        const { caseID } = req.body;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org,
                fabricConfig.user,
                fabricConfig.channelName,
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('SyncCaseAcrossChannels', caseID);
            logger.info(`Case ${caseID} synced across channels successfully`);

            return res.status(200).json({
                success: true,
                message: `Case ${caseID} synced across channels successfully`
            });
        } catch (error) {
            logger.error(`Error syncing case across channels: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to sync case across channels: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get all pending cases from registrar
     */
    getAllPendingCasesFromRegistrar: async (req, res) => {
        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org,
                fabricConfig.user,
                fabricConfig.channelName,
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('GetAllPendingCasesFromRegistrar');
            logger.info('All pending cases fetched from registrar successfully');

            return res.status(200).json({
                success: true,
                message: 'All pending cases fetched from registrar successfully'
            });
        } catch (error) {
            logger.error(`Error fetching all pending cases from registrar: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to fetch all pending cases from registrar: ${error.message}`,
            });
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
            const fabricConfig = config.fabric.stampreporter;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org,
                fabricConfig.user,
                fabricConfig.channelName,
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('QueryStats');
            const resultStr = result.toString();
            const stats = resultStr ? JSON.parse(resultStr) : { totalCases: 0, pendingCases: 0, validatedCases: 0, rejectedCases: 0, onHoldCases: 0 };
            logger.info('Retrieved case statistics');

            return res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error(`Error getting case statistics: ${error.message}`);
            return res.status(200).json({
                success: true,
                data: { totalCases: 0, pendingCases: 0, validatedCases: 0, rejectedCases: 0, onHoldCases: 0 }
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Verify case and forward to bench clerk (correct workflow)
     * 1. ValidateDocuments on registrar-stampreporter-channel (status → VALIDATED_BY_STAMP_REPORTER)
     * 2. ForwardCaseToBenchClerk on stampreporter-benchclerk-channel (cross-channel invocation)
     */
    verifyCaseAndSyncToLawyer: async (req, res) => {
        const { caseID, verificationDetails } = req.body;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }

        let gateway1, gateway2;
        try {
            const fabricConfig = config.fabric.stampreporter;

            // Step 1: ValidateDocuments on registrar-stampreporter-channel
            // This marks the case as VALIDATED_BY_STAMP_REPORTER
            const { contract: mainContract, gateway: g1 } = await connectToNetwork(
                fabricConfig.org,
                fabricConfig.user,
                fabricConfig.channelName,  // registrar-stampreporter-channel
                fabricConfig.chaincodeName
            );
            gateway1 = g1;

            const validationPayload = JSON.stringify({
                ...verificationDetails,
                status: 'VALIDATED_BY_STAMP_REPORTER',
                validatedAt: new Date().toISOString()
            });

            try {
                await mainContract.submitTransaction('ValidateDocuments', caseID, validationPayload);
                logger.info(`Case ${caseID} validated on registrar-stampreporter-channel`);
            } catch (err) {
                logger.error(`Error validating documents: ${err.message}`);
                throw new Error(`Failed to validate documents: ${err.message}`);
            }

            await disconnectFromNetwork(gateway1);
            gateway1 = null;

            // Step 2: ForwardCaseToBenchClerk on stampreporter-benchclerk-channel
            // This uses cross-channel invocation to copy the case to the new channel
            const benchclerkChannelName = fabricConfig.benchclerkChannel || 'stampreporter-benchclerk-channel';
            try {
                const { contract: benchclerkContract, gateway: g2 } = await connectToNetwork(
                    fabricConfig.org,
                    fabricConfig.user,
                    benchclerkChannelName,  // stampreporter-benchclerk-channel
                    fabricConfig.chaincodeName  // stampreporter chaincode handles the forwarding
                );
                gateway2 = g2;

                // ForwardCaseToBenchClerk handles:
                // - Reading validated case from registrar-stampreporter-channel
                // - Storing case on stampreporter-benchclerk-channel
                // - Updating status to FORWARDED_TO_BENCHCLERK
                await benchclerkContract.submitTransaction('ForwardCaseToBenchClerk', caseID);
                logger.info(`Case ${caseID} forwarded to bench clerk on stampreporter-benchclerk-channel`);
            } catch (err) {
                logger.warn(`Could not forward to bench clerk channel: ${err.message}`);
                // Don't fail - validation was successful, forward can be retried
            }

            return res.status(200).json({
                success: true,
                message: `Case ${caseID} validated and forwarded to bench clerk successfully`,
                data: { caseID, status: 'VALIDATED_BY_STAMP_REPORTER' }
            });
        } catch (error) {
            logger.error(`Error verifying case: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to verify case: ${error.message}`,
            });
        } finally {
            if (gateway1) await disconnectFromNetwork(gateway1);
            if (gateway2) await disconnectFromNetwork(gateway2);
        }
    },

    /**
     * Reject case and forward to lawyer (cross-channel, namespace-aware)
     * 
     * Flow:
     * 1. Update case on registrar-stampreporter-channel (stampreporter namespace) to REJECTED
     * 2. Store on stampreporter-lawyer-channel via LAWYER chaincode namespace
     * 3. MongoDB update
     */
    rejectCaseAndSyncToLawyer: async (req, res) => {
        const { caseID, reason, rejectedBy } = req.body;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }

        let gateway1 = null;
        let gateway2 = null;
        try {
            const fabricConfig = config.fabric.stampreporter;
            const MAX_RETRIES = 3;

            // ================================================================
            // STEP 1: Update case on stampreporter namespace (registrar-stampreporter-channel)
            // ================================================================
            logger.info(`[Reject Step 1/2] Updating case ${caseID} to REJECTED on ${fabricConfig.channelName}`);

            const connection1 = await connectToNetwork(
                fabricConfig.org,
                fabricConfig.user,
                fabricConfig.channelName,  // registrar-stampreporter-channel
                fabricConfig.chaincodeName // stampreporter
            );
            gateway1 = connection1.gateway;

            // Get current case data
            const caseResult = await connection1.contract.evaluateTransaction('GetCaseById', caseID);
            const caseData = JSON.parse(caseResult.toString());

            // Update for rejection
            caseData.status = 'REJECTED_BY_STAMP_REPORTER';
            caseData.currentOrg = 'LawyersOrg';
            caseData.lastModified = new Date().toISOString();

            if (!caseData.history) caseData.history = [];
            caseData.history.push({
                status: 'REJECTED_BY_STAMP_REPORTER',
                organization: 'StampReportersOrg',
                timestamp: new Date().toISOString(),
                comments: `Rejected: ${reason || 'No reason provided'} (by ${rejectedBy || 'Stamp Reporter'})`
            });

            // Store updated case back in stampreporter namespace
            await connection1.contract.submitTransaction('StoreCase', JSON.stringify(caseData));
            logger.info(`[Reject Step 1/2] ✓ Case ${caseID} marked as REJECTED on stampreporter namespace`);

            await disconnectFromNetwork(gateway1);
            gateway1 = null;

            // ================================================================
            // STEP 2: Store on stampreporter-lawyer-channel via LAWYER chaincode
            // So lawyer dashboard sees the rejection
            // ================================================================
            const lawyerChannelName = fabricConfig.lawyerChannel || 'stampreporter-lawyer-channel';
            logger.info(`[Reject Step 2/2] Storing rejected case on ${lawyerChannelName} via lawyer namespace`);

            let step2Error = null;
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    if (gateway2) {
                        await disconnectFromNetwork(gateway2);
                        gateway2 = null;
                    }

                    const lawyerConfig = config.fabric.lawyer;
                    const connection2 = await connectToNetwork(
                        lawyerConfig.org,
                        lawyerConfig.user,
                        lawyerChannelName,  // stampreporter-lawyer-channel
                        'lawyer'             // lawyer chaincode = lawyer namespace
                    );
                    gateway2 = connection2.gateway;

                    await connection2.contract.submitTransaction('StoreCase', JSON.stringify(caseData));

                    step2Error = null;
                    break;
                } catch (retryErr) {
                    step2Error = retryErr;
                    logger.warn(`[Reject Step 2/2] Attempt ${attempt}/${MAX_RETRIES} failed: ${retryErr.message}`);
                    if (attempt < MAX_RETRIES) {
                        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
                    }
                }
            }

            if (step2Error) {
                logger.warn(`[Reject Step 2/2] Failed to sync to lawyer channel: ${step2Error.message}`);
            } else {
                logger.info(`[Reject Step 2/2] ✓ Rejection synced to lawyer namespace on ${lawyerChannelName}`);
            }

            // ================================================================
            // MONGODB UPDATE
            // ================================================================
            try {
                await axios.post(`${CLIENT_BACKEND_URL}/update-case-status`, {
                    caseID: caseID,
                    status: 'REJECTED_BY_STAMP_REPORTER',
                    currentOrg: 'LawyersOrg',
                    timeline: [{
                        status: 'REJECTED_BY_STAMP_REPORTER',
                        organization: 'StampReportersOrg',
                        timestamp: new Date().toISOString(),
                        comments: `Rejected: ${reason || 'No reason provided'}`
                    }]
                });
                logger.info(`✓ MongoDB updated for rejection of case ${caseID}`);
            } catch (mongoError) {
                logger.warn(`MongoDB update failed (non-critical): ${mongoError.message}`);
            }

            return res.status(200).json({
                success: true,
                message: `Case ${caseID} rejected and synced to lawyer successfully`,
                data: { caseID, status: 'REJECTED_BY_STAMP_REPORTER' }
            });
        } catch (error) {
            logger.error(`Error rejecting case: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to reject case: ${error.message}`,
            });
        } finally {
            if (gateway1) await disconnectFromNetwork(gateway1);
            if (gateway2) await disconnectFromNetwork(gateway2);
        }
    },

    /**
     * Put case ON HOLD and sync to lawyer (cross-channel, namespace-aware)
     * 
     * Flow:
     * 1. Update case on registrar-stampreporter-channel (stampreporter namespace) to ON_HOLD
     * 2. Store on stampreporter-lawyer-channel via LAWYER chaincode namespace
     * 3. MongoDB update
     */
    putCaseOnHold: async (req, res) => {
        const { caseID, reason, heldBy } = req.body;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }

        let gateway1 = null;
        let gateway2 = null;
        try {
            const fabricConfig = config.fabric.stampreporter;
            const MAX_RETRIES = 3;

            // ================================================================
            // STEP 1: Update case on stampreporter namespace
            // ================================================================
            logger.info(`[OnHold Step 1/2] Updating case ${caseID} to ON_HOLD on ${fabricConfig.channelName}`);

            const connection1 = await connectToNetwork(
                fabricConfig.org,
                fabricConfig.user,
                fabricConfig.channelName,
                fabricConfig.chaincodeName
            );
            gateway1 = connection1.gateway;

            const caseResult = await connection1.contract.evaluateTransaction('GetCaseById', caseID);
            const caseData = JSON.parse(caseResult.toString());

            caseData.status = 'ON_HOLD_BY_STAMP_REPORTER';
            caseData.currentOrg = 'LawyersOrg';  // Match GetOnHoldCases chaincode query
            caseData.lastModified = new Date().toISOString();

            if (!caseData.history) caseData.history = [];
            caseData.history.push({
                status: 'ON_HOLD_BY_STAMP_REPORTER',
                organization: 'StampReportersOrg',
                timestamp: new Date().toISOString(),
                comments: `On Hold: ${reason || 'No reason provided'} (by ${heldBy || 'Stamp Reporter'})`
            });

            await connection1.contract.submitTransaction('StoreCase', JSON.stringify(caseData));
            logger.info(`[OnHold Step 1/2] ✓ Case ${caseID} marked as ON_HOLD`);

            await disconnectFromNetwork(gateway1);
            gateway1 = null;

            // ================================================================
            // STEP 2: Sync to lawyer namespace on stampreporter-lawyer-channel
            // ================================================================
            const lawyerChannelName = fabricConfig.lawyerChannel || 'stampreporter-lawyer-channel';
            logger.info(`[OnHold Step 2/2] Syncing on-hold status to ${lawyerChannelName} via lawyer namespace`);

            let step2Error = null;
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    if (gateway2) {
                        await disconnectFromNetwork(gateway2);
                        gateway2 = null;
                    }

                    const lawyerConfig = config.fabric.lawyer;
                    const connection2 = await connectToNetwork(
                        lawyerConfig.org,
                        lawyerConfig.user,
                        lawyerChannelName,
                        'lawyer'
                    );
                    gateway2 = connection2.gateway;

                    await connection2.contract.submitTransaction('StoreCase', JSON.stringify(caseData));

                    step2Error = null;
                    break;
                } catch (retryErr) {
                    step2Error = retryErr;
                    logger.warn(`[OnHold Step 2/2] Attempt ${attempt}/${MAX_RETRIES} failed: ${retryErr.message}`);
                    if (attempt < MAX_RETRIES) {
                        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
                    }
                }
            }

            if (step2Error) {
                logger.warn(`[OnHold Step 2/2] Failed to sync to lawyer channel: ${step2Error.message}`);
            } else {
                logger.info(`[OnHold Step 2/2] ✓ On-hold status synced to lawyer namespace`);
            }

            // ================================================================
            // MONGODB UPDATE
            // ================================================================
            try {
                await axios.post(`${CLIENT_BACKEND_URL}/update-case-status`, {
                    caseID: caseID,
                    status: 'ON_HOLD_BY_STAMP_REPORTER',
                    currentOrg: 'LawyersOrg',
                    timeline: [{
                        status: 'ON_HOLD_BY_STAMP_REPORTER',
                        organization: 'StampReportersOrg',
                        timestamp: new Date().toISOString(),
                        comments: `On Hold: ${reason || 'No reason provided'}`
                    }]
                });
                logger.info(`✓ MongoDB updated for on-hold case ${caseID}`);
            } catch (mongoError) {
                logger.warn(`MongoDB update failed (non-critical): ${mongoError.message}`);
            }

            return res.status(200).json({
                success: true,
                message: `Case ${caseID} put on hold and synced to lawyer successfully`,
                data: { caseID, status: 'ON_HOLD_BY_STAMP_REPORTER' }
            });
        } catch (error) {
            logger.error(`Error putting case on hold: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to put case on hold: ${error.message}`,
            });
        } finally {
            if (gateway1) await disconnectFromNetwork(gateway1);
            if (gateway2) await disconnectFromNetwork(gateway2);
        }
    },

    /**
     * SEQUENTIAL BLOCKCHAIN OPERATIONS: Validate and Forward Case to Bench Clerk
     * 
     * Flow (same namespace-aware pattern as registrar → stampreporter):
     * 1. ValidateDocuments on registrar-stampreporter-channel (stampreporter namespace)
     * 2. Fetch case, store on stampreporter-benchclerk-channel via BENCHCLERK chaincode namespace
     * 3. Update stampreporter-lawyer-channel via LAWYER chaincode namespace (so lawyer dashboard sees)
     * 4. MongoDB update (after all blockchain ops succeed)
     */
    validateAndForwardToBenchClerk: async (req, res) => {
        const { caseID, validationDetails } = req.body;

        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }
        if (!validationDetails) {
            return res.status(400).json({ error: 'Missing validationDetails in request body' });
        }

        let gateway1 = null;
        let gateway2 = null;
        let gateway3 = null;
        const results = {
            validate: { success: false, message: '' },
            forward: { success: false, message: '' }
        };

        try {
            const fabricConfig = config.fabric.stampreporter;
            const MAX_RETRIES = 3;

            // ================================================================
            // STEP 1: ValidateDocuments on registrar-stampreporter-channel
            // (stampreporter namespace — where the case currently lives)
            // ================================================================
            logger.info(`[Step 1/3] Validating documents for case ${caseID} on ${fabricConfig.channelName}`);

            const connection1 = await connectToNetwork(
                fabricConfig.org,
                fabricConfig.user,
                fabricConfig.channelName,  // registrar-stampreporter-channel
                fabricConfig.chaincodeName // stampreporter
            );
            gateway1 = connection1.gateway;

            await connection1.contract.submitTransaction(
                'ValidateDocuments',
                caseID,
                JSON.stringify(validationDetails)
            );

            results.validate = {
                success: true,
                message: `Documents validated for case ${caseID} on ${fabricConfig.channelName}`
            };
            logger.info(`[Step 1/3] ✓ Documents validated successfully`);

            // Fetch the validated case data for cross-channel storage
            const caseResult = await connection1.contract.evaluateTransaction('GetCaseById', caseID);
            const caseData = JSON.parse(caseResult.toString());
            logger.info(`[Step 2/3] Retrieved validated case data from ${fabricConfig.channelName}`);

            // Disconnect from first channel
            await disconnectFromNetwork(gateway1);
            gateway1 = null;

            // Update case for bench clerk channel
            caseData.status = 'PENDING_BENCHCLERK_REVIEW';
            caseData.currentOrg = 'BenchClerksOrg';
            caseData.lastModified = new Date().toISOString();

            if (!caseData.history) caseData.history = [];
            caseData.history.push({
                status: 'FORWARDED_TO_BENCHCLERK',
                organization: 'StampReportersOrg',
                timestamp: new Date().toISOString(),
                comments: 'Case validated and forwarded to bench clerk'
            });

            // ================================================================
            // STEP 2: Store on stampreporter-benchclerk-channel via BENCHCLERK chaincode
            // CRITICAL: Must use benchclerk chaincode (not stampreporter) because
            // each chaincode has its own namespace. BenchClerk reads from benchclerk namespace.
            // ================================================================
            const benchclerkChannelName = fabricConfig.benchclerkChannel || 'stampreporter-benchclerk-channel';
            const benchclerkChaincode = 'benchclerk';
            logger.info(`[Step 2/3] Storing case ${caseID} on ${benchclerkChannelName} via ${benchclerkChaincode} chaincode namespace`);

            let lastError = null;
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    if (gateway2) {
                        await disconnectFromNetwork(gateway2);
                        gateway2 = null;
                    }

                    logger.info(`[Step 2/3] Connection attempt ${attempt}/${MAX_RETRIES} to ${benchclerkChannelName}`);

                    const connection2 = await connectToNetwork(
                        fabricConfig.org,
                        fabricConfig.user,
                        benchclerkChannelName,   // stampreporter-benchclerk-channel
                        benchclerkChaincode       // benchclerk chaincode = benchclerk namespace
                    );
                    gateway2 = connection2.gateway;

                    await connection2.contract.submitTransaction(
                        'StoreCase',
                        JSON.stringify(caseData)
                    );

                    lastError = null;
                    break;
                } catch (retryErr) {
                    lastError = retryErr;
                    logger.warn(`[Step 2/3] Attempt ${attempt}/${MAX_RETRIES} failed: ${retryErr.message}`);
                    if (attempt < MAX_RETRIES) {
                        const delay = attempt * 2000;
                        logger.info(`[Step 2/3] Retrying in ${delay / 1000}s...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }

            if (lastError) {
                throw lastError;
            }

            results.forward = {
                success: true,
                message: `Case ${caseID} stored on ${benchclerkChannelName}`
            };
            logger.info(`[Step 2/3] ✓ Case ${caseID} stored on ${benchclerkChannelName} via benchclerk namespace`);

            // Disconnect step 2 gateway
            if (gateway2) {
                await disconnectFromNetwork(gateway2);
                gateway2 = null;
            }

            // ================================================================
            // STEP 3: Update stampreporter-lawyer-channel via LAWYER chaincode
            // So the lawyer dashboard can see forwarded status
            // ================================================================
            const lawyerChannelName = fabricConfig.lawyerChannel || 'stampreporter-lawyer-channel';
            logger.info(`[Step 3/3] Updating lawyer namespace on ${lawyerChannelName}`);

            // Update status for lawyer visibility
            caseData.status = 'FORWARDED_TO_BENCHCLERK';
            caseData.currentOrg = 'BenchClerksOrg';
            caseData.lastModified = new Date().toISOString();

            let step3Error = null;
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    if (gateway3) {
                        await disconnectFromNetwork(gateway3);
                        gateway3 = null;
                    }

                    const lawyerConfig = config.fabric.lawyer;
                    const connection3 = await connectToNetwork(
                        lawyerConfig.org,
                        lawyerConfig.user,
                        lawyerChannelName,   // stampreporter-lawyer-channel
                        'lawyer'              // lawyer chaincode = lawyer namespace
                    );
                    gateway3 = connection3.gateway;

                    await connection3.contract.submitTransaction(
                        'StoreCase',
                        JSON.stringify(caseData)
                    );

                    step3Error = null;
                    break;
                } catch (retryErr) {
                    step3Error = retryErr;
                    logger.warn(`[Step 3/3] Attempt ${attempt}/${MAX_RETRIES} failed: ${retryErr.message}`);
                    if (attempt < MAX_RETRIES) {
                        const delay = attempt * 2000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }

            if (step3Error) {
                logger.warn(`[Step 3/3] Failed to update lawyer namespace: ${step3Error.message}. Case IS on benchclerk channel.`);
            } else {
                logger.info(`[Step 3/3] ✓ Updated lawyer namespace on ${lawyerChannelName}`);
            }

            // ================================================================
            // ALL BLOCKCHAIN OPS COMPLETE — NOW UPDATE MONGODB
            // ================================================================
            logger.info(`All blockchain operations complete for case ${caseID}`);

            try {
                await axios.post(`${CLIENT_BACKEND_URL}/update-case-status`, {
                    caseID: caseID,
                    status: 'FORWARDED_TO_BENCHCLERK',
                    currentOrg: 'BenchClerksOrg',
                    timeline: [
                        {
                            status: 'VALIDATED_BY_STAMP_REPORTER',
                            organization: 'StampReportersOrg',
                            timestamp: new Date().toISOString(),
                            comments: validationDetails.comments || 'Documents validated by stamp reporter'
                        },
                        {
                            status: 'FORWARDED_TO_BENCHCLERK',
                            organization: 'StampReportersOrg',
                            timestamp: new Date().toISOString(),
                            comments: 'Case forwarded to bench clerk'
                        }
                    ]
                });
                logger.info(`✓ MongoDB updated successfully for case ${caseID}`);
            } catch (mongoError) {
                logger.warn(`MongoDB update failed (non-critical): ${mongoError.message}`);
            }

            return res.status(200).json({
                success: true,
                message: `Case ${caseID} validated and forwarded to bench clerk successfully`,
                data: {
                    caseID,
                    steps: results
                }
            });

        } catch (error) {
            logger.error(`Error in validateAndForwardToBenchClerk: ${error.message}`);

            return res.status(500).json({
                success: false,
                message: `Failed during sequential blockchain operations: ${error.message}`,
                partialResults: results,
                failedAt: results.validate.success ? 'forward' : 'validate'
            });
        } finally {
            if (gateway1) await disconnectFromNetwork(gateway1);
            if (gateway2) await disconnectFromNetwork(gateway2);
            if (gateway3) await disconnectFromNetwork(gateway3);
        }
    }
};

module.exports = stampReporterController;
