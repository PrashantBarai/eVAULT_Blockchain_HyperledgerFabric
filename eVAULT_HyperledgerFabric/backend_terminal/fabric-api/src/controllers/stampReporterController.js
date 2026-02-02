const { connectToNetwork, disconnectFromNetwork } = require('../fabric/network');
const config = require('../config/config');
const logger = require('../utils/logger');

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
            const cases = JSON.parse(result.toString());
            logger.info(`Retrieved ${cases.length} pending cases`);
            
            return res.status(200).json({
                success: true,
                data: cases
            });
        } catch (error) {
            logger.error(`Error getting pending cases: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get pending cases: ${error.message}`,
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
            const cases = JSON.parse(result.toString());
            logger.info(`Retrieved ${cases.length} rejected cases`);
            
            return res.status(200).json({
                success: true,
                data: cases
            });
        } catch (error) {
            logger.error(`Error getting rejected cases: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get rejected cases: ${error.message}`,
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
            const cases = JSON.parse(result.toString());
            logger.info(`Retrieved ${cases.length} on hold cases`);
            
            return res.status(200).json({
                success: true,
                data: cases
            });
        } catch (error) {
            logger.error(`Error getting on hold cases: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get on hold cases: ${error.message}`,
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
            const caseData = JSON.parse(result.toString());
            logger.info(`Retrieved case ${caseID}`);
            
            return res.status(200).json({
                success: true,
                data: caseData
            });
        } catch (error) {
            logger.error(`Error getting case by ID: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get case: ${error.message}`,
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
            const stats = JSON.parse(result.toString());
            logger.info('Retrieved case statistics');
            
            return res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error(`Error getting case statistics: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get case statistics: ${error.message}`,
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
     * Reject case and sync status to lawyer channel (cross-channel)
     */
    rejectCaseAndSyncToLawyer: async (req, res) => {
        const { caseID, reason, rejectedBy } = req.body;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }

        let gateway1, gateway2;
        try {
            const fabricConfig = config.fabric.stampreporter;
            
            // Step 1: Reject case on registrar-stampreporter-channel
            const { contract: mainContract, gateway: g1 } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName,  // registrar-stampreporter-channel
                fabricConfig.chaincodeName
            );
            gateway1 = g1;

            const rejectionDetails = {
                status: 'REJECTED_BY_STAMP_REPORTER',
                reason: reason || 'No reason provided',
                rejectedBy: rejectedBy || 'Stamp Reporter',
                rejectedAt: new Date().toISOString()
            };
            
            try {
                await mainContract.submitTransaction('RejectCase', caseID, JSON.stringify(rejectionDetails));
                logger.info(`Case ${caseID} rejected on registrar-stampreporter-channel`);
            } catch (err) {
                // Try alternative function
                try {
                    await mainContract.submitTransaction('UpdateCaseStatus', caseID, 'REJECTED_BY_STAMP_REPORTER');
                    logger.info(`Case ${caseID} status updated to rejected`);
                } catch (err2) {
                    logger.error(`Error rejecting case: ${err2.message}`);
                    throw new Error(`Failed to reject case: ${err2.message}`);
                }
            }

            await disconnectFromNetwork(gateway1);
            gateway1 = null;

            // Step 2: Sync rejection to stampreporter-lawyer-channel
            const lawyerChannelName = fabricConfig.lawyerChannel || 'stampreporter-lawyer-channel';
            try {
                const { contract: lawyerContract, gateway: g2 } = await connectToNetwork(
                    fabricConfig.org, 
                    fabricConfig.user, 
                    lawyerChannelName,
                    'lawyer'
                );
                gateway2 = g2;

                await lawyerContract.submitTransaction('UpdateCaseStatus', caseID, 'REJECTED_BY_STAMP_REPORTER');
                logger.info(`Rejection synced to stampreporter-lawyer-channel`);
            } catch (err) {
                logger.warn(`Could not sync rejection to lawyer channel: ${err.message}`);
            }
            
            return res.status(200).json({
                success: true,
                message: `Case ${caseID} rejected and synced successfully`,
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
     * SEQUENTIAL BLOCKCHAIN OPERATIONS: Validate and Forward Case to Bench Clerk
     * 
     * This endpoint performs multiple blockchain operations in sequence:
     * 1. ValidateDocuments on registrar-stampreporter-channel (marks case as VALIDATED_BY_STAMP_REPORTER)
     * 2. ForwardCaseToBenchClerk on stampreporter-benchclerk-channel (cross-channel transfer)
     * 
     * The lawyer dashboard aggregates data from multiple channels to show complete timeline.
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
        const results = {
            validate: { success: false, message: '' },
            forward: { success: false, message: '' }
        };

        try {
            const fabricConfig = config.fabric.stampreporter;
            
            // ================================================================
            // STEP 1: ValidateDocuments on registrar-stampreporter-channel
            // ================================================================
            logger.info(`[Step 1/2] Validating documents for case ${caseID} on ${fabricConfig.channelName}`);
            
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
            logger.info(`[Step 1/2] ✓ Documents validated successfully`);
            
            // Disconnect from first channel before connecting to second
            await disconnectFromNetwork(gateway1);
            gateway1 = null;

            // ================================================================
            // STEP 2: ForwardCaseToBenchClerk on stampreporter-benchclerk-channel
            // ================================================================
            const benchclerkChannelName = fabricConfig.benchclerkChannel || 'stampreporter-benchclerk-channel';
            logger.info(`[Step 2/2] Forwarding case ${caseID} to ${benchclerkChannelName}`);
            
            const connection2 = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                benchclerkChannelName,  // stampreporter-benchclerk-channel
                fabricConfig.chaincodeName // stampreporter
            );
            gateway2 = connection2.gateway;

            await connection2.contract.submitTransaction(
                'ForwardCaseToBenchClerk', 
                caseID
            );
            
            results.forward = {
                success: true,
                message: `Case ${caseID} forwarded to ${benchclerkChannelName}`
            };
            logger.info(`[Step 2/2] ✓ Case ${caseID} forwarded to bench clerk successfully`);
            
            // ================================================================
            // ALL BLOCKCHAIN OPERATIONS COMPLETE
            // ================================================================
            logger.info(`All blockchain operations complete for case ${caseID}`);
            
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
            
            // Return partial results so frontend knows what succeeded/failed
            return res.status(500).json({
                success: false,
                message: `Failed during sequential blockchain operations: ${error.message}`,
                partialResults: results,
                failedAt: results.validate.success ? 'forward' : 'validate'
            });
        } finally {
            if (gateway1) await disconnectFromNetwork(gateway1);
            if (gateway2) await disconnectFromNetwork(gateway2);
        }
    }
};

module.exports = stampReporterController;
